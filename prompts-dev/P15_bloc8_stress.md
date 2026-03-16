═══════════════════════════════════════════════════════════
PROMPT 15 — BLOC 8 — Stress Test
Dépend de : PROMPT 14 (Tension MCC↔IA analysée)
Peut être parallélisé avec : Aucun (BLOQUER sur P14 complet)
═══════════════════════════════════════════════════════════

## CONTEXTE

À ce stade final du **Bloc Financier** (Blocs 4-8), l'analyste a validé :
- ✓ Ratios financiers (Bloc 4)
- ✓ Scoring MCC (Bloc 5)
- ✓ Prédiction IA (Bloc 6)
- ✓ Analyse de tension (Bloc 7)

Le **Bloc 8 évalue la capacité contractuelle réelle** : si le contrat démarre, les paiements se font-ils à temps ? Y a-t-il risque de rupture de trésorerie en cas de délai de paiement ?

Ce bloc exécute des **stress tests de flux** basés sur :
- Valeur du contrat + planning de paiement (jalons)
- Trésorerie initiale + crédit bancaire disponible
- Capacité d'autofinancement (CAF) annuelle
- Délais de paiement (baseline, 60j, 90j, choc CA -20%)

Résultats : **RÉSISTE / LIMITE / RUPTURE** pour chaque scénario.

Contrairement aux simulations What-If IA (Bloc 6), le stress test évalue des **délais contractuels réels** (60 jours de délai = 2 mois sans trésorerie).

---

## RÈGLES MÉTIER APPLICABLES

### Capacité contractuelle vs Scoring
- Scoring MCC (Blocs 5) ≈ santé financière générale
- Stress Test (Bloc 8) ≈ capacité à **honorer ce contrat spécifique** avec valeur & délai

### Seuils de verdict
```
RÉSISTE:   Min cash dans simulation ≥ 0 + buffer 5% CA  → Vert
LIMITE:    Min cash entre -5% et 0 CA                  → Orange
RUPTURE:   Min cash < -5% CA                           → Rouge
```

### Exposition contractuelle
```
exposure_pct = contract_value / annual_ca
Sain: < 50% du CA
Risqué: 50-100% du CA
Critique: > 100% du CA
```

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. Route Angular

```typescript
{
  path: 'cases/:caseId/stress',
  component: Bloc8StressComponent,
  data: {
    bloc: 'BLOC8_STRESS',
    requiredStatus: ['SCORING_DONE', 'STRESS_DONE', ...],
    requiredGateStatus: 'SEALED'
  }
}
```

---

### 2. Data Models (stress.model.ts)

```typescript
// Stress Test Input
export interface StressScenarioInputSchema {
  case_id: string;

  // Contract parameters (pre-filled from case)
  contract_value: number;              // €, from case
  contract_currency: string;           // EUR
  contract_months: number;             // from case
  contract_start_date?: string;        // ISO date

  // Financial parameters (from normalized data)
  annual_ca_avg: number;               // Average annual revenue (€)
  annual_caf: number;                  // Average annual free cash flow (€)
  current_cash: number;                // Cash at test start (€)

  // Credit facilities
  available_credit_lines: number;      // Available credit (€)
  bank_guarantee_amount?: number;      // Guarantee insurance (€)

  // Working capital
  bfr_pct_revenue: number;             // % to account for BFR changes
  backlog_value: number;               // Secured backlog before this contract (€)

  // Payment Milestones (input for scenario)
  payment_milestones: PaymentMilestoneSchema[];

  // Sectorial BFR %
  sector_bfr_pct?: number;             // Optional: default per sector
}

export interface PaymentMilestoneSchema {
  label: string;                       // "Démarrage", "Livraison", "30 jours", etc.
  day_offset: number;                  // Days from contract start
  percentage: number;                  // % of contract_value
  description?: string;
}

// Stress Test Output
export interface StressResultSchema {
  case_id: string;
  execution_date: string;              // ISO timestamp

  // Input echo
  contract_value: number;
  contract_months: number;
  annual_ca_avg: number;
  annual_caf: number;

  // Global metrics
  exposure_pct: number;                // contract_value / annual_ca * 100
  exposure_badge: 'SAIN' | 'RISQUE' | 'CRITIQUE';

  score_capacity: number;              // 0-5 score for capacity
  capacity_conclusion: 'RÉSISTE' | 'LIMITE' | 'RUPTURE';

  // Stress scenarios
  baseline_scenario: MonthlyFlowScenario;
  stress_60d_scenario: MonthlyFlowScenario;
  stress_90d_scenario: MonthlyFlowScenario;
  shock_ca_minus_20_scenario: MonthlyFlowScenario;

  // Summary table
  scenarios_summary: ScenarioSummary[];

  // Data quality
  data_alerts: DataAlert[];

  // Calculation metadata
  calculation_version: string;
  assumptions: string[];
}

export interface MonthlyFlowScenario {
  scenario_name: string;
  scenario_code: string;
  assumption: string;                  // "Paiement à temps", "Délai 60j", etc.

  monthly_flows: MonthlyFlow[];        // Month 0, 1, 2, ...
  critical_month?: number;             // Month when cash < 0 (if any)
  min_cash_position: number;           // € lowest point
  min_cash_position_month: number;

  verdict: 'RÉSISTE' | 'LIMITE' | 'RUPTURE';
  buffer_pct_ca: number;               // How far from danger zone (%)

  // Detailed analysis
  days_to_rupture?: number;            // If rupture, days until cash < 0
  recovery_possible: boolean;          // Can recover after crisis?
  recovery_month?: number;
}

export interface MonthlyFlow {
  month: number;                       // 0, 1, 2, ...
  month_label: string;                 // "Mois 1", "Mois 2", etc.

  opening_cash: number;
  operational_cash_flow: number;       // From normalized CAF
  contract_inflows: number;            // Payment milestone on this month
  bfr_impact: number;                  // Impact of BFR increase
  debt_repayment: number;              // Interest + principal (if any)
  closing_cash: number;                // opening + in - out

  milestone_trigger?: string;          // Jalon executed this month
}

export interface ScenarioSummary {
  scenario_name: string;
  verdict: 'RÉSISTE' | 'LIMITE' | 'RUPTURE';
  min_cash: number;
  critical_month: number | null;
  notes: string;
}

export interface DataAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  field_name?: string;
  recommendation?: string;
}
```

---

### 3. API Endpoint

```typescript
// POST /api/v1/cases/{id}/stress/run
// Input: StressScenarioInputSchema
// Output: StressResultSchema

// Backend computes 4 scenarios in one call:
// 1. Baseline: paiements à temps
// 2. Stress 60d: 60 jours de délai
// 3. Stress 90d: 90 jours de délai
// 4. Choc CA -20%: revenus baissent 20%

stressService.runStressTest(caseId: string, input: StressScenarioInputSchema): Observable<StressResultSchema>
```

---

### 4. Component Architecture: Bloc8StressComponent

```typescript
@Component({
  selector: 'app-bloc8-stress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatAlertModule,
    ReactiveFormsModule,
    FinacesStressChartComponent,
    StressParametersFormComponent,
    StressSummaryTableComponent,
  ],
  templateUrl: './bloc8-stress.component.html',
  styleUrls: ['./bloc8-stress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Bloc8StressComponent implements OnInit, OnDestroy {
  caseId$ = this.route.paramMap.pipe(map(p => p.get('caseId')));

  // Data
  caseData$: Observable<CaseDetailSchema>;
  stressResult$: Observable<StressResultSchema>;

  // UI State
  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  showAdvancedOptions$ = new BehaviorSubject<boolean>(false);

  // Form
  parametersForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private stressService: StressTestService,
    private caseService: CaseService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notif: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.parametersForm = this.fb.group({
      contract_value: [{ value: '', disabled: true }],
      contract_months: ['', Validators.required],
      annual_ca_avg: ['', [Validators.required, Validators.min(0)]],
      annual_caf: ['', [Validators.required, Validators.min(0)]],
      current_cash: ['', [Validators.required, Validators.min(0)]],
      available_credit_lines: [0, [Validators.required, Validators.min(0)]],
      bfr_pct_revenue: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      backlog_value: [0, [Validators.required, Validators.min(0)]],
      bank_guarantee_amount: [0, Validators.min(0)]
    });
  }

  ngOnInit() {
    const caseId = this.caseId$.getValue();

    // Load case data to pre-fill form
    this.caseData$ = this.caseService.getCaseDetail(caseId).pipe(
      tap(caseData => {
        this.parametersForm.patchValue({
          contract_value: caseData.contract_value,
          contract_months: caseData.contract_months,
          annual_ca_avg: caseData.financial_data?.annual_ca || 0,
          annual_caf: caseData.financial_data?.annual_caf || 0,
          current_cash: caseData.financial_data?.current_cash || 0
        });
        this.cdr.markForCheck();
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
  }

  runStressTest() {
    if (this.parametersForm.invalid) {
      this.notif.open('Veuillez remplir tous les champs obligatoires', 'Fermer');
      return;
    }

    const caseId = this.caseId$.getValue();
    const input: StressScenarioInputSchema = this.parametersForm.getRawValue();

    this.isLoading$.next(true);

    this.stressService.runStressTest(caseId, input).pipe(
      tap(result => {
        this.stressResult$ = of(result);
        this.isLoading$.next(false);
        this.cdr.markForCheck();
        this.notif.open('Stress test exécuté avec succès', '', { duration: 3000 });
      }),
      catchError(err => {
        this.error$.next(err.message || 'Erreur lors du stress test');
        this.isLoading$.next(false);
        this.cdr.markForCheck();
        return throwError(err);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  exportResults(result: StressResultSchema) {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress-test-${result.case_id}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  closeStressAndNavigateToExpertReview() {
    const caseId = this.caseId$.getValue();

    // Mark stress test as done
    this.caseService.updateCaseStatus(caseId, 'STRESS_DONE').pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      () => {
        this.notif.open('Stress test validé. Passage à l\'Expert Review.', '', { duration: 3000 });
        this.router.navigate([`/cases/${caseId}/expert-review`]);
      },
      err => this.notif.open(`Erreur: ${err.message}`, 'Fermer')
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### 5. Template: bloc8-stress.component.html

```html
<div class="bloc8-container">

  <!-- Header -->
  <div class="bloc-header">
    <div class="header-info">
      <h2 class="bloc-title">
        <mat-icon>trending_down</mat-icon>
        STRESS TEST — Capacité Contractuelle
      </h2>
      <p class="bloc-subtitle">
        Simulation de flux de trésorerie : baseline, délais de paiement (60j/90j), choc CA.
      </p>
    </div>
  </div>

  <!-- Loading state -->
  <mat-progress-bar *ngIf="(isLoading$ | async)" mode="indeterminate"></mat-progress-bar>

  <!-- Error banner -->
  <mat-alert *ngIf="(error$ | async) as error" type="error">
    {{ error }}
    <button mat-button (click)="error$.next(null)">Fermer</button>
  </mat-alert>

  <!-- Parameters Form -->
  <app-stress-parameters-form
    *ngIf="(caseData$ | async) as caseData"
    [form]="parametersForm"
    [caseData]="caseData"
    (onRunStressTest)="runStressTest()">
  </app-stress-parameters-form>

  <!-- Results Section -->
  <div *ngIf="(stressResult$ | async) as result">

    <!-- Global Exposure Metric -->
    <mat-card class="exposure-card">
      <mat-card-header>
        <h3>Exposition Contractuelle</h3>
      </mat-card-header>
      <mat-card-content>
        <div class="exposure-metrics">
          <div class="metric">
            <p class="label">Valeur Contrat</p>
            <p class="value">{{ result.contract_value | currency:'EUR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="metric">
            <p class="label">CA Annuel Moyen</p>
            <p class="value">{{ result.annual_ca_avg | currency:'EUR':'symbol':'1.0-0' }}</p>
          </div>
          <div class="metric">
            <p class="label">Exposition</p>
            <div class="exposure-display">
              <p class="value">{{ result.exposure_pct | number:'1.0-0' }}%</p>
              <mat-icon [ngClass]="'exposure-' + result.exposure_badge | lowercase">
                {{ exposureBadgeIcon(result.exposure_badge) }}
              </mat-icon>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Capacity Score -->
    <mat-card class="capacity-card">
      <mat-card-header>
        <h3>Score de Capacité Contractuelle</h3>
      </mat-card-header>
      <mat-card-content>
        <div class="capacity-display">
          <app-finaces-score-gauge
            [score]="result.score_capacity"
            [rail]="'MCC'"
            [size]="140">
          </app-finaces-score-gauge>
          <div class="capacity-text">
            <p class="score-value">{{ result.score_capacity | number:'1.1-1' }} / 5.0</p>
            <p class="capacity-conclusion"
               [ngClass]="'verdict-' + result.capacity_conclusion | lowercase">
              {{ result.capacity_conclusion }}
            </p>
            <p class="conclusion-detail">
              <span *ngIf="result.capacity_conclusion === 'RÉSISTE'">
                ✓ La capacité est suffisante pour honorer le contrat.
              </span>
              <span *ngIf="result.capacity_conclusion === 'LIMITE'">
                ⚠️ Capacité limite. Décaissements serrés.
              </span>
              <span *ngIf="result.capacity_conclusion === 'RUPTURE'">
                🔴 Risque de rupture de trésorerie. Financement supplémentaire requis.
              </span>
            </p>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Monthly Flows Chart -->
    <mat-card class="flows-chart-card">
      <mat-card-header>
        <h3>Évolution Mensuelle de la Trésorerie</h3>
        <p class="subtitle">Baseline vs 60j délai vs 90j délai</p>
      </mat-card-header>
      <mat-card-content>
        <app-finaces-stress-chart
          [baselineScenario]="result.baseline_scenario"
          [stress60dScenario]="result.stress_60d_scenario"
          [stress90dScenario]="result.stress_90d_scenario">
        </app-finaces-stress-chart>
      </mat-card-content>
    </mat-card>

    <!-- Scenarios Summary Table -->
    <app-stress-summary-table
      [summary]="result.scenarios_summary">
    </app-stress-summary-table>

    <!-- Data Alerts -->
    <mat-card *ngIf="result.data_alerts.length > 0" class="alerts-card">
      <mat-card-header>
        <h3>Alertes sur les Données</h3>
      </mat-card-header>
      <mat-card-content>
        <mat-expansion-panel *ngFor="let alert of result.data_alerts"
                             [ngClass]="'severity-' + alert.severity | lowercase">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon [color]="alert.severity === 'CRITICAL' ? 'warn' : 'accent'">
                {{ alert.severity === 'CRITICAL' ? 'error' : 'info' }}
              </mat-icon>
              {{ alert.message }}
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="alert-content">
            <p *ngIf="alert.field_name"><strong>Champ:</strong> {{ alert.field_name }}</p>
            <p *ngIf="alert.recommendation"><strong>Recommandation:</strong> {{ alert.recommendation }}</p>
          </div>
        </mat-expansion-panel>
      </mat-card-content>
    </mat-card>

    <!-- Assumptions -->
    <mat-card class="assumptions-card">
      <mat-card-header>
        <h3>Hypothèses de Calcul</h3>
      </mat-card-header>
      <mat-card-content>
        <ul class="assumptions-list">
          <li *ngFor="let assumption of result.assumptions">{{ assumption }}</li>
        </ul>
      </mat-card-content>
    </mat-card>

  </div>

  <!-- Action Footer -->
  <div class="action-footer">
    <div class="button-group">
      <button mat-button (click)="router.navigate(['/cases/' + (caseId$ | async) + '/tension'])">
        ← Retour Tension MCC/IA
      </button>
      <button mat-button
              *ngIf="(stressResult$ | async) as result"
              (click)="exportResults(result)">
        <mat-icon>download</mat-icon>
        Exporter Résultats
      </button>
      <button mat-raised-button color="primary"
              *ngIf="(stressResult$ | async)"
              (click)="closeStressAndNavigateToExpertReview()"
              [disabled]="(isLoading$ | async)">
        <mat-icon>arrow_forward</mat-icon>
        Valider Stress Test & Expert Review →
      </button>
    </div>
  </div>

</div>
```

---

### 6. Sub-component: StressParametersFormComponent

```typescript
@Component({
  selector: 'app-stress-parameters-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    ReactiveFormsModule
  ],
  template: `
    <mat-card class="parameters-card">
      <mat-card-header>
        <h3>Paramètres du Scénario</h3>
        <p class="subtitle">Remplissez les données pour lancer la simulation</p>
      </mat-card-header>
      <mat-card-content>

        <form [formGroup]="form" class="parameters-form">

          <!-- Contract Parameters -->
          <div class="form-section">
            <h4>Paramètres Contrat</h4>

            <mat-form-field>
              <mat-label>Valeur du Contrat</mat-label>
              <input matInput formControlName="contract_value" disabled>
              <mat-hint>€ (pré-rempli)</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Durée Contrat</mat-label>
              <input matInput formControlName="contract_months" type="number">
              <mat-hint>mois</mat-hint>
            </mat-form-field>
          </div>

          <!-- Financial Parameters -->
          <div class="form-section">
            <h4>Données Financières</h4>

            <mat-form-field>
              <mat-label>CA Annuel Moyen</mat-label>
              <input matInput formControlName="annual_ca_avg" type="number">
              <mat-hint>€ (derniers 3-4 ans)</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>CAF Annuelle Moyenne</mat-label>
              <input matInput formControlName="annual_caf" type="number">
              <mat-hint>€ (Capacité d'autofinancement)</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Trésorerie Initiale</mat-label>
              <input matInput formControlName="current_cash" type="number">
              <mat-hint>€ (Cash disponible maintenant)</mat-hint>
            </mat-form-field>
          </div>

          <!-- Credit & Facilities -->
          <div class="form-section">
            <h4>Ressources de Financement</h4>

            <mat-form-field>
              <mat-label>Lignes de Crédit Disponibles</mat-label>
              <input matInput formControlName="available_credit_lines" type="number">
              <mat-hint>€</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Garantie Bancaire</mat-label>
              <input matInput formControlName="bank_guarantee_amount" type="number">
              <mat-hint>€ (optionnel)</mat-hint>
            </mat-form-field>
          </div>

          <!-- Working Capital -->
          <div class="form-section">
            <h4>Besoins en Fonds de Roulement</h4>

            <mat-form-field>
              <mat-label>BFR en % du CA</mat-label>
              <input matInput formControlName="bfr_pct_revenue" type="number" min="0" max="100">
              <mat-hint>% (comptabilisé automatiquement)</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Carnet de Commandes Assuré</mat-label>
              <input matInput formControlName="backlog_value" type="number">
              <mat-hint>€ (avant ce contrat)</mat-hint>
            </mat-form-field>
          </div>

          <!-- Payment Milestones -->
          <mat-expansion-panel class="milestones-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>event</mat-icon>
                Jalons de Paiement
              </mat-panel-title>
              <mat-panel-description>
                Dépenses et encaissements planifiés
              </mat-panel-description>
            </mat-expansion-panel-header>

            <app-stress-milestones-editor
              [milestonesData]="milestonesData"
              [contractValue]="form.get('contract_value').value">
            </app-stress-milestones-editor>

          </mat-expansion-panel>

          <!-- Action Buttons -->
          <div class="form-actions">
            <button mat-raised-button color="primary"
                    type="button"
                    (click)="onRunStressTest.emit()"
                    [disabled]="form.invalid">
              <mat-icon>play_arrow</mat-icon>
              Lancer Simulation
            </button>
          </div>

        </form>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .parameters-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      h4 { margin-top: 0; color: var(--mcc-moderate); }
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    mat-form-field {
      width: 100%;
    }

    .milestones-panel {
      margin-top: 12px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }
  `]
})
export class StressParametersFormComponent {
  @Input() form: FormGroup;
  @Input() caseData: CaseDetailSchema;
  @Output() onRunStressTest = new EventEmitter<void>();

  milestonesData: PaymentMilestoneSchema[] = [
    { label: 'Démarrage', day_offset: 0, percentage: 10, description: 'Acompte initial' },
    { label: 'Livraison', day_offset: 60, percentage: 50, description: 'À la livraison' },
    { label: '30 jours', day_offset: 90, percentage: 30, description: 'Net 30' },
    { label: 'Solde', day_offset: 120, percentage: 10, description: 'Dernier versement' }
  ];
}
```

---

### 7. Sub-component: FinacesStressChartComponent

```typescript
@Component({
  selector: 'app-finaces-stress-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stress-chart-container">
      <svg [attr.viewBox]="'0 0 1200 400'" class="stress-chart">

        <!-- Grid & Axes -->
        <line x1="50" y1="350" x2="1150" y2="350" stroke="#ccc" stroke-width="1"></line>
        <line x1="50" y1="50" x2="50" y2="350" stroke="#000" stroke-width="2"></line>

        <!-- Y Axis Labels (Cash levels) -->
        <text x="20" y="355" text-anchor="end" font-size="10">0€</text>
        <text x="20" y="200" text-anchor="end" font-size="10">CA/2</text>
        <text x="20" y="50" text-anchor="end" font-size="10">CA</text>

        <!-- Red zero line (danger) -->
        <line x1="50" y1="350" x2="1150" y2="350" stroke="#f44336" stroke-width="2" stroke-dasharray="5,5"></line>

        <!-- Baseline polyline (green) -->
        <polyline [attr.points]="baselinePoints"
                  fill="none"
                  stroke="#4caf50"
                  stroke-width="2">
        </polyline>

        <!-- Stress 60d polyline (orange) -->
        <polyline [attr.points]="stress60Points"
                  fill="none"
                  stroke="#ff9800"
                  stroke-width="2">
        </polyline>

        <!-- Stress 90d polyline (red) -->
        <polyline [attr.points]="stress90Points"
                  fill="none"
                  stroke="#f44336"
                  stroke-width="2">
        </polyline>

        <!-- Critical month marker (if applicable) -->
        <circle *ngIf="criticalMonth"
                [attr.cx]="getCriticalMonthX()"
                [attr.cy]="getCriticalMonthY()"
                r="5"
                fill="none"
                stroke="#f44336"
                stroke-width="2">
        </circle>
        <text *ngIf="criticalMonth"
              [attr.x]="getCriticalMonthX()"
              [attr.y]="getCriticalMonthY() - 15"
              text-anchor="middle"
              font-size="10"
              fill="#f44336">
          ⚠️ M{{ criticalMonth }}
        </text>

        <!-- Legend -->
        <g transform="translate(1000, 70)">
          <rect x="0" y="0" width="140" height="100" fill="white" stroke="#ccc"></rect>
          <line x1="10" y1="15" x2="30" y2="15" stroke="#4caf50" stroke-width="2"></line>
          <text x="40" y="18" font-size="11">Baseline</text>
          <line x1="10" y1="35" x2="30" y2="35" stroke="#ff9800" stroke-width="2"></line>
          <text x="40" y="38" font-size="11">Stress 60j</text>
          <line x1="10" y1="55" x2="30" y2="55" stroke="#f44336" stroke-width="2"></line>
          <text x="40" y="58" font-size="11">Stress 90j</text>
          <line x1="10" y1="75" x2="30" y2="75" stroke="#f44336" stroke-width="2" stroke-dasharray="5,5"></line>
          <text x="40" y="78" font-size="11">Danger (0€)</text>
        </g>

      </svg>

      <!-- Summary below chart -->
      <div class="chart-summary">
        <div class="summary-item baseline">
          <strong>Baseline (Paiements à temps):</strong>
          Min: {{ baselineScenario.min_cash_position | currency:'EUR':'symbol':'1.0-0' }} →
          {{ baselineScenario.verdict }}
        </div>
        <div class="summary-item stress60">
          <strong>Stress 60j (Délai paiement):</strong>
          Min: {{ stress60dScenario.min_cash_position | currency:'EUR':'symbol':'1.0-0' }} →
          {{ stress60dScenario.verdict }}
        </div>
        <div class="summary-item stress90">
          <strong>Stress 90j (Délai long):</strong>
          Min: {{ stress90dScenario.min_cash_position | currency:'EUR':'symbol':'1.0-0' }} →
          {{ stress90dScenario.verdict }}
        </div>
      </div>

    </div>
  `,
  styles: [`
    .stress-chart-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stress-chart {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: white;
      width: 100%;
      max-width: 100%;
    }

    .chart-summary {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .summary-item {
        padding: 8px;
        border-left: 3px solid;
        border-radius: 2px;
        font-size: 0.9em;

        &.baseline { border-left-color: #4caf50; background: rgba(76, 175, 80, 0.05); }
        &.stress60 { border-left-color: #ff9800; background: rgba(255, 152, 0, 0.05); }
        &.stress90 { border-left-color: #f44336; background: rgba(244, 67, 54, 0.05); }
      }
    }
  `]
})
export class FinacesStressChartComponent {
  @Input() baselineScenario: MonthlyFlowScenario;
  @Input() stress60dScenario: MonthlyFlowScenario;
  @Input() stress90dScenario: MonthlyFlowScenario;

  get baselinePoints(): string {
    return this.generatePolylinePoints(this.baselineScenario.monthly_flows);
  }

  get stress60Points(): string {
    return this.generatePolylinePoints(this.stress60dScenario.monthly_flows);
  }

  get stress90Points(): string {
    return this.generatePolylinePoints(this.stress90dScenario.monthly_flows);
  }

  get criticalMonth(): number | undefined {
    return this.baselineScenario.critical_month;
  }

  private generatePolylinePoints(flows: MonthlyFlow[]): string {
    const maxCash = Math.max(...flows.map(f => f.closing_cash), 100000);
    const scale = 300 / maxCash;

    return flows.map((flow, i) => {
      const x = 50 + (i * 100);
      const y = 350 - (flow.closing_cash * scale);
      return `${x},${y}`;
    }).join(' ');
  }

  getCriticalMonthX(): number {
    return 50 + (this.criticalMonth * 100);
  }

  getCriticalMonthY(): number {
    return 350;  // At zero line
  }
}
```

---

### 8. Sub-component: StressSummaryTableComponent

```typescript
@Component({
  selector: 'app-stress-summary-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  template: `
    <mat-card class="summary-card">
      <mat-card-header>
        <h3>Résumé des Scénarios</h3>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="summary" class="summary-table">

          <!-- Scenario Column -->
          <ng-container matColumnDef="scenario">
            <th mat-header-cell>Scénario</th>
            <td mat-cell><strong>{{ element.scenario_name }}</strong></td>
          </ng-container>

          <!-- Verdict Column -->
          <ng-container matColumnDef="verdict">
            <th mat-header-cell>Verdict</th>
            <td mat-cell [class]="'verdict-' + element.verdict | lowercase">
              <mat-icon>{{ verdictIcon(element.verdict) }}</mat-icon>
              {{ element.verdict }}
            </td>
          </ng-container>

          <!-- Min Cash Column -->
          <ng-container matColumnDef="min_cash">
            <th mat-header-cell>Cash Min</th>
            <td mat-cell>{{ element.min_cash | currency:'EUR':'symbol':'1.0-0' }}</td>
          </ng-container>

          <!-- Critical Month Column -->
          <ng-container matColumnDef="critical_month">
            <th mat-header-cell>Mois Critique</th>
            <td mat-cell>
              <span *ngIf="element.critical_month">M{{ element.critical_month }}</span>
              <span *ngIf="!element.critical_month">—</span>
            </td>
          </ng-container>

          <!-- Notes Column -->
          <ng-container matColumnDef="notes">
            <th mat-header-cell>Notes</th>
            <td mat-cell class="notes-cell">{{ element.notes }}</td>
          </ng-container>

          <tr mat-header-row></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .summary-table {
      width: 100%;
      th, td { padding: 12px; }
    }

    .verdict-résiste {
      color: #4caf50;
      font-weight: 600;
    }

    .verdict-limite {
      color: #ff9800;
      font-weight: 600;
    }

    .verdict-rupture {
      color: #f44336;
      font-weight: 600;
    }

    .notes-cell {
      max-width: 300px;
      word-wrap: break-word;
      font-size: 0.9em;
      color: var(--text-secondary);
    }
  `]
})
export class StressSummaryTableComponent {
  @Input() summary: ScenarioSummary[];

  displayedColumns = ['scenario', 'verdict', 'min_cash', 'critical_month', 'notes'];

  verdictIcon(verdict: string): string {
    return {
      'RÉSISTE': 'check_circle',
      'LIMITE': 'warning_amber',
      'RUPTURE': 'priority_high'
    }[verdict] || 'help';
  }
}
```

---

### 9. Service: StressTestService

```typescript
@Injectable({ providedIn: 'root' })
export class StressTestService {

  constructor(private http: HttpClient) {}

  runStressTest(
    caseId: string,
    input: StressScenarioInputSchema
  ): Observable<StressResultSchema> {
    return this.http.post<StressResultSchema>(
      `/api/v1/cases/${caseId}/stress/run`,
      input
    ).pipe(
      tap(result => console.log('Stress test result:', result)),
      timeout(30000),  // Allow up to 30s for complex simulations
      catchError(err => {
        console.error('Stress test error:', err);
        return throwError(() => new Error('Erreur lors de la simulation'));
      })
    );
  }
}
```

---

## CONTRAINTES ANGULAR

### Standalone Components
- Tous les composants Bloc 8 sont **standalone: true**

### Change Detection
- OnPush with markForCheck()
- Observables + async pipe
- Form value changes drive UI

### Performance
- Stress test computation côté backend (< 30s)
- Chart SVG optimisé (polylines + circles)
- Table virtualScroll if > 100 rows
- No heavy animations (SVG render priority)

### Accessibility
- Color + icon for verdict (not color-only)
- Descriptive form labels
- Tooltip on critical month marker

---

## BINDING API

### Endpoints

```typescript
// POST /api/v1/cases/{id}/stress/run
// Input: StressScenarioInputSchema
// Output: StressResultSchema (complete with all 4 scenarios)

// PATCH /api/v1/cases/{id}/status
// Input: { status: 'STRESS_DONE' }
// Output: { updated: true }
```

---

## CRITÈRES DE VALIDATION

### Fonctionnels
- ✓ Formulaire parameters rempli et validé
- ✓ Stress test lancé avec 4 scénarios (baseline, 60j, 90j, choc CA)
- ✓ Résultats affichés: verdict RÉSISTE/LIMITE/RUPTURE pour chaque
- ✓ Chart mensuel montre évolution cash pour 3 scénarios
- ✓ Mois critique marqué (si applicable)
- ✓ Score de capacité (0-5) affiché
- ✓ Exposition contractuelle visible
- ✓ Alertes sur données affichées si pertinent

### Techniques
- ✓ Stress computation backend (no frontend calc)
- ✓ 4 scénarios retournés en un seul appel
- ✓ Chart render < 200ms (SVG optimisé)
- ✓ Performance: form fill + submit < 5s total
- ✓ Responsive: chart scale sur mobile

### UX
- ✓ Résultats clairs: RÉSISTE = vert, LIMITE = orange, RUPTURE = rouge
- ✓ Historique hypothèses visible
- ✓ Export JSON fonctionnel
- ✓ Navigation vers Expert Review fluide
- ✓ Message success/error approprié

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/features/cases/components/
├── bloc8-stress/
│   ├── bloc8-stress.component.ts
│   ├── bloc8-stress.component.html
│   ├── bloc8-stress.component.scss
│   ├── stress-parameters-form/
│   │   ├── stress-parameters-form.component.ts
│   │   ├── stress-parameters-form.component.html
│   │   ├── stress-parameters-form.component.scss
│   │   └── stress-milestones-editor/
│   │       ├── stress-milestones-editor.component.ts
│   │       ├── stress-milestones-editor.component.html
│   │       └── stress-milestones-editor.component.scss
│   ├── finaces-stress-chart/
│   │   ├── finaces-stress-chart.component.ts
│   │   ├── finaces-stress-chart.component.html
│   │   └── finaces-stress-chart.component.scss
│   └── stress-summary-table/
│       ├── stress-summary-table.component.ts
│       ├── stress-summary-table.component.html
│       └── stress-summary-table.component.scss
src/app/features/cases/services/
└── stress-test.service.ts
src/app/shared/models/
└── stress.model.ts
```

**Routing:**
- Route `/cases/:caseId/stress`
- Guards: GateCheckGuard, StatusCheckGuard
- Dependency: requires Bloc 7 completed
- Navigation from Bloc 7 → Bloc 8
- Navigation from Bloc 8 → Expert Review (P16, outside Phase 2)

---

**STATUS À LA FIN :** Dossier passe de `STRESS_DONE` → `EXPERT_REVIEWED` (after P16)
**NEXT PHASE :** Phase 3 — Expert Review, Reporting, Decision (P16+)

---

## ══════════════════════════════════════════════════════════════
## CHECKPOINT PHASE 2 — SYNTHÈSE DE LIVRAISON
## ══════════════════════════════════════════════════════════════

À ce stade (fin P15), l'application FinaCES doit supporter **complètement le flux financier** :

### ✓ BLOCS OPÉRATIONNELS (Phase 1 — P1-P10)
- **Bloc Dashboard**: KPI principal + dossiers récents + graphique 30j ✓
- **Bloc Création**: Stepper 4 étapes, formulaire complet ✓
- **Bloc Gate**: Upload docs, checklist, évaluation, scellement ✓
- **Bloc Financiers Bruts**: Saisie 4 exercices, multi-tabs, auto-calcul ✓
- **Bloc Normalisation**: Lecture IFRS, tableau comparatif brut vs normalisé ✓

### ✓ BLOCS FINANCIERS (Phase 2 — P11-P15)
- **Bloc 4 Ratios**: 25+ indicateurs groupés, cohérence alerts, Z-Score ✓
  - Actions: [Lancer Scoring MCC & Prédiction IA] en parallèle
  - Status: RATIOS_COMPUTED

- **Bloc 5 Scoring MCC**: Gauge MCC + 5 piliers accordion + override
  - Décisif (source unique)
  - MCC-R1, MCC-R4 respectées
  - Status: SCORING_DONE

- **Bloc 6 IA**: Disclaimer + SHAP + What-If
  - Consultatif (non-décisif)
  - Parallèle avec Bloc 5
  - MCC-R2, MCC-R3 respectées
  - Status: (IA done simultanément)

- **Bloc 7 Tension**: Banner conditionnel + comparaison + décision analyste
  - Calcul frontend (delta ordinal)
  - Commentaire obligatoire si MODERATE/SEVERE
  - Escalade senior si SEVERE
  - Status: SCORING_DONE (unchanged, tension is analysis step)

- **Bloc 8 Stress**: Formulaire jalons + 4 scénarios + chart mensuel
  - Baseline + 60j + 90j + Choc CA -20%
  - Verdict: RÉSISTE / LIMITE / RUPTURE
  - Status: STRESS_DONE

### ✓ NAVIGATION BLOC À BLOC
```
Dashboard
  → Créer Dossier (Stepper)
    → Gate (Docs + Checklist)
      → Financiers Bruts (4 tabs)
        → Normalisation IFRS (lecture)
          → Bloc 4 Ratios
            → [Lancer Scoring MCC & IA] en parallèle
              ├→ Bloc 5 Scoring MCC ✓
              └→ Bloc 6 Prédiction IA ✓
            → Bloc 7 Tension
              → Bloc 8 Stress Test
                → [Passer à Expert Review] P16+
```

### ✓ RÈGLES MÉTIER IMPLÉMENTÉES
- **MCC-R1**: Score MCC unicité + décision ✓
- **MCC-R2**: IA ne remplace jamais MCC ✓
- **MCC-R3**: Disclaimer IA non-dismissible ✓
- **MCC-R4**: Hiérarchie visuelle MCC > IA ✓
- **MCC-R5**: Tension MODERATE/SEVERE = commentaire obligatoire ✓
- **MCC-R6**: Gate avant les financiers ✓
- **MCC-R7**: Ratios depuis données normalisées uniquement ✓

### ✓ LIVRABLES FINAUX (P11-P15)
- 5 blocs composants (Bloc 4-8)
- 15+ sub-components réutilisables
- 5 services backend-integrated
- 5 data models TypeScript complets
- Charts (Score Gauge, SHAP, Stress flows)
- Forms (Override, Decision, Stress parameters, Milestones)
- Tables (Ratios, Pillar analysis, Stress summary)
- Full responsive design (mobile/tablet/desktop)
- Accessibility (WCAG 2.1 AA)

### ✓ STATUTS DOSSIER PHASE 2
```
DRAFT
  → PENDING_GATE (après P9)
    → FINANCIAL_INPUT (après saisie P10)
      → NORMALIZATION_DONE (après P10 lecture)
        → RATIOS_COMPUTED (après P11)
          → SCORING_DONE (après P12+P13)
            → STRESS_DONE (après P15)
              → EXPERT_REVIEWED (P16, Phase 3)
```

### ✓ QUALITÉ & STANDARDS
- Angular 17+ standalone, latest Material, Tailwind
- TypeScript strict mode
- OnPush change detection
- RxJS operators best practices
- Form validation comprehensive
- Error handling graceful
- Loading states clear
- Responsive & accessible

### ✓ PROCHAINES ÉTAPES (Phase 3)
- P16: Expert Review & Recommendation
- P17: Reporting & PDF Export
- P18: Decision & Closure
- P19: Archive & Analytics

──────────────────────────────────────────────────────────
**FIN PHASE 2 — PROMPTS P11-P15 COMPLÉTÉS**
──────────────────────────────────────────────────────────
