import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CaseService } from '../../core/services/case.service';
import { ThemeService } from '../../core/services/theme/theme.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConvergenceChartOut } from '../../core/models/dashboard.model';
import { By } from '@angular/platform-browser';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockCaseService: any;

  const mockStats = { total_cases: 10, pending_cases: 3, approved_cases: 5, rejected_cases: 2 };
  const mockCases = [{ id: 'case-1', company_name: 'ACME', status: 'PENDING' }];

  const mockConvergenceData: ConvergenceChartOut = {
    dates: ['2026-03-01'],
    mcc_scores: [1],
    ia_scores: [1],
    divergence_flags: [false],
    correlation: 0.9,
    convergence_percentage: 90,
  };

  // ─── Helpers ────────────────────────────────────────────────────
  async function buildComponent(serviceOverrides?: Partial<typeof mockCaseService>) {
    mockCaseService = {
      getDashboardStats:      vi.fn().mockReturnValue(of(mockStats)),
      getRecentCases:         vi.fn().mockReturnValue(of(mockCases)),
      getConvergenceChart:    vi.fn().mockReturnValue(of(mockConvergenceData)),
      getActiveTensionCases:  vi.fn().mockReturnValue(of([])),
      ...serviceOverrides,
    };

    // CORRECTIF JSDOM
    HTMLCanvasElement.prototype.getContext = vi.fn() as any;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideAnimations(),
        { provide: CaseService, useValue: mockCaseService },
        { provide: ThemeService, useValue: { isDarkMode: () => false, toggleTheme: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await buildComponent();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // ─── Création de base ─────────────────────────────────────────
  it('devrait créer le composant dashboard', () => {
    expect(component).toBeTruthy();
  });

  it('devrait initialiser tous les signals d’erreur à null', () => {
    expect(component.statsError()).toBeNull();
    expect(component.casesError()).toBeNull();
    expect(component.tensionsError()).toBeNull();
    expect(component.chartError()).toBeNull();
  });

  it('devrait initialiser tous les compteurs retry à 0', () => {
    expect(component.statsRetryCount()).toBe(0);
    expect(component.casesRetryCount()).toBe(0);
    expect(component.tensionsRetryCount()).toBe(0);
    expect(component.chartRetryCount()).toBe(0);
  });

  // ─── Gestion des erreurs API ──────────────────────────────────
  it('devrait positionner statsError="server" lorsque getDashboardStats échoue', async () => {
    TestBed.resetTestingModule();
    await buildComponent({
      getDashboardStats: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    expect(component.statsError()).toBe('server');
  });

  it('devrait positionner casesError="server" lorsque getRecentCases échoue', async () => {
    TestBed.resetTestingModule();
    await buildComponent({
      getRecentCases: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    expect(component.casesError()).toBe('server');
  });

  it('devrait positionner tensionsError="server" lorsque getActiveTensionCases échoue', async () => {
    TestBed.resetTestingModule();
    await buildComponent({
      getActiveTensionCases: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    expect(component.tensionsError()).toBe('server');
  });

  it('devrait positionner chartError="server" lorsque getConvergenceChart échoue', async () => {
    TestBed.resetTestingModule();
    await buildComponent({
      getConvergenceChart: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    expect(component.chartError()).toBe('server');
  });

  // ─── Handlers retry ───────────────────────────────────────────
  it('onRetryStats() devrait incrémenter statsRetryCount et vider statsError', () => {
    component.statsError.set('server');
    component.onRetryStats();
    expect(component.statsRetryCount()).toBe(1);
    expect(component.statsError()).toBeNull();
  });

  it('onRetryCases() devrait incrémenter casesRetryCount et vider casesError', () => {
    component.casesError.set('server');
    component.onRetryCases();
    expect(component.casesRetryCount()).toBe(1);
    expect(component.casesError()).toBeNull();
  });

  it('onRetryTensions() devrait incrémenter tensionsRetryCount et vider tensionsError', () => {
    component.tensionsError.set('server');
    component.onRetryTensions();
    expect(component.tensionsRetryCount()).toBe(1);
    expect(component.tensionsError()).toBeNull();
  });

  it('onRetryChart() devrait incrémenter chartRetryCount et vider chartError', () => {
    component.chartError.set('server');
    component.onRetryChart();
    expect(component.chartRetryCount()).toBe(1);
    expect(component.chartError()).toBeNull();
  });

  // ─── Rendu template — bouton new-case ─────────────────────────────
  it('devrait afficher le bouton « Nouveau dossier » avec data-testid', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="dashboard-new-case-btn"]'));
    expect(btn).toBeTruthy();
  });
});
