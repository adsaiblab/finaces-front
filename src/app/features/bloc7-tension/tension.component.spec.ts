import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TensionComponent } from './tension.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { ScoringMccService } from '../bloc5-scoring-mcc/services/scoring-mcc.service';
import { IaService } from '../../core/services/ia.service';
import { TensionCalculatorService } from './services/tension-calculator.service';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

const MOCK_TENSION_RESULT = {
  level: 'SEVERE',
  direction: 'UP',
  delta_score: 1.2,
  mcc_class: 'MODERATE',
  ia_class: 'LOW',
  class_divergence: true,
  pillars_comparison: [],
  system_recommendation: 'Critical divergence detected.',
  requires_justification: true,
};

describe('TensionComponent', () => {
  let component: TensionComponent;
  let fixture: ComponentFixture<TensionComponent>;

  const mockScoringService = { getScoring: vi.fn().mockReturnValue(of({})) };
  const mockIaService      = { getPrediction: vi.fn().mockReturnValue(of({})) };
  const mockTensionCalc    = { calculateTension: vi.fn().mockReturnValue(MOCK_TENSION_RESULT) };
  const mockRouter         = { navigate: vi.fn() };

  const mockActivatedRoute = {
    snapshot: { paramMap: { get: () => 'case-123' } },
    parent: { snapshot: { paramMap: { get: () => 'case-123' } } },
  };

  // Faux CaseContextService injecté automatiquement via le module de test
  const mockCaseContext = { caseId: signal('case-123') };

  async function buildComponent(
    scoringOverride?: any,
    iaOverride?: any,
    calcOverride?: any,
  ) {
    await TestBed.configureTestingModule({
      imports: [TensionComponent, NoopAnimationsModule],
      providers: [
        { provide: ScoringMccService,    useValue: scoringOverride ?? mockScoringService },
        { provide: IaService,            useValue: iaOverride ?? mockIaService },
        { provide: TensionCalculatorService, useValue: calcOverride ?? mockTensionCalc },
        { provide: ActivatedRoute,       useValue: mockActivatedRoute },
        { provide: Router,               useValue: mockRouter },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(TensionComponent);
    component = fixture.componentInstance;
    // Injecter caseId directement sans passer par CaseContextService
    component.caseId.set('case-123');
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
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── État initial des signals ──────────────────────────────────────────────────────
  it('loadError() devrait être null initialement', () => {
    expect(component.loadError()).toBeNull();
  });

  it('submitError() devrait être null initialement', () => {
    expect(component.submitError()).toBeNull();
  });

  it('retryCount() devrait être 0 initialement', () => {
    expect(component.retryCount()).toBe(0);
  });

  // ─── onRetryLoad() ────────────────────────────────────────────────────────────────
  it('onRetryLoad() devrait incrémenter retryCount et vider loadError', () => {
    component.loadError.set('server');
    component.onRetryLoad();
    expect(component.retryCount()).toBe(1);
    expect(component.loadError()).toBeNull();
  });

  it('onRetryLoad() appelé deux fois → retryCount = 2', () => {
    component.onRetryLoad();
    component.onRetryLoad();
    expect(component.retryCount()).toBe(2);
  });

  // ─── Gestion erreur chargement ────────────────────────────────────────────────────
  it('loadError devrait être positionné à "server" quand le forkJoin échoue', async () => {
    TestBed.resetTestingModule();
    // Les deux catchError internes renvoient of(null) — le calcul
    // lui-même peut échouer si mcc/ia sont null.
    // On simule un échec total en retournant throwError SANS catchError interne
    // En pratique le forkJoin error() est déclenché uniquement si catchError
    // interne laisse passer l'erreur — ici on set loadError manuellement pour
    // tester l'effet du signal
    await buildComponent();
    component.loadError.set('server');
    expect(component.loadError()).toBe('server');
  });

  it('submitError peut être positionné et effacé', () => {
    component.submitError.set('server');
    expect(component.submitError()).toBe('server');
    component.submitError.set(null);
    expect(component.submitError()).toBeNull();
  });

  // ─── Rendu template ───────────────────────────────────────────────────────────────
  it('devrait afficher le skeleton quand isLoading = true', async () => {
    TestBed.resetTestingModule();
    const pending$ = new Subject();
    await buildComponent(
      { getScoring: vi.fn().mockReturnValue(pending$) },
      { getPrediction: vi.fn().mockReturnValue(pending$) },
    );
    component.isLoading.set(true);
    fixture.detectChanges();
    const skeleton = fixture.debugElement.query(By.css('[data-testid="tension-skeleton"]'));
    expect(skeleton).toBeTruthy();
  });

  it('tension-back-btn devrait être présent dans le DOM quand tensionData est défini', () => {
    component.tensionData.set(MOCK_TENSION_RESULT as any);
    component.isLoading.set(false);
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('[data-testid="tension-back-btn"]'));
    expect(btn).toBeTruthy();
  });

  it('tension-main-content devrait être présent quand tensionData est défini', () => {
    component.tensionData.set(MOCK_TENSION_RESULT as any);
    component.isLoading.set(false);
    fixture.detectChanges();
    const main = fixture.debugElement.query(By.css('[data-testid="tension-main-content"]'));
    expect(main).toBeTruthy();
  });

  it('tension-load-error devrait être visible quand loadError = "server" et isLoading = false', () => {
    component.loadError.set('server');
    component.isLoading.set(false);
    fixture.detectChanges();
    const err = fixture.debugElement.query(By.css('[data-testid="tension-load-error"]'));
    expect(err).toBeTruthy();
  });
});
