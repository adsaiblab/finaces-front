import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StressComponent } from './stress.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { StressService } from '../../core/services/stress.service';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

const MOCK_STRESS_DATA = {
  case_id: 'case-123',
  computed_at: '2026-04-04T00:00:00Z',
  base_parameters: {
    contract_value: 1200000,
    initial_cash: 250000,
    available_credit: 100000,
    operating_cash_flow: 45000,
    milestones: [],
  },
  scenarios: [
    {
      scenario_name: 'Reference',
      description: 'Standard',
      min_cash_balance: 120000,
      months_in_negative: 0,
      status: 'RESILIENT' as const,
      cash_curve: [],
    },
  ],
};

describe('StressComponent', () => {
  let component: StressComponent;
  let fixture: ComponentFixture<StressComponent>;

  const mockStressService = {
    getStressTests: vi.fn().mockReturnValue(of(MOCK_STRESS_DATA).pipe(delay(0))),
    runCustomStressTest: vi.fn().mockReturnValue(of(MOCK_STRESS_DATA).pipe(delay(0))),
  };

  const mockCaseContext = { caseId: () => 'case-123' };

  beforeEach(async () => {
    vi.stubGlobal('requestAnimationFrame', (cb: Function) => setTimeout(cb, 0));
    mockStressService.getStressTests.mockReturnValue(of(MOCK_STRESS_DATA).pipe(delay(0)));
    mockStressService.runCustomStressTest.mockReturnValue(of(MOCK_STRESS_DATA).pipe(delay(0)));

    await TestBed.configureTestingModule({
      imports: [StressComponent, NoopAnimationsModule],
      providers: [
        { provide: StressService,      useValue: mockStressService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(StressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // --- Creation & init ---
  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockStressService.getStressTests).toHaveBeenCalledWith('case-123');
  });

  it('should trigger simulation via runCustomStressTest', () => {
    component.runSimulation();
    expect(mockStressService.runCustomStressTest).toHaveBeenCalled();
  });

  // --- Etat initial des signals ---
  it('loadError() devrait etre null par defaut', () => {
    expect(component.loadError()).toBeNull();
  });

  it('simulationError() devrait etre null par defaut', () => {
    expect(component.simulationError()).toBeNull();
  });

  it('retryCount() devrait etre 0 par defaut', () => {
    expect(component.retryCount()).toBe(0);
  });

  it('activeTab() devrait etre CONTRACT par defaut', () => {
    expect(component.activeTab()).toBe('CONTRACT');
  });

  // --- loadError (ErrorCode) ---
  it('loadError peut etre positionne a "server" (ErrorCode)', () => {
    component.loadError.set('server');
    expect(component.loadError()).toBe('server');
  });

  it('onRetryLoad() devrait reinitialiser loadError et incrementer retryCount', () => {
    component.loadError.set('server');
    const before = component.retryCount();
    component.onRetryLoad();
    expect(component.loadError()).toBeNull();
    expect(component.retryCount()).toBe(before + 1);
  });

  // --- simulationError (ErrorCode) ---
  it('simulationError peut etre positionne a "server"', () => {
    component.simulationError.set('server');
    expect(component.simulationError()).toBe('server');
  });

  it('simulationError peut etre efface', () => {
    component.simulationError.set('server');
    component.simulationError.set(null);
    expect(component.simulationError()).toBeNull();
  });

  it('runSimulation() vide simulationError au debut', () => {
    component.simulationError.set('server');
    component.runSimulation();
    expect(component.simulationError()).toBeNull();
  });

  // --- hasNoData computed ---
  it('hasNoData devrait etre false quand stressData est defini', () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.stressData.set(MOCK_STRESS_DATA);
    expect(component.hasNoData()).toBe(false);
  });

  it("hasNoData devrait etre true quand loading=false, pas d'erreur, pas de donnees", () => {
    component.isLoading.set(false);
    component.loadError.set(null);
    component.stressData.set(null);
    expect(component.hasNoData()).toBe(true);
  });

  // --- Toggle setTab() ---
  it('setTab("MACRO") devrait changer activeTab a MACRO', () => {
    component.setTab('MACRO');
    expect(component.activeTab()).toBe('MACRO');
  });

  it('setTab("SHOCK") devrait changer activeTab a SHOCK', () => {
    component.setTab('SHOCK');
    expect(component.activeTab()).toBe('SHOCK');
  });

  it('setTab("CONTRACT") depuis SHOCK devrait revenir a CONTRACT', () => {
    component.setTab('SHOCK');
    component.setTab('CONTRACT');
    expect(component.activeTab()).toBe('CONTRACT');
  });

  // --- Rendu template ---
  it('devrait afficher le skeleton (stress-loading-spinner) quand isLoading = true', async () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('[data-testid="stress-loading-spinner"]');
    expect(el).toBeTruthy();
  });

  it('devrait masquer le skeleton apres chargement', async () => {
    component.isLoading.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement.querySelector('[data-testid="stress-loading-spinner"]');
    expect(el).toBeFalsy();
  });

  it('les 3 boutons de tabs devraient etre dans le DOM quand le contenu est charge', async () => {
    component.isLoading.set(false);
    component.stressData.set(MOCK_STRESS_DATA);
    fixture.detectChanges();
    await fixture.whenStable();
    const contract = fixture.debugElement.query(By.css('[data-testid="stress-tab-contract"]'));
    const macro    = fixture.debugElement.query(By.css('[data-testid="stress-tab-macro"]'));
    const shock    = fixture.debugElement.query(By.css('[data-testid="stress-tab-shock"]'));
    expect(contract).toBeTruthy();
    expect(macro).toBeTruthy();
    expect(shock).toBeTruthy();
  });

  it('stress-contract-panel visible quand activeTab = CONTRACT', async () => {
    component.isLoading.set(false);
    component.stressData.set(MOCK_STRESS_DATA);
    component.setTab('CONTRACT');
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.debugElement.query(By.css('[data-testid="stress-contract-panel"]'));
    expect(panel).toBeTruthy();
  });

  it('stress-macro-panel visible quand activeTab = MACRO', async () => {
    component.isLoading.set(false);
    component.stressData.set(MOCK_STRESS_DATA);
    component.setTab('MACRO');
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.debugElement.query(By.css('[data-testid="stress-macro-panel"]'));
    expect(panel).toBeTruthy();
  });

  it('stress-shock-panel visible quand activeTab = SHOCK', async () => {
    component.isLoading.set(false);
    component.stressData.set(MOCK_STRESS_DATA);
    component.setTab('SHOCK');
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.debugElement.query(By.css('[data-testid="stress-shock-panel"]'));
    expect(panel).toBeTruthy();
  });
});
