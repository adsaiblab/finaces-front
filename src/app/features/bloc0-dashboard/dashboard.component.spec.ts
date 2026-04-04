import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CaseService } from '../../core/services/case.service';
import { ThemeService } from '../../core/services/theme/theme.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConvergenceChartOut, TensionAlertOut } from '../../core/models/dashboard.model';
import { By } from '@angular/platform-browser';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockCaseService: any;

  const mockStats = { total_cases: 10, pending_cases: 3, approved_cases: 5, rejected_cases: 2 };
  const mockCases = [{ id: 'case-1', company_name: 'ACME', status: 'PENDING' }];
  const mockTensions: TensionAlertOut[] = [
    { case_id: 'c1', company_name: 'ACME', tension_level: 'SEVERE', delta_score: 1.2 } as any,
  ];

  const mockConvergenceData: ConvergenceChartOut = {
    dates: ['2026-03-01'],
    mcc_scores: [1],
    ia_scores: [1],
    divergence_flags: [false],
    correlation: 0.9,
    convergence_percentage: 90,
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  async function buildComponent(serviceOverrides?: Partial<typeof mockCaseService>) {
    mockCaseService = {
      getDashboardStats:     vi.fn().mockReturnValue(of(mockStats)),
      getRecentCases:        vi.fn().mockReturnValue(of(mockCases)),
      getConvergenceChart:   vi.fn().mockReturnValue(of(mockConvergenceData)),
      getActiveTensionCases: vi.fn().mockReturnValue(of([])),
      ...serviceOverrides,
    };

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

  // ─── Création de base ───────────────────────────────────────────────────────────
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

  // ─── Loading signals ──────────────────────────────────────────────────────────
  it('isKpiLoading() devrait être false après émission du stream stats', () => {
    // of() émet de manière synchrone — tap() résout le signal immédiatement
    expect(component.isKpiLoading()).toBe(false);
  });

  it('isCasesLoading() devrait être false après émission du stream cases', () => {
    expect(component.isCasesLoading()).toBe(false);
  });

  it('isTensionsLoading() devrait être false après émission du stream tensions', () => {
    expect(component.isTensionsLoading()).toBe(false);
  });

  it('isChartLoading() devrait être false après émission du stream chart', () => {
    expect(component.isChartLoading()).toBe(false);
  });

  it('isKpiLoading() reste true si le stream stats ne s\'est pas encore résolu', async () => {
    TestBed.resetTestingModule();
    // Subject ne émet pas immédiatement — simule un stream en attente
    const pendingStats$ = new Subject();
    await buildComponent({ getDashboardStats: vi.fn().mockReturnValue(pendingStats$) });
    // Ne pas appeler pendingStats$.next() → signal reste true
    expect(component.isKpiLoading()).toBe(true);
  });

  // ─── tensionsLoaded + computed ────────────────────────────────────────────────────
  it('tensionsLoaded() devrait être vide quand getActiveTensionCases retourne []', () => {
    expect(component.tensionsLoaded()).toEqual([]);
  });

  it('tensionsEmpty() devrait être true quand tensions = [] et pas d’erreur', () => {
    expect(component.tensionsEmpty()).toBe(true);
  });

  it('hasTensionsData() devrait être false quand tensions = []', () => {
    expect(component.hasTensionsData()).toBe(false);
  });

  it('tensionsLoaded() devrait contenir les données reçues', async () => {
    TestBed.resetTestingModule();
    await buildComponent({ getActiveTensionCases: vi.fn().mockReturnValue(of(mockTensions)) });
    expect(component.tensionsLoaded()).toEqual(mockTensions);
    expect(component.hasTensionsData()).toBe(true);
    expect(component.tensionsEmpty()).toBe(false);
  });

  // ─── Gestion des erreurs API ────────────────────────────────────────────────────
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

  it('isTensionsLoading() devrait être false même quand getActiveTensionCases échoue', async () => {
    TestBed.resetTestingModule();
    await buildComponent({
      getActiveTensionCases: vi.fn().mockReturnValue(throwError(() => new Error('500'))),
    });
    expect(component.isTensionsLoading()).toBe(false);
  });

  // ─── Handlers retry ────────────────────────────────────────────────────────────
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

  // ─── Rendu template ───────────────────────────────────────────────────────────────
  it('devrait afficher le bouton « Nouveau dossier » avec data-testid', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="dashboard-new-case-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('devrait afficher le skeleton KPI pendant le chargement (stream en attente)', async () => {
    TestBed.resetTestingModule();
    const pendingStats$ = new Subject();
    await buildComponent({ getDashboardStats: vi.fn().mockReturnValue(pendingStats$) });
    fixture.detectChanges();
    const skeleton = fixture.debugElement.query(By.css('[data-testid="dashboard-kpi-skeleton"]'));
    expect(skeleton).toBeTruthy();
  });

  it('devrait afficher l\'empty-state tensions quand la liste est vide', () => {
    // isTensionsLoading() = false (stream émis), tensionsLoaded() = [] → tensionsEmpty() = true
    fixture.detectChanges();
    const emptyState = fixture.debugElement.query(By.css('[data-testid="dashboard-tensions-empty"]'));
    expect(emptyState).toBeTruthy();
  });

  it('devrait afficher la carte tensions quand des données sont présentes', async () => {
    TestBed.resetTestingModule();
    await buildComponent({ getActiveTensionCases: vi.fn().mockReturnValue(of(mockTensions)) });
    fixture.detectChanges();
    const card = fixture.debugElement.query(By.css('[data-testid="dashboard-tensions-card"]'));
    expect(card).toBeTruthy();
  });
});
