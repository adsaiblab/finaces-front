import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CasesListComponent, ProcessStep } from './cases-list.component';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CaseService } from '../../../core/services/case.service';
import { of, throwError } from 'rxjs';
import { EvaluationCaseOut } from '../../../core/models/case.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CasesListComponent (Matrix Tracker)', () => {
  let component: CasesListComponent;
  let fixture: ComponentFixture<CasesListComponent>;
  let router: Router;
  let mockCaseService: { getCases: ReturnType<typeof vi.fn> };

  const MOCK_BACKEND_DATA: Partial<EvaluationCaseOut>[] = [
    { id: 'ca-9871x-12po', bidder_name: 'DurocDynamics GmbH',    status: 'SCORED'          as any, updated_at: '2026-03-26T09:12:00Z' },
    { id: 'ca-1029y-90al', bidder_name: 'Titan Constructors',    status: 'SCORED'          as any, updated_at: '2026-03-25T14:30:00Z' },
    { id: 'ca-0912x-77wq', bidder_name: 'Nexus Infrastructure',  status: 'DRAFT'           as any, updated_at: '2026-03-26T11:00:00Z' },
    { id: 'ca-4458z-88tr', bidder_name: 'NovaTech Supplies',     status: 'GATE_SEALED'     as any, updated_at: '2026-03-24T16:45:00Z' },
    { id: 'ca-8831y-55mn', bidder_name: 'Aeris Holdings',        status: 'EXPERT_REVIEWED' as any, updated_at: '2026-03-20T10:15:00Z' },
  ];

  const setupTestBed = async (getCasesImpl: () => any) => {
    mockCaseService = { getCases: vi.fn().mockImplementation(getCasesImpl) };

    await TestBed.configureTestingModule({
      imports: [CasesListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CaseService, useValue: mockCaseService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  };

  // ===========================================================
  // Cas nominal
  // ===========================================================
  describe('chargement nominal', () => {
    beforeEach(async () => setupTestBed(() => of(MOCK_BACKEND_DATA)));

    it('should create Evaluation Hub', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should load backend data and resolve loading state', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
      expect(component.loadError()).toBeNull();
      expect(component.cases().length).toBe(5);
    });

    it('hasNoCasesAtAll should be false when cases are loaded', () => {
      fixture.detectChanges();
      expect(component.hasNoCasesAtAll()).toBe(false);
    });

    it('should filter cases by PENDING_GATE', () => {
      fixture.detectChanges();
      component.setFilterMode('PENDING_GATE');
      fixture.detectChanges();
      // Nexus Infrastructure (DRAFT) → gate ACTIVE
      expect(component.filteredCases().length).toBe(1);
    });

    it('should filter cases by READY_REPORT', () => {
      fixture.detectChanges();
      component.setFilterMode('READY_REPORT');
      fixture.detectChanges();
      // Aeris Holdings (EXPERT_REVIEWED) → report ACTIVE
      expect(component.filteredCases().length).toBe(1);
    });

    it('should navigate on ACTIVE step', () => {
      fixture.detectChanges();
      const step: ProcessStep = { id: 'financials', name: 'Financiers & Ratios', status: 'ACTIVE', targetRoute: 'financials' };
      component.goToStep('ca-1234', step);
      expect(router.navigate).toHaveBeenCalledWith(['/cases', 'ca-1234', 'financials']);
    });

    it('should NOT navigate on LOCKED step', () => {
      fixture.detectChanges();
      const step: ProcessStep = { id: 'scoring', name: 'Scoring & Tension', status: 'LOCKED', targetRoute: 'tension' };
      component.goToStep('ca-1234', step);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ===========================================================
  // Base vide (0 dossiers en base, pas d’erreur)
  // ===========================================================
  describe('base vide', () => {
    beforeEach(async () => setupTestBed(() => of([])));

    it('should set hasNoCasesAtAll to true when server returns empty list', () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
      expect(component.loadError()).toBeNull();
      expect(component.cases().length).toBe(0);
      expect(component.hasNoCasesAtAll()).toBe(true);
    });

    it('retryCount should remain 0 after successful empty load', () => {
      fixture.detectChanges();
      expect(component.retryCount()).toBe(0);
    });
  });

  // ===========================================================
  // Erreur API
  // ===========================================================
  describe('erreur API', () => {
    beforeEach(async () => setupTestBed(() => throwError(() => new Error('500'))));

    it("should set loadError to 'server' on API error", () => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
      expect(component.loadError()).toBe('server');
    });

    it('should set cases to [] on API error', () => {
      fixture.detectChanges();
      expect(component.cases().length).toBe(0);
    });

    it('hasNoCasesAtAll should be false on error (error ≠ empty list)', () => {
      fixture.detectChanges();
      // loadError !== null → hasNoCasesAtAll = false
      expect(component.hasNoCasesAtAll()).toBe(false);
    });
  });

  // ===========================================================
  // Retry
  // ===========================================================
  describe('onRetryLoad', () => {
    it('should increment retryCount and reload cases on success', async () => {
      // Premier appel : erreur
      await setupTestBed(() => throwError(() => new Error('500')));
      fixture.detectChanges();
      expect(component.retryCount()).toBe(0);
      expect(component.loadError()).toBe('server');

      // Retry : succès
      mockCaseService.getCases.mockReturnValue(of(MOCK_BACKEND_DATA));
      component.onRetryLoad();
      fixture.detectChanges();

      expect(component.retryCount()).toBe(1);
      expect(component.loadError()).toBeNull();
      expect(component.cases().length).toBe(5);
    });

    it('should keep accumulating retryCount across multiple retries', async () => {
      await setupTestBed(() => throwError(() => new Error('500')));
      fixture.detectChanges();

      component.onRetryLoad();
      component.onRetryLoad();
      fixture.detectChanges();

      expect(component.retryCount()).toBe(2);
    });
  });
});
