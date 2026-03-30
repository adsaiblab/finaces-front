import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CasesListComponent, ProcessStep } from './cases-list.component';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CaseService } from '../../../core/services/case.service';
import { of } from 'rxjs';
import { EvaluationCaseOut } from '../../../core/models/case.model';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CasesListComponent (Matrix Tracker)', () => {
  let component: CasesListComponent;
  let fixture: ComponentFixture<CasesListComponent>;
  let router: Router;
  let mockCaseService: any;

  const MOCK_BACKEND_DATA: Partial<EvaluationCaseOut>[] = [
    { id: 'ca-9871x-12po', bidder_name: 'DurocDynamics GmbH', status: 'SCORED' as any, updated_at: '2026-03-26T09:12:00Z' },
    { id: 'ca-1029y-90al', bidder_name: 'Titan Constructors', status: 'SCORED' as any, updated_at: '2026-03-25T14:30:00Z' },
    { id: 'ca-0912x-77wq', bidder_name: 'Nexus Infrastructure', status: 'DRAFT' as any, updated_at: '2026-03-26T11:00:00Z' },
    { id: 'ca-4458z-88tr', bidder_name: 'NovaTech Supplies', status: 'GATE_SEALED' as any, updated_at: '2026-03-24T16:45:00Z' },
    { id: 'ca-8831y-55mn', bidder_name: 'Aeris Holdings', status: 'EXPERT_REVIEWED' as any, updated_at: '2026-03-20T10:15:00Z' },
  ];

  beforeEach(async () => {
    mockCaseService = {
      getCases: vi.fn().mockReturnValue(of(MOCK_BACKEND_DATA)),
    };

    await TestBed.configureTestingModule({
      imports: [CasesListComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CaseService, useValue: mockCaseService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('should create Evaluation Hub', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load backend data and resolve loading state', async () => {
    fixture.detectChanges(); // ngOnInit -> loadCases
    
    // Since 'of()' is synchronous, the data should be there immediately
    expect(component.isLoading()).toBe(false);
    expect(component.cases().length).toBe(5);
  });

  it('should filter cases by specific filter modes', async () => {
    fixture.detectChanges();

    // "ALL" by default
    expect(component.filteredCases().length).toBe(5);

    // "PENDING_GATE" filter
    component.setFilterMode('PENDING_GATE');
    fixture.detectChanges();
    expect(component.filterMode()).toBe('PENDING_GATE');
    // Nexus Infrastructure (DRAFT) maps to gate ACTIVE
    expect(component.filteredCases().length).toBe(1); 

    // "READY_REPORT" filter
    component.setFilterMode('READY_REPORT');
    fixture.detectChanges();
    // Aeris Holdings (EXPERT_REVIEWED) maps to report ACTIVE
    expect(component.filteredCases().length).toBe(1); 
  });

  it('should route to correct step target when goToStep is called with ACTIVE/COMPLETED step', () => {
    fixture.detectChanges();
    const mockStep: ProcessStep = {
      id: 'financials',
      name: 'Fin.',
      status: 'ACTIVE',
      targetRoute: 'financials',
    };
    component.goToStep('ca-1234', mockStep);
    expect(router.navigate).toHaveBeenCalledWith(['/cases', 'ca-1234', 'financials']);
  });

  it('should NOT route when goToStep is called with LOCKED step', () => {
    fixture.detectChanges();
    const mockStep: ProcessStep = {
      id: 'scoring',
      name: 'Scor.',
      status: 'LOCKED',
      targetRoute: 'tension',
    };
    component.goToStep('ca-1234', mockStep);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
