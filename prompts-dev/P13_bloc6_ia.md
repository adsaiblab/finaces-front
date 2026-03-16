═══════════════════════════════════════════════════════════
PROMPT 13 — BLOC 6 — Prédiction IA (Rail 2)
Dépend de : PROMPT 11 (Ratios calculés)
Peut être parallélisé avec : PROMPT 12 (Bloc 5 MCC) — les deux lancés en parallèle depuis P11
═══════════════════════════════════════════════════════════

## CONTEXTE

Le **Bloc 6 affiche la prédiction IA** — une **source consultatif non-décisive**. L'IA ne remplace jamais le score MCC (MCC-R1, MCC-R2, MCC-R4).

Ce bloc présente :
- **Disclaimer obligatoire** en haut (MCC-R3: "Cette prédiction est indicative")
- **Configuration du modèle IA** (XGBoost, features actives, options SHAP/What-If)
- **Gauge IA** (0-5, rail=IA, couleur bleu→violet)
- **Résultat IA** (score, probabilité défaut %, confidence interval)
- **Explications SHAP** (top 10 features impactantes)
- **What-If Sensitivity** (simulations indicatives)
- **État IA indisponible** (avec retry)

La prédiction IA est **lancée en parallèle du scoring MCC** (depuis Bloc 4). Une fois complétée, elle alimente l'analyse de tension (Bloc 7).

---

## RÈGLES MÉTIER APPLICABLES

### MCC-R2 : IA ne peut jamais remplacer MCC
Si IA indisponible, le dossier continue sans IA. Pas de fallback, pas de substitution.

### MCC-R3 : Disclaimer IA obligatoire
**Chaque écran affichant un score/prédiction IA doit montrer le disclaimer en haut, non-dismissible.**
```
"⚠️ Ceci est une prédiction algorithmique basée sur des données historiques.
Elle ne constitue pas une analyse de risque officielle et ne peut pas
remplacer l'avis d'expert. À titre consultatif uniquement."
```

### MCC-R4 : Hiérarchie visuelle MCC > IA
- IA affichée **en visibilité secondaire** (pas d'égalité visuelle)
- Gauge IA **moins proéminent** que gauge MCC
- IA jamais en position dominante (top-left réservé MCC)
- "Prédiction IA" jamais appelée "Score IA"

### MCC-R5 : Tension MODERATE/SEVERE
Si IA score → MCC score = écart ≥2 niveaux → tension SEVERE = commentaire analyste OBLIGATOIRE avant fermeture.

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. Route Angular

```typescript
{
  path: 'cases/:caseId/ia',
  component: Bloc6IaComponent,
  data: {
    bloc: 'BLOC6_IA',
    requiredStatus: ['RATIOS_COMPUTED', 'SCORING_DONE', ...],
    requiredGateStatus: 'SEALED'
  }
}
```

---

### 2. Data Models (ia-prediction.model.ts)

```typescript
// IA Prediction Schema
export interface IAPredictionSchema {
  case_id: string;
  prediction_date: string;
  model_info: ModelInfo;

  // Prediction results
  ia_score: number;                    // 0-5 scale (normalized)
  probability_default: number;         // %, e.g., 23.5
  confidence_level: number;            // 0-1, e.g., 0.92
  confidence_interval: ConfidenceInterval;

  // SHAP explanations
  shap_values: ShapFeature[];          // Top 10 features

  // Sensitivity simulations (What-If)
  sensitivity_simulations: SensitivitySimulation[];

  // Validation
  features_validated_count: number;
  features_missing: string[];          // If any
  data_quality_score: number;          // 0-100

  // Status
  prediction_status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'UNAVAILABLE';
  error_message?: string;
  calculation_time_ms?: number;

  // Metadata
  model_version: string;               // e.g., "XGBoost_v3.2.1"
  training_date: string;
  training_sample_size: number;
}

export interface ModelInfo {
  name: string;                        // "XGBoost"
  version: string;                     // "3.2.1"
  algorithm: string;                   // "Gradient Boosting"
  training_date: string;               // ISO date
  training_sample_size: number;
  features_count: number;              // e.g., 45 features
  hyperparameters?: Record<string, any>;  // Optional advanced info
}

export interface ConfidenceInterval {
  lower_bound: number;                 // e.g., 0.18 (18% default probability)
  upper_bound: number;                 // e.g., 0.28 (28% default probability)
}

export interface ShapFeature {
  feature_name: string;                // e.g., "debt_to_equity"
  raw_value: number;                   // Feature value in case
  shap_value: number;                  // SHAP contribution (can be negative)
  direction: 'POSITIVE' | 'NEGATIVE';  // Impact direction
  impact_magnitude: number;            // Absolute |shap_value|
  feature_importance_rank: number;     // 1-10
  explanation: string;                 // "Increases risk", "Reduces risk"
}

export interface SensitivitySimulation {
  id: string;
  feature_name: string;
  original_value: number;
  simulated_value: number;
  estimated_new_score: number;        // Predicted IA score if feature changed
  estimated_new_pdia: number;         // Predicted PDIA if feature changed
  score_delta: number;                // Change from current
  impact_description: string;         // "Si debt_to_equity passe de 0.8 → 1.2..."
}

export interface IAPredictionConfig {
  use_cached_features: boolean;        // false = recalculate from normalized data
  include_shap: boolean;               // true = compute SHAP values (slower)
  include_confidence_intervals: boolean;
  include_sensitivity: boolean;        // true = What-If simulations
  max_sensitivity_count: number;       // e.g., 5 (show top 5)
  debug_mode: boolean;                 // optional: log details
}
```

---

### 3. API Endpoint

```typescript
// GET /api/v1/ia/cases/{id}/prediction
// Query params (optional):
//   ?cache=true (use cached features)
//   ?shap=true  (compute SHAP)
//   ?sensitivity=true (run What-If)
// Output: IAPredictionSchema

// Service call:
iaService.predictRisk(caseId: string, config?: IAPredictionConfig): Observable<IAPredictionSchema>

// Alt: Use WebSocket for long-running predictions
// ws://localhost:8000/api/v1/ia/cases/{id}/predict/stream
```

---

### 4. Component Architecture: Bloc6IaComponent

```typescript
@Component({
  selector: 'app-bloc6-ia',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressBarModule,
    MatAlertModule,
    MatBadgeModule,
    ReactiveFormsModule,
    FinacesIaDisclaimerComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    FinacesSHAPChartComponent,
    FinacesWhatIfComponent,
  ],
  templateUrl: './bloc6-ia.component.html',
  styleUrls: ['./bloc6-ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Bloc6IaComponent implements OnInit, OnDestroy {
  caseId$ = this.route.paramMap.pipe(map(p => p.get('caseId')));

  // Prediction state
  prediction$: Observable<IAPredictionSchema>;
  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  // Configuration state
  configForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private iaService: IAPredictionService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notif: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.configForm = this.fb.group({
      useCachedFeatures: true,
      includeShap: true,
      includeConfidenceIntervals: true,
      includeSensitivity: true,
      debugMode: false
    });
  }

  ngOnInit() {
    // Initial prediction load (cached by default)
    this.loadPrediction(true);
  }

  loadPrediction(useCache: boolean = true) {
    const caseId = this.caseId$.getValue();

    this.isLoading$.next(true);

    const config: IAPredictionConfig = {
      use_cached_features: useCache,
      include_shap: this.configForm.get('includeShap').value,
      include_confidence_intervals: this.configForm.get('includeConfidenceIntervals').value,
      include_sensitivity: this.configForm.get('includeSensitivity').value,
      debug_mode: this.configForm.get('debugMode').value,
      max_sensitivity_count: 5
    };

    this.prediction$ = this.iaService.predictRisk(caseId, config).pipe(
      tap(result => {
        this.isLoading$.next(false);
        this.error$.next(null);
        this.cdr.markForCheck();
      }),
      catchError(err => {
        this.error$.next(err.message || 'Erreur lors de la prédiction IA');
        this.isLoading$.next(false);
        this.cdr.markForCheck();
        return of(null);  // Allow UI to show error state
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
  }

  retryPrediction() {
    this.loadPrediction(false);  // Force recalculation
  }

  exportPrediction(prediction: IAPredictionSchema) {
    const data = JSON.stringify(prediction, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ia-prediction-${prediction.case_id}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  navigateToTension() {
    const caseId = this.caseId$.getValue();
    this.router.navigate([`/cases/${caseId}/tension`]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### 5. Template: bloc6-ia.component.html

```html
<div class="bloc6-container">

  <!-- MANDATORY: IA Disclaimer (non-dismissible) -->
  <app-finaces-ia-disclaimer [variant]="'banner'" [dismissible]="false">
  </app-finaces-ia-disclaimer>

  <!-- Header -->
  <div class="bloc-header">
    <div class="header-info">
      <h2 class="bloc-title">
        <mat-icon>smart_toy</mat-icon>
        PRÉDICTION IA — Rail 2 (CONSULTATIF)
      </h2>
      <p class="bloc-subtitle">
        Analyse algorithmique basée sur XGBoost. Non décisionnelle. À titre informatif.
      </p>
    </div>
  </div>

  <!-- Configuration Section -->
  <mat-card class="config-card">
    <mat-card-header>
      <h3>Configuration du Modèle</h3>
    </mat-card-header>
    <mat-card-content>
      <form [formGroup]="configForm" class="config-form">

        <div class="config-row">
          <div class="config-item">
            <p class="label">Source des données</p>
            <mat-button-group>
              <button mat-stroked-button
                      [class.active]="configForm.get('useCachedFeatures').value"
                      (click)="configForm.patchValue({useCachedFeatures: true})">
                📦 Utiliser cache
              </button>
              <button mat-stroked-button
                      [class.active]="!configForm.get('useCachedFeatures').value"
                      (click)="configForm.patchValue({useCachedFeatures: false})">
                🔄 Recalculer
              </button>
            </mat-button-group>
          </div>

          <div class="config-item">
            <mat-checkbox formControlName="includeShap">
              ✓ Inclure explications SHAP
            </mat-checkbox>
          </div>

          <div class="config-item">
            <mat-checkbox formControlName="includeSensitivity">
              ✓ Inclure simulations What-If
            </mat-checkbox>
          </div>

          <div class="config-item">
            <mat-checkbox formControlName="debugMode">
              🐛 Mode debug
            </mat-checkbox>
          </div>
        </div>

        <div class="config-actions">
          <button mat-raised-button color="primary"
                  (click)="loadPrediction(!configForm.get('useCachedFeatures').value)"
                  [disabled]="(isLoading$ | async)">
            <mat-icon>play_arrow</mat-icon>
            Lancer Prédiction IA
          </button>
        </div>

      </form>
    </mat-card-content>
  </mat-card>

  <!-- Loading state -->
  <mat-progress-bar *ngIf="(isLoading$ | async)" mode="indeterminate"></mat-progress-bar>

  <!-- Error state -->
  <div *ngIf="(error$ | async) as error && !(isLoading$ | async)">
    <mat-card class="error-card">
      <mat-card-header>
        <mat-icon color="warn" class="error-icon">error</mat-icon>
        <h3>Prédiction IA Indisponible</h3>
      </mat-card-header>
      <mat-card-content>
        <p>{{ error }}</p>
        <p class="error-note">
          ⚠️ La prédiction IA n'est pas disponible. Le scoring MCC continue indépendamment.
        </p>
        <button mat-raised-button color="accent" (click)="retryPrediction()">
          <mat-icon>refresh</mat-icon>
          Réessayer
        </button>
      </mat-card-content>
    </mat-card>
  </div>

  <!-- Prediction Result (visible if success) -->
  <mat-card *ngIf="(prediction$ | async) as prediction"
            class="prediction-result-card"
            [ngClass]="prediction.prediction_status">

    <mat-card-header class="result-header">
      <h3>Résultat de la Prédiction</h3>
    </mat-card-header>

    <mat-card-content class="result-content">
      <div class="result-left">
        <!-- IA Gauge (less prominent than MCC) -->
        <app-finaces-score-gauge
          [score]="prediction.ia_score"
          [rail]="'IA'"
          [size]="140">
        </app-finaces-score-gauge>
      </div>

      <div class="result-center-divider"></div>

      <div class="result-right">
        <!-- Probability -->
        <div class="metric-group">
          <p class="metric-label">Probabilité de Défaut</p>
          <div class="metric-value">
            {{ prediction.probability_default | number:'1.1-1' }}%
            <mat-icon matTooltip="Intervalle: {{ prediction.confidence_interval.lower_bound * 100 | number:'1.1-1' }}% - {{ prediction.confidence_interval.upper_bound * 100 | number:'1.1-1' }}%"
                      class="info-icon">info</mat-icon>
          </div>
          <mat-progress-bar mode="determinate"
                            [value]="prediction.probability_default"
                            class="pdia-bar"></mat-progress-bar>
        </div>

        <!-- Confidence -->
        <div class="metric-group">
          <p class="metric-label">Confiance du Modèle</p>
          <p class="metric-value">{{ prediction.confidence_level * 100 | number:'1.0-0' }}%</p>
        </div>

        <!-- Risk Badge -->
        <app-finaces-risk-badge
          [riskClass]="ia_risk_class(prediction.probability_default)"
          [rail]="'IA'">
        </app-finaces-risk-badge>

        <!-- Metadata -->
        <p class="prediction-metadata">
          <strong>Modèle:</strong> {{ prediction.model_info.name }} v{{ prediction.model_info.version }}<br>
          <strong>Temps calc:</strong> {{ prediction.calculation_time_ms }}ms<br>
          <strong>Features validées:</strong> {{ prediction.features_validated_count }}/{{ prediction.model_info.features_count }}
        </p>

      </div>
    </mat-card-content>

  </mat-card>

  <!-- SHAP Explanations -->
  <mat-card *ngIf="(prediction$ | async) as prediction"
            class="shap-card"
            [hidden]="!configForm.get('includeShap').value">
    <mat-card-header>
      <h3>Explications SHAP — Top 10 Features Impactantes</h3>
      <p class="subtitle">
        Les indicateurs financiers ayant le plus influencé la prédiction IA.
        Les barres positives augmentent le risque, négatives le réduisent.
      </p>
    </mat-card-header>
    <mat-card-content>
      <app-finaces-shap-chart
        [features]="prediction.shap_values"
        [maxFeatures]="10">
      </app-finaces-shap-chart>
    </mat-card-content>
  </mat-card>

  <!-- What-If Sensitivity Analysis -->
  <mat-card *ngIf="(prediction$ | async) as prediction"
            class="whatif-card"
            [hidden]="!configForm.get('includeSensitivity').value">
    <mat-card-header>
      <h3>Analyse de Sensibilité — Simulations What-If</h3>
      <p class="subtitle warning">
        ⚠️ Simulations indicatives — non décisionnelles.
        Basées sur des variations de ±1 écart-type.
      </p>
    </mat-card-header>
    <mat-card-content>
      <app-finaces-what-if
        [simulations]="prediction.sensitivity_simulations"
        [currentScore]="prediction.ia_score"
        [currentPdia]="prediction.probability_default">
      </app-finaces-what-if>
    </mat-card-content>
  </mat-card>

  <!-- Data Quality Alert (if issues) -->
  <mat-alert *ngIf="(prediction$ | async) as prediction"
             [hidden]="prediction.features_missing.length === 0"
             type="warning">
    <strong>Alerte Qualité Données:</strong>
    {{ prediction.features_missing.length }} feature(s) manquante(s) pour le modèle.
    Prédiction complétée avec valeurs par défaut. Fiabilité réduite.
  </mat-alert>

  <!-- Action Footer -->
  <div class="action-footer">
    <div class="button-group">
      <button mat-button (click)="exportPrediction((prediction$ | async))">
        <mat-icon>download</mat-icon>
        Exporter Prédiction
      </button>
      <button mat-button (click)="navigateToTension()">
        <mat-icon>send</mat-icon>
        Notifier Analyste MCC
      </button>
      <button mat-raised-button color="primary"
              (click)="navigateToTension()"
              [disabled]="(isLoading$ | async)">
        <mat-icon>arrow_forward</mat-icon>
        Analyser Tension MCC ↔ IA →
      </button>
    </div>
  </div>

</div>
```

---

### 6. Sub-component: FinacesIaDisclaimerComponent

```typescript
@Component({
  selector: 'app-finaces-ia-disclaimer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="ia-disclaimer"
         [ngClass]="'variant-' + variant"
         [@slideIn]>

      <div class="disclaimer-header">
        <mat-icon class="warning-icon">warning_amber</mat-icon>
        <div class="disclaimer-text">
          <strong>Avertissement — Prédiction IA</strong>
          <p>
            Ceci est une prédiction algorithmique basée sur des données historiques.
            Elle <strong>ne constitue pas une analyse de risque officielle</strong> et
            <strong>ne peut pas remplacer l'avis d'expert</strong>.
            À titre consultatif uniquement. Voir conditions d'utilisation.
          </p>
        </div>
      </div>

      <button *ngIf="dismissible" mat-icon-button (click)="onDismiss()" class="dismiss-btn">
        <mat-icon>close</mat-icon>
      </button>

    </div>
  `,
  styles: [`
    .ia-disclaimer {
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      border-left: 4px solid;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      &.variant-banner {
        background: rgba(255, 193, 7, 0.1);
        border-left-color: #ffc107;
        color: #ff8f00;
      }

      &.variant-inline {
        background: rgba(33, 150, 243, 0.05);
        border-left-color: #2196f3;
        margin: 8px 0;
      }

      .disclaimer-header {
        display: flex;
        gap: 12px;
        flex: 1;

        .warning-icon {
          font-size: 20px;
          height: 20px;
          width: 20px;
          flex-shrink: 0;
        }

        .disclaimer-text {
          strong { display: block; margin-bottom: 4px; }
          p { margin: 0; font-size: 0.9em; line-height: 1.4; }
        }
      }

      .dismiss-btn {
        flex-shrink: 0;
      }
    }
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class FinacesIaDisclaimerComponent {
  @Input() variant: 'banner' | 'inline' = 'banner';
  @Input() dismissible = true;
  @Output() dismissed = new EventEmitter<void>();

  onDismiss() {
    this.dismissed.emit();
  }
}
```

---

### 7. Sub-component: FinacesSHAPChartComponent

```typescript
@Component({
  selector: 'app-finaces-shap-chart',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="shap-chart-container">
      <table mat-table [dataSource]="features" class="shap-table">

        <!-- Rank Column -->
        <ng-container matColumnDef="rank">
          <th mat-header-cell>#</th>
          <td mat-cell class="rank-cell">{{ element.feature_importance_rank }}</td>
        </ng-container>

        <!-- Feature Name Column -->
        <ng-container matColumnDef="name">
          <th mat-header-cell>Indicateur</th>
          <td mat-cell>{{ element.feature_name }}</td>
        </ng-container>

        <!-- Raw Value Column -->
        <ng-container matColumnDef="value">
          <th mat-header-cell>Valeur</th>
          <td mat-cell>{{ element.raw_value | number:'1.2-2' }}</td>
        </ng-container>

        <!-- SHAP Bar Chart Column -->
        <ng-container matColumnDef="shap_bar">
          <th mat-header-cell>Impact SHAP</th>
          <td mat-cell class="shap-bar-cell">
            <div class="shap-bar-container">
              <!-- Negative (risk-reducing) bar -->
              <div *ngIf="element.shap_value < 0"
                   class="shap-bar negative"
                   [style.width.%]="Math.abs(element.shap_value) * 100 / maxShapAbs"
                   [matTooltip]="element.explanation">
              </div>
              <!-- Positive (risk-increasing) bar -->
              <div *ngIf="element.shap_value >= 0"
                   class="shap-bar positive"
                   [style.width.%]="element.shap_value * 100 / maxShapAbs"
                   [matTooltip]="element.explanation">
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Direction Column -->
        <ng-container matColumnDef="direction">
          <th mat-header-cell>Direction</th>
          <td mat-cell>
            <mat-icon [class]="'direction-' + element.direction | lowercase">
              {{ element.direction === 'POSITIVE' ? 'trending_up' : 'trending_down' }}
            </mat-icon>
            {{ element.direction }}
          </td>
        </ng-container>

        <!-- SHAP Value Column -->
        <ng-container matColumnDef="shap_value">
          <th mat-header-cell>Valeur SHAP</th>
          <td mat-cell [class]="'shap-value-' + element.direction | lowercase">
            {{ element.shap_value | number:'1.4-4' }}
          </td>
        </ng-container>

        <tr mat-header-row></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

      </table>
    </div>
  `,
  styles: [`
    .shap-chart-container {
      overflow-x: auto;
    }

    .shap-table {
      width: 100%;
      th, td { padding: 8px; text-align: left; }
    }

    .rank-cell {
      font-weight: bold;
      width: 30px;
    }

    .shap-bar-cell {
      padding: 8px;
    }

    .shap-bar-container {
      display: flex;
      align-items: center;
      height: 24px;
      width: 200px;
      background: var(--bg-light);
      border-radius: 2px;
      border: 1px solid #e0e0e0;
    }

    .shap-bar {
      height: 20px;
      border-radius: 1px;
      transition: all 0.2s;

      &.positive {
        background: linear-gradient(90deg, rgba(244, 67, 54, 0.5), rgba(244, 67, 54, 0.8));
      }

      &.negative {
        background: linear-gradient(90deg, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 0.5));
      }

      &:hover {
        opacity: 0.9;
      }
    }

    .shap-value-positive {
      color: #f44336;
      font-weight: 600;
    }

    .shap-value-negative {
      color: #4caf50;
      font-weight: 600;
    }

    .direction-positive {
      color: #f44336;
    }

    .direction-negative {
      color: #4caf50;
    }
  `]
})
export class FinacesSHAPChartComponent {
  @Input() features: ShapFeature[];
  @Input() maxFeatures = 10;

  displayedColumns = ['rank', 'name', 'value', 'shap_bar', 'direction', 'shap_value'];
  Math = Math;

  get maxShapAbs(): number {
    if (!this.features) return 1;
    return Math.max(...this.features.map(f => Math.abs(f.shap_value)));
  }
}
```

---

### 8. Sub-component: FinacesWhatIfComponent

```typescript
@Component({
  selector: 'app-finaces-what-if',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <div class="whatif-container">

      <!-- Current Baseline -->
      <div class="baseline-card">
        <h4>Baseline Actuel</h4>
        <p>
          <strong>Score IA:</strong> {{ currentScore | number:'1.1-1' }}/5 <br>
          <strong>Prob. Défaut:</strong> {{ currentPdia | number:'1.1-1' }}%
        </p>
      </div>

      <!-- Simulations List -->
      <mat-accordion>
        <mat-expansion-panel *ngFor="let sim of simulations; let i = index"
                             class="simulation-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              {{ i + 1 }}. Si {{ sim.feature_name }} passe de {{ sim.original_value | number:'1.2-2' }} → {{ sim.simulated_value | number:'1.2-2' }}
            </mat-panel-title>
            <mat-panel-description>
              <span class="delta"
                    [class]="sim.score_delta > 0 ? 'negative' : 'positive'">
                Score: {{ sim.estimated_new_score | number:'1.1-1' }}
                ({{ sim.score_delta > 0 ? '+' : '' }}{{ sim.score_delta | number:'1.2-2' }})
              </span>
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="simulation-content">
            <p class="description">{{ sim.impact_description }}</p>

            <table mat-table [dataSource]="[sim]" class="sim-table">
              <ng-container matColumnDef="metric">
                <th mat-header-cell>Métrique</th>
                <td mat-cell></td>
              </ng-container>

              <ng-container matColumnDef="current">
                <th mat-header-cell>Actuel</th>
              </ng-container>

              <ng-container matColumnDef="simulated">
                <th mat-header-cell>Simulé</th>
              </ng-container>

              <ng-container matColumnDef="delta">
                <th mat-header-cell>Δ</th>
              </ng-container>

              <tr mat-header-row></tr>

              <!-- Score row -->
              <tr mat-row>
                <td mat-cell><strong>Score IA</strong></td>
                <td mat-cell>{{ currentScore | number:'1.1-1' }}</td>
                <td mat-cell>{{ sim.estimated_new_score | number:'1.1-1' }}</td>
                <td mat-cell [class]="sim.score_delta > 0 ? 'negative' : 'positive'">
                  {{ sim.score_delta > 0 ? '+' : '' }}{{ sim.score_delta | number:'1.2-2' }}
                </td>
              </tr>

              <!-- PDIA row -->
              <tr mat-row>
                <td mat-cell><strong>Prob. Défaut</strong></td>
                <td mat-cell>{{ currentPdia | number:'1.1-1' }}%</td>
                <td mat-cell>{{ sim.estimated_new_pdia | number:'1.1-1' }}%</td>
                <td mat-cell [class]="sim.estimated_new_pdia > currentPdia ? 'negative' : 'positive'">
                  {{ (sim.estimated_new_pdia - currentPdia) > 0 ? '+' : '' }}
                  {{ (sim.estimated_new_pdia - currentPdia) | number:'1.1-1' }}%
                </td>
              </tr>

            </table>
          </div>
        </mat-expansion-panel>
      </mat-accordion>

      <!-- Add Simulation Button -->
      <button mat-button class="add-sim-button">
        <mat-icon>add</mat-icon>
        + Ajouter une simulation personnalisée
      </button>

    </div>
  `,
  styles: [`
    .whatif-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .baseline-card {
      padding: 12px;
      background: var(--bg-light);
      border-radius: 4px;
      border-left: 3px solid var(--ia-high);

      h4 { margin-top: 0; color: var(--ia-high); }
      p { margin: 0; font-size: 0.95em; }
    }

    .simulation-panel {
      border-left: 3px solid var(--ia-moderate);
    }

    .simulation-content {
      padding: 12px 0;

      .description {
        font-style: italic;
        color: var(--text-secondary);
        margin-bottom: 12px;
      }

      .sim-table {
        width: 100%;
        th, td { padding: 8px; }
      }

      .negative { color: #f44336; font-weight: 600; }
      .positive { color: #4caf50; font-weight: 600; }
    }

    .delta {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 600;

      &.positive {
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
      }

      &.negative {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
      }
    }

    .add-sim-button {
      align-self: flex-start;
      color: var(--ia-moderate);
    }
  `]
})
export class FinacesWhatIfComponent {
  @Input() simulations: SensitivitySimulation[];
  @Input() currentScore: number;
  @Input() currentPdia: number;
}
```

---

### 9. Service: IAPredictionService

```typescript
@Injectable({ providedIn: 'root' })
export class IAPredictionService {

  constructor(private http: HttpClient) {}

  predictRisk(
    caseId: string,
    config?: IAPredictionConfig
  ): Observable<IAPredictionSchema> {
    let params = new HttpParams();

    if (config) {
      params = params
        .set('cache', config.use_cached_features.toString())
        .set('shap', config.include_shap.toString())
        .set('sensitivity', config.include_sensitivity.toString())
        .set('confidence_intervals', config.include_confidence_intervals.toString())
        .set('debug', config.debug_mode.toString());
    }

    return this.http.get<IAPredictionSchema>(
      `/api/v1/ia/cases/${caseId}/prediction`,
      { params }
    ).pipe(
      tap(result => console.log('IA Prediction:', result)),
      timeout(30000),  // 30s max
      catchError(err => {
        console.error('IA prediction error:', err);
        return throwError(() => new Error('Prédiction IA indisponible'));
      })
    );
  }

  // Optional: Stream predictions for long-running jobs
  streamPrediction(caseId: string): Observable<IAPredictionSchema> {
    // Implementation using WebSocket if backend supports it
    // Alternative to HTTP long-polling
    return new Observable(subscriber => {
      const ws = new WebSocket(`ws://localhost:8000/api/v1/ia/cases/${caseId}/predict/stream`);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        subscriber.next(data);
      };
      ws.onerror = (err) => subscriber.error(err);
      ws.onclose = () => subscriber.complete();
      return () => ws.close();
    });
  }
}
```

---

## CONTRAINTES ANGULAR

### Standalone Components
- Tous les composants Bloc 6 sont **standalone: true**
- Imports explicites pour tous

### Change Detection
- OnPush optimisée
- markForCheck() après prédiction
- Observables + async pipe

### Performance
- IA prediction peut prendre 5-15s (toléré)
- SHAP chart: SVG ou Canvas optimisé
- What-If: virtualScroll si >20 simulations
- Lazy load SHAP si disable

### Accessibility
- Disclaimer toujours visible (non-dismissible)
- Color + icon pour direction (positive/negative)
- Tooltips sur SHAP bars

---

## BINDING API

### Endpoints

```typescript
// GET /api/v1/ia/cases/{id}/prediction
// Query params:
//   ?cache=true|false
//   ?shap=true|false
//   ?sensitivity=true|false
//   ?confidence_intervals=true|false
//   ?debug=true|false
// Output: IAPredictionSchema

// Alternative (WebSocket):
// ws://localhost:8000/api/v1/ia/cases/{id}/predict/stream
```

### Error handling
- 408 Timeout: afficher message, proposer retry avec recalculation
- 503 Service unavailable: afficher disclaimer, pas de retry auto
- 400 Bad data: afficher alerte qualité données
- 500: generic error avec retry

---

## CRITÈRES DE VALIDATION

### Fonctionnels
- ✓ Disclaimer IA visible en top, non-dismissible
- ✓ Gauge IA affiche score 0-5 avec couleurs bleu→violet
- ✓ Probabilité défaut affichée avec intervalle confiance
- ✓ SHAP chart affiche top 10 features avec bars positives/négatives
- ✓ What-If simulations affichées, au moins 3+ suggestions
- ✓ Configuration modèle disponible (cache/recalculate)
- ✓ État indisponible gère IA down avec retry

### Techniques
- ✓ MCC-R2 respectée: IA ne remplace jamais MCC
- ✓ MCC-R3 respectée: disclaimer non-dismissible obligatoire
- ✓ MCC-R4 respectée: IA hiérarchie visuelle secondaire
- ✓ API calls: timeout 30s, gestion erreurs propre
- ✓ Performance: prédiction < 15s, render < 200ms

### UX
- ✓ Prédiction status clair (loading/success/error)
- ✓ Export prédiction JSON fonctionnel
- ✓ Navigation vers Tension fluide
- ✓ Explications SHAP compréhensibles par analyste
- ✓ Pas de confusion avec scoring MCC (visuel clair)

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/features/cases/components/
├── bloc6-ia/
│   ├── bloc6-ia.component.ts
│   ├── bloc6-ia.component.html
│   ├── bloc6-ia.component.scss
│   └── sub-components/
│       ├── finaces-ia-disclaimer/
│       │   ├── finaces-ia-disclaimer.component.ts
│       │   ├── finaces-ia-disclaimer.component.html
│       │   └── finaces-ia-disclaimer.component.scss
│       ├── finaces-shap-chart/
│       │   ├── finaces-shap-chart.component.ts
│       │   ├── finaces-shap-chart.component.html
│       │   └── finaces-shap-chart.component.scss
│       └── finaces-what-if/
│           ├── finaces-what-if.component.ts
│           ├── finaces-what-if.component.html
│           └── finaces-what-if.component.scss
src/app/features/cases/services/
└── ia-prediction.service.ts
src/app/shared/models/
└── ia-prediction.model.ts
```

**Routing:**
- Route `/cases/:caseId/ia`
- Guards: GateCheckGuard, StatusCheckGuard
- Navigation from Bloc 4 (Ratios) → Bloc 6 (simultané avec Bloc 5)
- Navigation from Bloc 6 → Bloc 7 (Tension) après completion

---

**STATUS À LA FIN :** Dossier reste `RATIOS_COMPUTED` (IA parallèle à MCC)
**NEXT PROMPT :** P14 — Bloc 7 — Tension MCC↔IA (Comparaison, Décision)
