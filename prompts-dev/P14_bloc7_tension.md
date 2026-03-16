═══════════════════════════════════════════════════════════
PROMPT 14 — BLOC 7 — Tension MCC↔IA
Dépend de : PROMPT 12 (Scoring MCC complété) ET PROMPT 13 (Prédiction IA)
Peut être parallélisé avec : Aucun (BLOQUER sur les deux autres)
═══════════════════════════════════════════════════════════

## CONTEXTE

À ce stade, le dossier a :
- ✓ Score MCC (source officielle, 0-5)
- ✓ Prédiction IA (source consultatif, 0-5)

Le **Bloc 7 analyse la tension** entre les deux sources : écart de notation, divergence de classification de risque, implications pour la décision finale.

Ce bloc :
1. **Calcule la tension** (algorithme: ordinal levels + delta + direction)
2. **Affiche un banner conditionnel** (SEVERE=rouge, MODERATE=orange, MILD=bleu, NONE=vert)
3. **Compare côte-à-côte** (tableau: Pilier | MCC | IA | Δ | Statut)
4. **Collecte commentaire analyste** (obligatoire si MODERATE/SEVERE)
5. **Permet la décision** (FOLLOW_MCC, FOLLOW_IA exceptionnellement, INVESTIGATE)
6. **Escalade senior** si nécessaire

La tension est **purement calculée côté frontend** (aucun appel API). Si IA indisponible, état "Non applicable".

---

## RÈGLES MÉTIER APPLICABLES

### MCC-R1 : Unicité de la décision MCC
- Score MCC **prime toujours** en cas de tension
- Commentaire analyste **par rapport à** tension, pas remplacement du score

### MCC-R5 : Tension MODERATE/SEVERE = Commentaire obligatoire
- SEVERE (|delta| ≥ 3 niveaux ou direction UP + écart 2 niveaux) → **revue senior obligatoire**
- MODERATE (|delta| = 2 niveaux ou certaines combinaisons) → **commentaire analyste obligatoire**
- MILD (|delta| = 1 niveau) → recommandé mais pas obligatoire
- NONE (delta = 0) → aucune action spéciale

### MCC-R2 : IA ne remplace jamais MCC
- Les options de décision incluent "FOLLOW_MCC" (standard), "FOLLOW_IA" (exception documentée), "INVESTIGATE"
- "FOLLOW_IA" nécessite **justification écrite** (override-like mechanism)

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. Route Angular

```typescript
{
  path: 'cases/:caseId/tension',
  component: Bloc7TensionComponent,
  data: {
    bloc: 'BLOC7_TENSION',
    requiredStatus: ['SCORING_DONE', 'STRESS_DONE', ...],
    requiredGateStatus: 'SEALED'
  }
}
```

---

### 2. Data Models (tension.model.ts)

```typescript
// Tension Calculation
export interface TensionAnalysis {
  case_id: string;
  mcc_score: number;         // 0-5
  ia_score: number;          // 0-5 (or null if IA unavailable)

  // Classification
  mcc_risk_class: string;    // CRITIQUE|ÉLEVÉ|MODÉRÉ|FAIBLE|TRÈS_FAIBLE
  ia_risk_class: string;     // Nullable

  // Ordinal levels (for distance calculation)
  mcc_ordinal: number;       // 0=TRÈS_FAIBLE, 1=FAIBLE, 2=MODÉRÉ, 3=ÉLEVÉ, 4=CRITIQUE
  ia_ordinal: number;        // Same scale

  // Tension calculation
  tension_level: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  tension_delta: number;     // ia_ordinal - mcc_ordinal (signed)
  tension_direction: 'NEUTRAL' | 'UP' | 'DOWN';  // UP=IA more pessimistic

  // Pillar-level comparison
  pillar_tensions: PillarTension[];

  // Rules & Status
  ia_available: boolean;
  comment_required: boolean; // true if MODERATE or SEVERE
  senior_review_required: boolean; // true if SEVERE

  // Analyst response (Phase 3)
  analyst_comment?: string;
  decision: 'PENDING' | 'FOLLOW_MCC' | 'FOLLOW_IA' | 'INVESTIGATE';
  decision_rationale?: string;
  decision_date?: string;
  analyst_id?: string;
}

export interface PillarTension {
  pillar_id: string;        // LIQUIDITE, SOLVABILITE, RENTABILITE, CAPACITE, QUALITE
  pillar_name: string;

  mcc_score: number;        // 0-5
  ia_score: number;         // 0-5 (or null)

  mcc_ordinal: number;      // 0-4
  ia_ordinal: number;       // 0-4

  delta: number;            // ia_ordinal - mcc_ordinal
  direction: 'UP' | 'DOWN' | 'NEUTRAL';

  // IA explanation (from Bloc 6)
  ia_explanation?: string;

  // Status
  aligned: boolean;         // true if delta = 0
  diverging: boolean;       // true if |delta| >= 2

  status_badge: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

export type TensionDecision = 'PENDING' | 'FOLLOW_MCC' | 'FOLLOW_IA' | 'INVESTIGATE';
```

### 3. Tension Calculation Algorithm

```typescript
// Frontend logic to compute tension (no backend call)

export function calculateTension(
  mccScore: number,
  mccRiskClass: string,
  iaScore: number | null,
  iaRiskClass: string | null
): TensionAnalysis {

  // If IA unavailable
  if (iaScore === null || iaRiskClass === null) {
    return {
      ...baseData,
      ia_available: false,
      tension_level: 'NONE',
      comment_required: false,
      senior_review_required: false
    };
  }

  // Convert to ordinal
  const mccOrdinal = riskClassToOrdinal(mccRiskClass);
  const iaOrdinal = riskClassToOrdinal(iaRiskClass);

  // Calculate delta
  const delta = iaOrdinal - mccOrdinal;

  // Determine direction
  const direction = delta > 0 ? 'UP' : delta < 0 ? 'DOWN' : 'NEUTRAL';

  // Determine tension level (from absolute delta)
  let tensionLevel: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';

  if (Math.abs(delta) === 0) {
    tensionLevel = 'NONE';
  } else if (Math.abs(delta) === 1) {
    tensionLevel = 'MILD';
  } else if (Math.abs(delta) === 2) {
    // MODERATE unless specific conditions
    tensionLevel = 'MODERATE';
  } else if (Math.abs(delta) >= 3) {
    tensionLevel = 'SEVERE';
  }

  // Special case: UP direction + |delta| >= 2 = SEVERE (IA more pessimistic)
  if (direction === 'UP' && Math.abs(delta) >= 2) {
    tensionLevel = 'SEVERE';
  }

  return {
    case_id: ...,
    mcc_score: mccScore,
    ia_score: iaScore,
    mcc_risk_class: mccRiskClass,
    ia_risk_class: iaRiskClass,
    mcc_ordinal: mccOrdinal,
    ia_ordinal: iaOrdinal,
    tension_level: tensionLevel,
    tension_delta: delta,
    tension_direction: direction,
    ia_available: true,
    comment_required: ['MODERATE', 'SEVERE'].includes(tensionLevel),
    senior_review_required: tensionLevel === 'SEVERE',
    decision: 'PENDING',
    pillar_tensions: pillarComparison(...)
  };
}

function riskClassToOrdinal(riskClass: string): number {
  const mapping: Record<string, number> = {
    'TRÈS_FAIBLE': 0,
    'FAIBLE': 1,
    'MODÉRÉ': 2,
    'ÉLEVÉ': 3,
    'CRITIQUE': 4
  };
  return mapping[riskClass] ?? 2;  // default to MODÉRÉ
}
```

---

### 4. Component Architecture: Bloc7TensionComponent

```typescript
@Component({
  selector: 'app-bloc7-tension',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatExpansionModule,
    MatAlertModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    TensionBannerComponent,
    TensionComparisonComponent,
    PillarTensionTableComponent,
    AnalystDecisionComponent,
  ],
  templateUrl: './bloc7-tension.component.html',
  styleUrls: ['./bloc7-tension.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Bloc7TensionComponent implements OnInit, OnDestroy {
  caseId$ = this.route.paramMap.pipe(map(p => p.get('caseId')));

  // Data
  scorecard$: Observable<ScorecardOutputSchema>;
  prediction$: Observable<IAPredictionSchema | null>;
  tension$: Observable<TensionAnalysis>;

  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  // State
  commentForm: FormGroup;
  decisionForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private scoringService: ScoringMccService,
    private iaService: IAPredictionService,
    private caseService: CaseService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private notif: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.commentForm = this.fb.group({
      analyst_comment: ['', Validators.minLength(50)]
    });

    this.decisionForm = this.fb.group({
      decision: ['PENDING', Validators.required],
      decision_rationale: ['']
    });
  }

  ngOnInit() {
    const caseId = this.caseId$.getValue();

    this.isLoading$.next(true);

    // Load MCC scorecard + IA prediction in parallel
    forkJoin([
      this.scoringService.computeScore(caseId).pipe(catchError(() => of(null))),
      this.iaService.predictRisk(caseId).pipe(catchError(() => of(null)))
    ]).pipe(
      tap(([scorecard, prediction]) => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      }),
      switchMap(([scorecard, prediction]) => {
        // Calculate tension
        const tension = scorecard && prediction
          ? this.calculateTension(scorecard, prediction)
          : this.calculateTensionNoIA(scorecard);

        return of(tension);
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    ).subscribe(
      tension => {
        this.tension$ = of(tension);
        // Update form validation based on tension level
        this.updateFormValidation(tension);
      },
      err => {
        this.error$.next(err.message);
        this.isLoading$.next(false);
      }
    );
  }

  private calculateTension(scorecard: ScorecardOutputSchema, prediction: IAPredictionSchema): TensionAnalysis {
    // Using the algorithm from tension.model.ts
    return calculateTension(
      scorecard.global_score,
      scorecard.final_risk_class,
      prediction.ia_score,
      this.ia_risk_class(prediction.probability_default)
    );
  }

  private calculateTensionNoIA(scorecard: ScorecardOutputSchema): TensionAnalysis {
    return calculateTension(
      scorecard.global_score,
      scorecard.final_risk_class,
      null,
      null
    );
  }

  private updateFormValidation(tension: TensionAnalysis) {
    if (tension.comment_required) {
      this.commentForm.get('analyst_comment').setValidators([
        Validators.required,
        Validators.minLength(50)
      ]);
    }

    if (tension.senior_review_required) {
      this.decisionForm.get('decision_rationale').setValidators([
        Validators.required,
        Validators.minLength(100)
      ]);
    }

    this.commentForm.updateValueAndValidity();
    this.decisionForm.updateValueAndValidity();
  }

  saveTensionAnalysis(tension: TensionAnalysis) {
    if (tension.comment_required && this.commentForm.invalid) {
      this.notif.open('Commentaire obligatoire pour tension MODERATE/SEVERE', 'Fermer');
      return;
    }

    const caseId = this.caseId$.getValue();
    const payload = {
      analyst_comment: this.commentForm.get('analyst_comment').value,
      decision: this.decisionForm.get('decision').value,
      decision_rationale: this.decisionForm.get('decision_rationale').value
    };

    this.caseService.saveTensionDecision(caseId, payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      () => {
        this.notif.open('Analyse de tension enregistrée', '', { duration: 3000 });
        this.navigateToStress();
      },
      err => this.notif.open(`Erreur: ${err.message}`, 'Fermer')
    );
  }

  escalateToManager(caseId: string) {
    this.caseService.escalateCase(caseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      () => {
        this.notif.open('Dossier escaladé au manager', '', { duration: 3000 });
        this.router.navigate(['/cases']);
      },
      err => this.notif.open(`Erreur: ${err.message}`, 'Fermer')
    );
  }

  navigateToStress() {
    const caseId = this.caseId$.getValue();
    this.router.navigate([`/cases/${caseId}/stress`]);
  }

  private ia_risk_class(pdia: number): string {
    if (pdia < 10) return 'TRÈS_FAIBLE';
    if (pdia < 20) return 'FAIBLE';
    if (pdia < 35) return 'MODÉRÉ';
    if (pdia < 50) return 'ÉLEVÉ';
    return 'CRITIQUE';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### 5. Template: bloc7-tension.component.html

```html
<div class="bloc7-container">

  <!-- Header -->
  <div class="bloc-header">
    <div class="header-info">
      <h2 class="bloc-title">
        <mat-icon>compare</mat-icon>
        ANALYSE DE TENSION MCC ↔ IA
      </h2>
      <p class="bloc-subtitle">
        Comparaison des notations. Identification des divergences et décision analyste.
      </p>
    </div>
  </div>

  <!-- Loading state -->
  <mat-progress-bar *ngIf="(isLoading$ | async)" mode="indeterminate"></mat-progress-bar>

  <!-- Error banner -->
  <mat-alert *ngIf="(error$ | async) as error" type="error">
    {{ error }}
  </mat-alert>

  <!-- Tension Banner (Conditional) -->
  <app-tension-banner
    *ngIf="(tension$ | async) as tension"
    [tension]="tension">
  </app-tension-banner>

  <!-- Side-by-Side Comparison -->
  <app-tension-comparison
    *ngIf="(tension$ | async) as tension"
    [tension]="tension">
  </app-tension-comparison>

  <!-- Pillar-level Analysis Table -->
  <app-pillar-tension-table
    *ngIf="(tension$ | async) as tension"
    [pillarTensions]="tension.pillar_tensions">
  </app-pillar-tension-table>

  <!-- System Recommendations -->
  <mat-card class="recommendations-card"
            *ngIf="(tension$ | async) as tension">
    <mat-card-header>
      <h3>Recommandations Système</h3>
    </mat-card-header>
    <mat-card-content>
      <ol class="recommendations-list">
        <li *ngIf="!tension.ia_available">
          <strong>IA indisponible.</strong>
          Analyse basée sur MCC seul. Pas d'analyse de tension.
        </li>
        <li *ngIf="tension.tension_level === 'SEVERE'">
          <strong>Tension MAJEURE.</strong>
          Revue senior obligatoire avant fermeture. Escalade recommandée.
        </li>
        <li *ngIf="tension.tension_level === 'MODERATE'">
          <strong>Tension modérée.</strong>
          Commentaire analyste obligatoire expliquant la divergence.
        </li>
        <li *ngIf="tension.tension_level === 'MILD'">
          Tension légère. Revue recommandée pour compréhension.
        </li>
        <li *ngIf="tension.tension_direction === 'UP' && tension.ia_available">
          ⚠️ <strong>IA plus pessimiste que MCC.</strong>
          Vérifier facteurs structurels (levier, liquidité, profitabilité).
        </li>
        <li *ngIf="tension.tension_direction === 'DOWN' && tension.ia_available">
          ✓ IA plus optimiste que MCC. Position conservatrice MCC confirmée.
        </li>
      </ol>
    </mat-card-content>
  </mat-card>

  <!-- Analyst Decision Zone -->
  <app-analyst-decision
    *ngIf="(tension$ | async) as tension"
    [tension]="tension"
    [commentForm]="commentForm"
    [decisionForm]="decisionForm"
    (onSave)="saveTensionAnalysis(tension)"
    (onEscalate)="escalateToManager((caseId$ | async))">
  </app-analyst-decision>

  <!-- Action Footer -->
  <div class="action-footer">
    <div class="button-group">
      <button mat-stroked-button color="accent"
              (click)="router.navigate(['/cases/' + (caseId$ | async) + '/ia'])">
        ← Retour Prédiction IA
      </button>
      <button mat-raised-button color="primary"
              (click)="navigateToStress()"
              [disabled]="(isLoading$ | async) || ((tension$ | async)?.comment_required && commentForm.invalid)">
        <mat-icon>arrow_forward</mat-icon>
        Stress Test →
      </button>
    </div>
  </div>

</div>
```

---

### 6. Sub-component: TensionBannerComponent

```typescript
@Component({
  selector: 'app-tension-banner',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="tension-banner"
         [ngClass]="'severity-' + tension.tension_level | lowercase"
         [@slideIn]>

      <div class="banner-header">
        <mat-icon class="banner-icon">
          {{ bannerIcon(tension.tension_level) }}
        </mat-icon>
        <div class="banner-text">
          <h3 class="banner-title">{{ bannerTitle(tension.tension_level) }}</h3>
          <p class="banner-subtitle">
            <span class="delta-badge">Δ {{ tension.tension_delta > 0 ? '+' : '' }}{{ tension.tension_delta }}</span>
            Direction:
            <strong [class]="'direction-' + tension.tension_direction | lowercase">
              {{ tension.tension_direction }}
            </strong>
          </p>
        </div>
      </div>

      <div class="banner-actions" *ngIf="tension.senior_review_required">
        <span class="escalation-badge">🔴 REVUE SENIOR OBLIGATOIRE</span>
      </div>

    </div>
  `,
  styles: [`
    .tension-banner {
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      border-left: 4px solid;
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease-out;

      &.severity-none {
        background: rgba(76, 175, 80, 0.1);
        border-left-color: #4caf50;
      }

      &.severity-mild {
        background: rgba(33, 150, 243, 0.1);
        border-left-color: #2196f3;
      }

      &.severity-moderate {
        background: rgba(255, 152, 0, 0.1);
        border-left-color: #ff9800;
      }

      &.severity-severe {
        background: rgba(244, 67, 54, 0.1);
        border-left-color: #f44336;
      }

      .banner-header {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;

        .banner-icon {
          font-size: 32px;
          height: 32px;
          width: 32px;
        }

        .banner-text {
          .banner-title {
            margin: 0 0 4px 0;
            font-size: 1.1em;
          }

          .banner-subtitle {
            margin: 0;
            display: flex;
            gap: 12px;
            align-items: center;
            font-size: 0.9em;

            .delta-badge {
              background: rgba(0, 0, 0, 0.1);
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 600;
            }

            .direction-up { color: #f44336; }
            .direction-down { color: #4caf50; }
            .direction-neutral { color: #9e9e9e; }
          }
        }
      }

      .banner-actions {
        margin-left: 20px;

        .escalation-badge {
          background: #f44336;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85em;
        }
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class TensionBannerComponent {
  @Input() tension: TensionAnalysis;

  bannerIcon(level: string): string {
    return {
      'NONE': 'check_circle',
      'MILD': 'info',
      'MODERATE': 'warning_amber',
      'SEVERE': 'priority_high'
    }[level] || 'help';
  }

  bannerTitle(level: string): string {
    return {
      'NONE': '✓ Pas de tension détectée',
      'MILD': '⚠️ Tension légère détectée',
      'MODERATE': '⚠️ TENSION MODÉRÉE',
      'SEVERE': '🔴 TENSION MAJEURE DÉTECTÉE'
    }[level] || 'Tension inconnue';
  }
}
```

---

### 7. Sub-component: TensionComparisonComponent

```typescript
@Component({
  selector: 'app-tension-comparison',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, FinacesScoreGaugeComponent, FinacesRiskBadgeComponent],
  template: `
    <mat-card class="comparison-card">
      <mat-card-header>
        <h3>Comparaison Côte-à-Côte</h3>
      </mat-card-header>
      <mat-card-content class="comparison-content">

        <!-- Left: MCC (DOMINANT) -->
        <div class="comparison-side mcc-side">
          <div class="side-label">MCC (Source Décisionnelle)</div>

          <div class="score-display">
            <app-finaces-score-gauge
              [score]="tension.mcc_score"
              [rail]="'MCC'"
              [size]="140">
            </app-finaces-score-gauge>
          </div>

          <div class="metrics">
            <p class="metric">
              <span class="label">Score MCC:</span>
              <strong>{{ tension.mcc_score | number:'1.1-1' }} / 5</strong>
            </p>
            <p class="metric">
              <span class="label">Classe Risque:</span>
              <app-finaces-risk-badge
                [riskClass]="tension.mcc_risk_class"
                [rail]="'MCC'">
              </app-finaces-risk-badge>
            </p>
            <p class="metric designation">
              ⭐ SOURCE OFFICIELLE MCC
            </p>
          </div>
        </div>

        <!-- Center: Comparison Info -->
        <div class="comparison-center">
          <div class="arrow" [ngClass]="'direction-' + tension.tension_direction | lowercase">
            <mat-icon>{{ directionIcon(tension.tension_direction) }}</mat-icon>
          </div>
          <div class="tension-info">
            <span class="delta-value">Δ {{ tension.tension_delta > 0 ? '+' : '' }}{{ tension.tension_delta }}</span>
            <span class="tension-badge" [ngClass]="'badge-' + tension.tension_level | lowercase">
              {{ tension.tension_level | uppercase }}
            </span>
          </div>
        </div>

        <!-- Right: IA (SECONDARY) -->
        <div class="comparison-side ia-side">
          <div class="side-label">IA (Consultatif)</div>

          <div *ngIf="tension.ia_available" class="score-display">
            <app-finaces-score-gauge
              [score]="tension.ia_score"
              [rail]="'IA'"
              [size]="140">
            </app-finaces-score-gauge>
          </div>

          <div *ngIf="!tension.ia_available" class="unavailable">
            <mat-icon>smart_toy</mat-icon>
            <p>IA Indisponible</p>
          </div>

          <div class="metrics">
            <p *ngIf="tension.ia_available" class="metric">
              <span class="label">Score IA:</span>
              <strong>{{ tension.ia_score | number:'1.1-1' }} / 5</strong>
            </p>
            <p *ngIf="tension.ia_available" class="metric">
              <span class="label">Classe Risque:</span>
              <app-finaces-risk-badge
                [riskClass]="tension.ia_risk_class"
                [rail]="'IA'">
              </app-finaces-risk-badge>
            </p>
            <p class="metric designation">
              ⚠️ NON DÉCISIONNEL
            </p>
          </div>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .comparison-card {
      margin-bottom: 24px;
    }

    .comparison-content {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 24px;
      align-items: center;
    }

    .comparison-side {
      padding: 16px;
      border-radius: 4px;
      text-align: center;

      &.mcc-side {
        background: var(--mcc-surface-light);
        border-left: 4px solid var(--mcc-moderate);
      }

      &.ia-side {
        background: var(--ia-surface-light);
        border-left: 4px solid var(--ia-moderate);
      }

      .side-label {
        font-weight: 600;
        margin-bottom: 12px;
      }

      .score-display {
        display: flex;
        justify-content: center;
        margin: 16px 0;
      }

      .unavailable {
        padding: 40px 20px;
        color: var(--text-secondary);
        mat-icon { font-size: 48px; }
      }

      .metrics {
        text-align: left;
        margin-top: 12px;

        .metric {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
          .label { font-weight: 500; }
        }

        .designation {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          font-style: italic;
          color: var(--text-secondary);
        }
      }
    }

    .comparison-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .arrow {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        mat-icon { font-size: 32px; }

        &.direction-up {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }

        &.direction-down {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }

        &.direction-neutral {
          background: rgba(158, 158, 158, 0.2);
          color: #9e9e9e;
        }
      }

      .tension-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .delta-value {
          font-size: 1.3em;
          font-weight: bold;
        }

        .tension-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;

          &.badge-none {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
          }
          &.badge-mild {
            background: rgba(33, 150, 243, 0.2);
            color: #2196f3;
          }
          &.badge-moderate {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
          }
          &.badge-severe {
            background: rgba(244, 67, 54, 0.2);
            color: #f44336;
          }
        }
      }
    }

    @media (max-width: 1000px) {
      .comparison-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TensionComparisonComponent {
  @Input() tension: TensionAnalysis;

  directionIcon(direction: string): string {
    return {
      'UP': 'trending_up',
      'DOWN': 'trending_down',
      'NEUTRAL': 'trending_flat'
    }[direction] || 'help';
  }
}
```

---

### 8. Sub-component: PillarTensionTableComponent

```typescript
@Component({
  selector: 'app-pillar-tension-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatExpansionModule],
  template: `
    <mat-card class="pillar-tension-card">
      <mat-card-header>
        <h3>Analyse par Pilier</h3>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="pillarTensions" class="pillar-table">

          <!-- Pillar Name -->
          <ng-container matColumnDef="pillar">
            <th mat-header-cell>Pilier</th>
            <td mat-cell>{{ element.pillar_name }}</td>
          </ng-container>

          <!-- MCC Score -->
          <ng-container matColumnDef="mcc_score">
            <th mat-header-cell>MCC</th>
            <td mat-cell>{{ element.mcc_score | number:'1.1-1' }}/5</td>
          </ng-container>

          <!-- IA Score -->
          <ng-container matColumnDef="ia_score">
            <th mat-header-cell>IA</th>
            <td mat-cell>{{ element.ia_score | number:'1.1-1' }}/5</td>
          </ng-container>

          <!-- Delta -->
          <ng-container matColumnDef="delta">
            <th mat-header-cell>Δ</th>
            <td mat-cell [class]="getDeltaClass(element.delta)">
              {{ element.delta > 0 ? '+' : '' }}{{ element.delta }}
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell>Statut</th>
            <td mat-cell>
              <mat-icon [class]="'status-' + element.status_badge | lowercase">
                {{ statusIcon(element.status_badge) }}
              </mat-icon>
              {{ element.aligned ? 'Alignés' : 'Divergents' }}
            </td>
          </ng-container>

          <tr mat-header-row></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .pillar-table {
      width: 100%;
      th, td { padding: 12px; }
    }

    .status-green { color: #4caf50; }
    .status-yellow { color: #ffc107; }
    .status-orange { color: #ff9800; }
    .status-red { color: #f44336; }
  `]
})
export class PillarTensionTableComponent {
  @Input() pillarTensions: PillarTension[];

  displayedColumns = ['pillar', 'mcc_score', 'ia_score', 'delta', 'status'];

  getDeltaClass(delta: number): string {
    if (delta === 0) return 'neutral';
    return delta > 0 ? 'positive' : 'negative';
  }

  statusIcon(status: string): string {
    return {
      'GREEN': 'check_circle',
      'YELLOW': 'info',
      'ORANGE': 'warning',
      'RED': 'error'
    }[status] || 'help';
  }
}
```

---

### 9. Sub-component: AnalystDecisionComponent

```typescript
@Component({
  selector: 'app-analyst-decision',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatAlertModule,
    ReactiveFormsModule
  ],
  template: `
    <mat-expansion-panel class="decision-panel"
                         [ngClass]="tension.comment_required ? 'required' : ''">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon [color]="tension.comment_required ? 'warn' : 'accent'">
            {{ tension.comment_required ? 'assignment' : 'check_circle' }}
          </mat-icon>
          Décision Analyste
        </mat-panel-title>
        <mat-panel-description>
          {{ tension.comment_required ? '(Obligatoire pour cette tension)' : '(Recommandé)' }}
        </mat-panel-description>
      </mat-expansion-panel-header>

      <form [formGroup]="commentForm" class="decision-form">

        <!-- Comment (if required by tension level) -->
        <mat-form-field class="full-width"
                        *ngIf="tension.comment_required">
          <mat-label>Commentaire Analyste (Obligatoire)</mat-label>
          <textarea matInput
                    formControlName="analyst_comment"
                    rows="4"
                    placeholder="Expliquez la divergence MCC/IA et votre analyse..."></textarea>
          <mat-hint>Min. 50 caractères</mat-hint>
          <mat-error *ngIf="commentForm.get('analyst_comment').hasError('required')">
            Commentaire obligatoire
          </mat-error>
          <mat-error *ngIf="commentForm.get('analyst_comment').hasError('minlength')">
            Min. 50 caractères
          </mat-error>
        </mat-form-field>

        <!-- Decision Radio Group -->
        <div class="decision-radio-group" [formGroup]="decisionForm">
          <p class="label"><strong>Décision:</strong></p>

          <mat-radio-button value="FOLLOW_MCC"
                            formControlName="decision"
                            class="radio-option">
            <strong>✓ Valider Score MCC</strong>
            <p class="radio-sublabel">
              MCC prime. Procéder au scoring officiel basé sur MCC.
            </p>
          </mat-radio-button>

          <mat-radio-button value="INVESTIGATE"
                            formControlName="decision"
                            class="radio-option">
            <strong>🔍 Investiguer Divergence</strong>
            <p class="radio-sublabel">
              Approfondir avant décision finale. Requiert discussion.
            </p>
          </mat-radio-button>

          <mat-radio-button value="FOLLOW_IA"
                            formControlName="decision"
                            class="radio-option exception"
                            [disabled]="!canFollowIA">
            <strong>⚠️ Exception: Suivre IA</strong>
            <p class="radio-sublabel">
              Exceptionnellement. TRACE OBLIGATOIRE. Senior review requise.
            </p>
          </mat-radio-button>
        </div>

        <!-- Rationale for IA exception or Senior review -->
        <mat-form-field class="full-width"
                        *ngIf="decisionForm.get('decision').value === 'FOLLOW_IA' || tension.senior_review_required">
          <mat-label>Justification (Obligatoire)</mat-label>
          <textarea matInput
                    formControlName="decision_rationale"
                    rows="4"
                    placeholder="Justifiez pourquoi cette décision s'impose..."></textarea>
          <mat-hint>Min. 100 caractères</mat-hint>
          <mat-error *ngIf="decisionForm.get('decision_rationale').hasError('required')">
            Justification obligatoire
          </mat-error>
          <mat-error *ngIf="decisionForm.get('decision_rationale').hasError('minlength')">
            Min. 100 caractères
          </mat-error>
        </mat-form-field>

        <!-- Alert for IA exception -->
        <mat-alert *ngIf="decisionForm.get('decision').value === 'FOLLOW_IA'" type="warning">
          <strong>⚠️ Exception grave.</strong> Suivre la prédiction IA plutôt que le score MCC.
          Cette décision sera auditée. Revue senior obligatoire.
        </mat-alert>

        <!-- Alert for Senior Review -->
        <mat-alert *ngIf="tension.senior_review_required" type="error">
          <strong>🔴 Revue Senior Obligatoire.</strong>
          Tension MAJEURE détectée. Validation management requise avant fermeture dossier.
        </mat-alert>

        <!-- Action Buttons -->
        <div class="button-group">
          <button mat-button
                  type="button"
                  (click)="onEscalate.emit())"
                  *ngIf="tension.senior_review_required">
            <mat-icon>escalate</mat-icon>
            Escalader au Manager
          </button>
          <button mat-raised-button color="primary"
                  type="button"
                  (click)="onSave.emit()"
                  [disabled]="commentForm.invalid || decisionForm.invalid">
            <mat-icon>save</mat-icon>
            Enregistrer & Continuer
          </button>
        </div>

      </form>

    </mat-expansion-panel>
  `,
  styles: [`
    .decision-panel {
      border-left: 4px solid var(--mcc-moderate);

      &.required {
        border-left-color: var(--warn, #f44336);
      }
    }

    .decision-form {
      padding: 16px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .decision-radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .label { margin: 0 0 12px 0; }

      .radio-option {
        display: block;
        margin-bottom: 16px;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;

        strong { display: block; margin-bottom: 4px; }

        .radio-sublabel {
          margin: 0;
          font-size: 0.9em;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        &.exception {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.05);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  `]
})
export class AnalystDecisionComponent {
  @Input() tension: TensionAnalysis;
  @Input() commentForm: FormGroup;
  @Input() decisionForm: FormGroup;
  @Output() onSave = new EventEmitter<void>();
  @Output() onEscalate = new EventEmitter<void>();

  get canFollowIA(): boolean {
    // IA exception only available if IA available AND analyst has explicit authority
    return this.tension.ia_available;  // Could add role check here
  }
}
```

---

### 10. Service updates (CaseService)

```typescript
@Injectable({ providedIn: 'root' })
export class CaseService {
  // ... existing methods ...

  saveTensionDecision(
    caseId: string,
    decision: TensionDecision
  ): Observable<any> {
    return this.http.post(
      `/api/v1/cases/${caseId}/tension/decision`,
      decision
    ).pipe(
      tap(() => console.log('Tension decision saved')),
      catchError(err => {
        console.error('Error saving tension decision:', err);
        return throwError(() => new Error('Erreur lors de l\'enregistrement'));
      })
    );
  }

  escalateCase(caseId: string): Observable<any> {
    return this.http.post(
      `/api/v1/cases/${caseId}/escalate`,
      {}
    ).pipe(
      catchError(err => throwError(() => new Error('Erreur lors de l\'escalade')))
    );
  }
}
```

---

## CONTRAINTES ANGULAR

### Standalone Components
- Tous les composants Bloc 7 sont **standalone: true**

### Change Detection
- OnPush avec markForCheck()
- Observables + async pipe

### Performance
- Tension calculation frontend (< 1ms)
- No async operations for tension math
- Lazy load form validation

### Accessibility
- Color + icon for status (not color-only)
- Descriptive radio button labels
- Focus management for required fields

---

## BINDING API

### Endpoints

```typescript
// POST /api/v1/cases/{id}/tension/decision
// Input: TensionDecision
// Output: { updated: true }

// POST /api/v1/cases/{id}/escalate
// Input: {}
// Output: { escalated: true, assigned_to_manager: string }
```

---

## CRITÈRES DE VALIDATION

### Fonctionnels
- ✓ Tension calculée et affichée correctement
- ✓ Banner conditionnel (NONE/MILD/MODERATE/SEVERE)
- ✓ Comparaison côte-à-côte lisible
- ✓ Table piliers affiche tous les piliers
- ✓ Commentaire obligatoire si MODERATE/SEVERE
- ✓ Décision options (FOLLOW_MCC/INVESTIGATE/FOLLOW_IA)
- ✓ Escalade manager si SEVERE

### Techniques
- ✓ MCC-R1 respectée: MCC prime toujours
- ✓ MCC-R5 respectée: commentaire obligatoire si tension MODERATE/SEVERE
- ✓ Frontend calculation (pas d'API pour tension math)
- ✓ Form validation dynamique basée sur tension level
- ✓ Performance: render < 200ms

### UX
- ✓ Tension level clair visuellement
- ✓ Direction (UP/DOWN) bien expliquée
- ✓ Recommandations système logiques
- ✓ Form disable/enable logique selon tension
- ✓ Escalade facile si SEVERE

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/features/cases/components/
├── bloc7-tension/
│   ├── bloc7-tension.component.ts
│   ├── bloc7-tension.component.html
│   ├── bloc7-tension.component.scss
│   ├── tension-banner/
│   │   ├── tension-banner.component.ts
│   │   ├── tension-banner.component.html
│   │   └── tension-banner.component.scss
│   ├── tension-comparison/
│   │   ├── tension-comparison.component.ts
│   │   ├── tension-comparison.component.html
│   │   └── tension-comparison.component.scss
│   ├── pillar-tension-table/
│   │   ├── pillar-tension-table.component.ts
│   │   ├── pillar-tension-table.component.html
│   │   └── pillar-tension-table.component.scss
│   └── analyst-decision/
│       ├── analyst-decision.component.ts
│       ├── analyst-decision.component.html
│       └── analyst-decision.component.scss
src/app/shared/models/
└── tension.model.ts
```

**Routing:**
- Route `/cases/:caseId/tension`
- Guards: GateCheckGuard, StatusCheckGuard
- Dependency: requires both Bloc 5 & 6 completed
- Navigation from Bloc 6 → Bloc 7
- Navigation from Bloc 7 → Bloc 8 (Stress Test)

---

**STATUS À LA FIN :** Dossier reste `STRESS_DONE` (ou transitions to next status per backend)
**NEXT PROMPT :** P15 — Bloc 8 — Stress Test (Simulation, Chart, Results)
