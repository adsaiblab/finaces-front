═══════════════════════════════════════════════════════════
PROMPT 12 — BLOC 5 — Scoring MCC (Rail 1)
Dépend de : PROMPT 11 (Ratios calculés)
Peut être parallélisé avec : PROMPT 13 (Bloc 6 IA) — les deux lancés simultanément depuis P11
═══════════════════════════════════════════════════════════

## CONTEXTE

À ce stade, l'analyste MCC a validé les ratios financiers (Bloc 4). Le **Scoring MCC est la source décisionnelle unique** du dossier. Ce bloc affiche :
- **Gauge global** (0-5, rail=MCC, couleur verte)
- **5 piliers d'analyse** (Liquidité, Solvabilité, Rentabilité, Capacité, Qualité) avec breakdown détaillé
- **Override zone** (modification manuelle du score avec traçabilité)
- **Smart Recommendations** et **Cross-Analysis Alerts** générées par le système

Le scoring est **déclenché en parallèle avec la prédiction IA** (depuis Bloc 4). Une fois complétés, le dossier peut avancer vers l'analyse de tension MCC↔IA (Bloc 7).

---

## RÈGLES MÉTIER APPLICABLES

### MCC-R1 : Unicité de la décision MCC
**Le score MCC est SEUL DÉCISIF.** L'IA est consultatif. Aucune fusion/moyenne avec IA. Le score MCC prime dans tous les contextes.

### MCC-R2 : IA ne peut pas remplacer MCC
Si IA indisponible, le dossier continue avec score MCC seul. Pas de fallback sur IA.

### MCC-R4 : Hiérarchie visuelle MCC > IA
- Le gauge et badge MCC affichés en **position dominante** (top-left)
- Aucune suggestion visuelle que IA = alternative
- "Prédiction IA" toujours sous-titre "Référence MCC"

### MCC-R5 : Tension MODERATE/SEVERE
Si tension MCC↔IA = MODERATE ou SEVERE, **commentaire analyste obligatoire** avant fermeture dossier.

### MCC-R6 : Gate avant les financiers
Bloc 5 n'apparaît **que si Gate = SEALED** et status ≥ RATIOS_COMPUTED.

---

## RÈGLES DE SCORING DÉTAILLÉES

### Scoring Metrics par Pilier

Chaque pilier note sur **0-5**. Le backend calcule une note par pilier basée sur les ratios du Bloc 4 :

**LIQUIDITÉ** (Poids: 20%)
- Ratios clés: current_ratio, quick_ratio, cash_ratio, wcr_pct_revenue, cash_conversion_cycle
- Formule indicative: Moyenne pondérée des ratios normalisés, avec scoring par tranche
- Signal: Solvabilité court terme (< 12 mois)

**SOLVABILITÉ** (Poids: 25%)
- Ratios clés: debt_to_equity, financial_autonomy, gearing, negative_equity
- Formule indicative: Levier financier + structure capital
- Signal: Risque insolvabilité (> 3 ans)

**RENTABILITÉ** (Poids: 20%)
- Ratios clés: net_margin, ebitda_margin, roa, roe
- Formule indicative: Profitabilité et ROIC vs taux de référence
- Signal: Capacité d'autofinancement

**CAPACITÉ** (Poids: 15%)
- Ratios clés: cash_flow_capacity, cf_capacity_margin, operating_cash_flow, debt_repayment_years
- Formule indicative: Génération cash vs obligations
- Signal: Maîtrise de trésorerie en contrat

**QUALITÉ** (Poids: 20%)
- Ratios clés: Z-Score Altman, trend stability (CAGR), audit opinion, data quality
- Formule indicative: Stabilité + fiabilité données
- Signal: Confiance en l'analyse

### Score Global Calculation
```
Global = 0.20×Liquidité + 0.25×Solvabilité + 0.20×Rentabilité + 0.15×Capacité + 0.20×Qualité
```

### Risk Class from Global Score
```
[0.0 - 1.5[ → CRITIQUE (red)
[1.5 - 2.5[ → ÉLEVÉ (orange)
[2.5 - 3.5[ → MODÉRÉ (yellow)
[3.5 - 4.5[ → FAIBLE (light green)
[4.5 - 5.0] → TRÈS FAIBLE (green)
```

### Override Mechanism
- Max adjustment: ±1.0 point (enforced server-side)
- Requires: override_rationale (mandatory textarea)
- Audit trail: logged with analyst ID + timestamp
- Status: is_overridden = true triggers flag in reporting

---

## FICHIERS À CRÉER / MODIFIER

### À créer :
```
src/app/features/cases/components/
  bloc5-scoring-mcc/
    bloc5-scoring-mcc.component.ts
    bloc5-scoring-mcc.component.html
    bloc5-scoring-mcc.component.scss
    pillar-detail-card/
      pillar-detail-card.component.ts
      pillar-detail-card.component.html
      pillar-detail-card.component.scss
    override-zone/
      override-zone.component.ts
      override-zone.component.html
      override-zone.component.scss
    recommendations-section/
      recommendations-section.component.ts
      recommendations-section.component.html
      recommendations-section.component.scss
src/app/features/cases/services/
  scoring-mcc.service.ts
src/app/shared/models/
  scoring.model.ts (ScorecardOutputSchema, PillarDetailSchema, etc.)
src/app/shared/components/
  finaces-score-gauge/
    finaces-score-gauge.component.ts
    finaces-score-gauge.component.html
    finaces-score-gauge.component.scss
  finaces-risk-badge/
    finaces-risk-badge.component.ts
    finaces-risk-badge.component.html
    finaces-risk-badge.component.scss
```

### À modifier :
```
src/app/features/cases/pages/case-flow-page/case-flow-page.component.ts
  - Ajouter la route bloc5-scoring-mcc
  - Ajouter navigation après scoring complété
```

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. Route Angular

```typescript
{
  path: 'cases/:caseId/scoring',
  component: Bloc5ScoringMccComponent,
  data: {
    bloc: 'BLOC5_SCORING_MCC',
    requiredStatus: ['RATIOS_COMPUTED', 'SCORING_DONE', 'STRESS_DONE', ...],
    requiredGateStatus: 'SEALED'
  }
}
```

---

### 2. Data Models (scoring.model.ts)

```typescript
// Main scorecard output from backend
export interface ScorecardOutputSchema {
  case_id: string;
  analyst_id: string;
  calculation_date: string;

  // Scores (0-5 scale)
  system_calculated_score: number;  // Before any override
  global_score: number;              // After override (if applied)
  base_risk_class: string;           // Before override
  final_risk_class: string;          // After override (CRITIQUE|ÉLEVÉ|MODÉRÉ|FAIBLE|TRÈS_FAIBLE)

  // Override tracking
  is_overridden: boolean;
  override_rationale?: string;
  override_applied_at?: string;
  override_applied_by?: string;

  // Risk profile (new)
  risk_profile: 'EQUILIBRE' | 'ASYMETRIQUE' | 'AGRESSIF' | 'DEFENSIF' | 'CLASSIQUE';

  // 5 Pillar details
  pillars: PillarDetailSchema[];

  // Smart recommendations from backend
  smart_recommendations: Recommendation[];

  // Cross-pillar analysis alerts
  cross_analysis_alerts: CrossAnalysisAlert[];

  // Metadata
  policy_name: string;
  contract_value: number;
  contract_currency: string;
  bidder_name: string;
  sector_code: string;
}

export interface PillarDetailSchema {
  pillar_id: 'LIQUIDITE' | 'SOLVABILITE' | 'RENTABILITE' | 'CAPACITE' | 'QUALITE';
  pillar_name: string;
  pillar_icon: string;  // 'water_drop', 'shield', 'trending_up', 'bolt', 'star'
  pillar_weight: number;  // 0.15 - 0.25 (sum = 1.0)

  // Scoring
  score: number;  // 0-5
  score_range_min: number;
  score_range_max: number;
  contribution_to_global: number;  // weight × score

  // Detailed breakdown
  indicators: IndicatorDetail[];
  signals: Signal[];
  trend_analysis: TrendAnalysis;

  // Analyst comment (from phase 2 write_interpretation)
  analyst_comment?: string;

  // Status
  is_critical?: boolean;  // true if score < 1.5
}

export interface IndicatorDetail {
  name: string;           // e.g., "current_ratio"
  label: string;          // "Ratio de liquidité générale"
  value: number;          // Raw value
  unit: string;           // 'ratio', '%', 'jours', '€'
  score_contribution: number;  // 0-5 portion of pillar score
  weight_in_pillar: number;    // % within pillar
  benchmark_low: number;
  benchmark_mid: number;
  benchmark_high: number;
  status: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  explanation: string;    // "Above benchmark", "At risk", etc.
}

export interface Signal {
  signal_type: 'STRENGTH' | 'WARNING' | 'RISK';
  message: string;        // e.g., "Excellent liquidity position"
  severity_level: number; // 0-3 (0=info, 3=critical)
}

export interface TrendAnalysis {
  direction: 'UP' | 'DOWN' | 'STABLE';
  cagr: number;           // 4-year CAGR
  slope: number;          // Linear regression slope
  interpretation: string; // "Improving", "Deteriorating", etc.
}

export interface Recommendation {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'MONITORING' | 'ACTION' | 'INVESTIGATION';
  title: string;
  description: string;
  affected_pillar?: string;
  action_items?: string[];
}

export interface CrossAnalysisAlert {
  id: string;
  severity: 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  pillars_involved: string[];
  suggested_action: string;
}
```

---

### 3. API Endpoints

```typescript
// POST /api/v1/cases/{id}/score
// Input: {} (backend uses existing normalized data + ratios)
// Output: ScorecardOutputSchema

// POST /api/v1/cases/{id}/recommendation (UPDATE)
// Input: { recommendation_action: 'FOLLOW_MCC' | 'FOLLOW_IA' | 'INVESTIGATE' }
// Output: { updated_recommendation: ... }

// PATCH /api/v1/cases/{id}/score/override
// Input: { adjusted_score: number, rationale: string }
// Output: { is_overridden: true, global_score: number, ... }

scoringService.computeScore(caseId: string): Observable<ScorecardOutputSchema>
scoringService.applyOverride(caseId: string, adjustment: OverrideRequest): Observable<ScorecardOutputSchema>
```

---

### 4. Component Architecture: Bloc5ScoringMccComponent

```typescript
@Component({
  selector: 'app-bloc5-scoring-mcc',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    ReactiveFormsModule,
    PillarDetailCardComponent,
    OverrideZoneComponent,
    RecommendationsSectionComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
  ],
  templateUrl: './bloc5-scoring-mcc.component.html',
  styleUrls: ['./bloc5-scoring-mcc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Bloc5ScoringMccComponent implements OnInit, OnDestroy {
  caseId$ = this.route.paramMap.pipe(map(p => p.get('caseId')));
  scorecard$: Observable<ScorecardOutputSchema>;
  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  private destroy$ = new Subject<void>();

  constructor(
    private scoringService: ScoringMccService,
    private caseService: CaseService,
    private route: ActivatedRoute,
    private router: Router,
    private notif: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.scorecard$ = this.caseId$.pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(caseId => this.scoringService.computeScore(caseId)),
      tap(() => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      }),
      catchError(err => {
        this.error$.next(err.message || 'Erreur lors du calcul du score');
        this.isLoading$.next(false);
        return throwError(err);
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );
  }

  applyOverride(caseId: string, adjustment: number, rationale: string) {
    if (Math.abs(adjustment) > 1.0) {
      this.notif.open('L\'écart maximum autorisé est ±1.0 point', 'Fermer');
      return;
    }

    this.scoringService.applyOverride(caseId, {
      adjusted_score: adjustment,
      rationale: rationale
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      updated => {
        this.notif.open('Override appliqué avec succès', '', { duration: 3000 });
        // Refresh scorecard
        this.scorecard$ = of(updated);
        this.cdr.markForCheck();
      },
      err => this.notif.open(`Erreur: ${err.message}`, 'Fermer')
    );
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

### 5. Template: bloc5-scoring-mcc.component.html

```html
<div class="bloc5-container">

  <!-- Header -->
  <div class="bloc-header">
    <div class="header-info">
      <h2 class="bloc-title">
        <mat-icon>assessment</mat-icon>
        SCORING MCC — Rail 1 (DÉCISIONNEL)
      </h2>
      <p class="bloc-subtitle">
        Notation officielle sur 5 points basée sur 5 piliers. Source décisionnelle unique.
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

  <!-- Main scoring card with gauge -->
  <mat-card class="score-global-card"
            *ngIf="(scorecard$ | async) as scorecard"
            [ngClass]="scorecard.is_overridden ? 'overridden' : ''">

    <mat-card-header class="score-header">
      <h3>Score Global MCC</h3>
      <mat-badge *ngIf="scorecard.is_overridden"
                  content="OVERRIDE"
                  matBadgeColor="warn"></mat-badge>
    </mat-card-header>

    <mat-card-content class="score-content">
      <div class="score-left">
        <!-- Gauge component -->
        <app-finaces-score-gauge
          [score]="scorecard.global_score"
          [rail]="'MCC'"
          [size]="160">
        </app-finaces-score-gauge>
      </div>

      <div class="score-center-divider"></div>

      <div class="score-right">
        <div class="score-value">
          <span class="score-number">{{ scorecard.global_score | number:'1.1-1' }}</span>
          <span class="score-max">/ 5.0</span>
        </div>

        <app-finaces-risk-badge
          [riskClass]="scorecard.final_risk_class"
          [rail]="'MCC'">
        </app-finaces-risk-badge>

        <p class="score-designation">
          ⭐ <strong>Score Officiel MCC</strong>
        </p>

        <p class="score-metadata">
          Calculé le {{ scorecard.calculation_date | date:'dd MMM yyyy HH:mm' }}
          <br>
          Analyste: {{ scorecard.analyst_id }}
        </p>

        <div class="override-badge" *ngIf="scorecard.is_overridden">
          <mat-icon color="warn">info</mat-icon>
          <span>Override appliqué: {{ scorecard.override_rationale }}</span>
        </div>
      </div>
    </mat-card-content>
  </mat-card>

  <!-- 5 Pillar Accordion -->
  <div class="pillars-section" *ngIf="(scorecard$ | async) as scorecard">
    <h3 class="section-title">Détail par Pilier</h3>

    <mat-accordion multi>
      <mat-expansion-panel *ngFor="let pillar of scorecard.pillars"
                           [class]="'pillar-' + pillar.pillar_id | lowercase"
                           [expanded]="pillar.is_critical">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon [ngClass]="'pillar-icon-' + pillar.pillar_id | lowercase">
              {{ pillar.pillar_icon }}
            </mat-icon>
            {{ pillar.pillar_name }}
          </mat-panel-title>
          <mat-panel-description>
            <span class="pillar-score">{{ pillar.score | number:'1.1-1' }}/5</span>
            <span class="pillar-weight">(Poids: {{ pillar.pillar_weight * 100 | number:'0' }}%)</span>
            <span class="pillar-contribution">
              Contribution: {{ pillar.contribution_to_global | number:'1.2-2' }}
            </span>
          </mat-panel-description>
        </mat-expansion-panel-header>

        <!-- Pillar detail card -->
        <app-pillar-detail-card
          [pillar]="pillar">
        </app-pillar-detail-card>

      </mat-expansion-panel>
    </mat-accordion>
  </div>

  <!-- Override Zone (Expansion Panel) -->
  <app-override-zone
    *ngIf="(scorecard$ | async) as scorecard"
    [caseId]="(caseId$ | async)"
    [currentScore]="scorecard.system_calculated_score"
    [isOverridden]="scorecard.is_overridden"
    [overrideRationale]="scorecard.override_rationale"
    (onOverrideApplied)="applyOverride($event.caseId, $event.adjustment, $event.rationale)">
  </app-override-zone>

  <!-- Smart Recommendations -->
  <app-recommendations-section
    *ngIf="(scorecard$ | async) as scorecard"
    [recommendations]="scorecard.smart_recommendations"
    [title]="'Recommandations Intelligentes'">
  </app-recommendations-section>

  <!-- Cross-Analysis Alerts -->
  <mat-card *ngIf="(scorecard$ | async) as scorecard"
            class="cross-analysis-card"
            [ngClass]="scorecard.cross_analysis_alerts.length > 0 ? 'has-alerts' : ''">
    <mat-card-header>
      <h3>Alertes d'Analyse Transversale</h3>
    </mat-card-header>
    <mat-card-content>
      <div *ngIf="scorecard.cross_analysis_alerts.length === 0" class="no-alerts">
        ✓ Aucune alerte transversale détectée.
      </div>
      <mat-accordion *ngIf="scorecard.cross_analysis_alerts.length > 0">
        <mat-expansion-panel *ngFor="let alert of scorecard.cross_analysis_alerts"
                             [ngClass]="'severity-' + alert.severity | lowercase">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon [color]="alert.severity === 'CRITICAL' ? 'warn' : 'accent'">
                {{ alert.severity === 'CRITICAL' ? 'priority_high' : 'warning_amber' }}
              </mat-icon>
              {{ alert.title }}
            </mat-panel-title>
          </mat-expansion-panel-header>
          <div class="alert-content">
            <p>{{ alert.description }}</p>
            <p><strong>Piliers impliqués:</strong> {{ alert.pillars_involved.join(', ') }}</p>
            <p><strong>Action recommandée:</strong> {{ alert.suggested_action }}</p>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </mat-card-content>
  </mat-card>

  <!-- Action Footer -->
  <div class="action-footer">
    <div class="button-group">
      <button mat-stroked-button color="accent"
              (click)="router.navigate(['/cases/' + (caseId$ | async) + '/ratios'])">
        ← Retour Ratios
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

### 6. Sub-component: PillarDetailCardComponent

```typescript
@Component({
  selector: 'app-pillar-detail-card',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatCardModule, MatTooltipModule],
  template: `
    <div class="pillar-detail-content">

      <!-- Indicators Table -->
      <h4 class="subsection-title">Indicateurs</h4>
      <table mat-table [dataSource]="pillar.indicators" class="indicators-table">

        <ng-container matColumnDef="name">
          <th mat-header-cell>Indicateur</th>
          <td mat-cell>{{ element.label }}</td>
        </ng-container>

        <ng-container matColumnDef="value">
          <th mat-header-cell>Valeur</th>
          <td mat-cell>{{ formatValue(element) }}</td>
        </ng-container>

        <ng-container matColumnDef="score">
          <th mat-header-cell>Contribution</th>
          <td mat-cell>{{ element.score_contribution | number:'1.1-1' }}/5</td>
        </ng-container>

        <ng-container matColumnDef="weight">
          <th mat-header-cell>Poids</th>
          <td mat-cell>{{ element.weight_in_pillar * 100 | number:'0' }}%</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell>Status</th>
          <td mat-cell>
            <mat-icon [class]="'status-' + element.status | lowercase">
              {{ statusIcon(element.status) }}
            </mat-icon>
          </td>
        </ng-container>

        <tr mat-header-row></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

      </table>

      <!-- Signals -->
      <h4 class="subsection-title">Signaux</h4>
      <div class="signals-list">
        <div *ngFor="let signal of pillar.signals"
             class="signal"
             [ngClass]="'signal-' + signal.signal_type | lowercase">
          <mat-icon>{{ signalIcon(signal.signal_type) }}</mat-icon>
          <p>{{ signal.message }}</p>
        </div>
      </div>

      <!-- Trend Analysis -->
      <h4 class="subsection-title">Tendance (4 ans)</h4>
      <div class="trend-analysis">
        <p>
          <strong>Direction:</strong>
          <mat-icon [class]="'trend-' + pillar.trend_analysis.direction | lowercase">
            {{ trendIcon(pillar.trend_analysis.direction) }}
          </mat-icon>
          {{ pillar.trend_analysis.direction }}
        </p>
        <p><strong>CAGR:</strong> {{ pillar.trend_analysis.cagr | number:'1.2-2' }}%</p>
        <p><strong>Pente:</strong> {{ pillar.trend_analysis.slope | number:'1.4-4' }}</p>
        <p><strong>Interprétation:</strong> {{ pillar.trend_analysis.interpretation }}</p>
      </div>

      <!-- Analyst Comment -->
      <h4 class="subsection-title">Commentaire Analyste</h4>
      <mat-form-field class="full-width">
        <textarea matInput
                  [value]="pillar.analyst_comment"
                  readonly
                  rows="3"></textarea>
      </mat-form-field>

    </div>
  `,
  styles: [`
    .pillar-detail-content {
      padding: 16px 0;

      .subsection-title {
        margin-top: 16px;
        margin-bottom: 8px;
        color: var(--mcc-moderate);
      }

      .indicators-table {
        width: 100%;
        th, td { padding: 8px; }
      }

      .signals-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .signal {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 4px;

          &.signal-strength {
            background: rgba(76, 175, 80, 0.1);
            color: #4caf50;
          }
          &.signal-warning {
            background: rgba(255, 193, 7, 0.1);
            color: #ffc107;
          }
          &.signal-risk {
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
          }
        }
      }

      .trend-analysis {
        background: var(--mcc-surface-light);
        padding: 12px;
        border-radius: 4px;
        p { margin: 4px 0; }
      }

      .status-green { color: #4caf50; }
      .status-yellow { color: #ffc107; }
      .status-orange { color: #ff9800; }
      .status-red { color: #f44336; }

      .trend-up { color: #4caf50; }
      .trend-down { color: #f44336; }
      .trend-stable { color: #2196f3; }
    }
  `]
})
export class PillarDetailCardComponent {
  @Input() pillar: PillarDetailSchema;

  displayedColumns = ['name', 'value', 'score', 'weight', 'status'];

  formatValue(indicator: IndicatorDetail): string {
    if (indicator.unit === '%') return indicator.value.toFixed(1) + '%';
    if (indicator.unit === 'jours') return indicator.value.toFixed(0) + ' j';
    if (indicator.unit === '€') return '€' + (indicator.value / 1000000).toFixed(1) + 'M';
    return indicator.value.toFixed(2);
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = {
      'GREEN': 'check_circle',
      'YELLOW': 'info',
      'ORANGE': 'warning',
      'RED': 'error'
    };
    return icons[status] || 'help';
  }

  signalIcon(type: string): string {
    return type === 'STRENGTH' ? 'trending_up' : type === 'RISK' ? 'error' : 'warning';
  }

  trendIcon(direction: string): string {
    return direction === 'UP' ? 'trending_up' : direction === 'DOWN' ? 'trending_down' : 'trending_flat';
  }
}
```

---

### 7. Sub-component: OverrideZoneComponent

```typescript
@Component({
  selector: 'app-override-zone',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatAlertModule
  ],
  template: `
    <mat-expansion-panel class="override-panel">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon color="warn">edit</mat-icon>
          Override du Score (Réservé Fiduciaire Senior)
        </mat-panel-title>
      </mat-expansion-panel-header>

      <div class="override-content">

        <!-- Warning -->
        <mat-alert type="warning">
          ⚠️ Un override modifie le score officiel et génère une trace d'audit.
          Justification obligatoire. Écart max: ±1.0 point.
        </mat-alert>

        <!-- Toggle to enable override -->
        <div class="form-group">
          <mat-slide-toggle
            [(ngModel)]="overrideEnabled"
            (change)="onToggleOverride()">
            Appliquer un override
          </mat-slide-toggle>
        </div>

        <form [formGroup]="overrideForm" *ngIf="overrideEnabled" class="override-form">

          <!-- Current score display -->
          <mat-form-field class="full-width" disabled>
            <mat-label>Score calculé (avant override)</mat-label>
            <input matInput [value]="currentScore | number:'1.1-1'" disabled>
          </mat-form-field>

          <!-- New score -->
          <mat-form-field class="full-width">
            <mat-label>Nouveau score</mat-label>
            <input matInput
                   formControlName="adjustedScore"
                   type="number"
                   min="0"
                   max="5"
                   step="0.1"
                   (input)="validateScore()">
            <mat-error *ngIf="scoreError">{{ scoreError }}</mat-error>
          </mat-form-field>

          <!-- Delta display -->
          <div class="delta-display" *ngIf="overrideForm.get('adjustedScore').value">
            Écart: {{ (overrideForm.get('adjustedScore').value - currentScore) | number:'±1.1-1' }} point
            <mat-icon *ngIf="Math.abs(overrideForm.get('adjustedScore').value - currentScore) > 1.0"
                      color="warn">warning</mat-icon>
          </div>

          <!-- Rationale -->
          <mat-form-field class="full-width">
            <mat-label>Justification (obligatoire)</mat-label>
            <textarea matInput
                      formControlName="rationale"
                      rows="4"
                      placeholder="Expliquez pourquoi cet ajustement est justifié..."></textarea>
            <mat-hint>Min. 50 caractères</mat-hint>
            <mat-error *ngIf="overrideForm.get('rationale').hasError('required')">
              Justification obligatoire
            </mat-error>
            <mat-error *ngIf="overrideForm.get('rationale').hasError('minlength')">
              Min. 50 caractères
            </mat-error>
          </mat-form-field>

          <!-- Action buttons -->
          <div class="button-group">
            <button mat-button (click)="onCancel()">Annuler</button>
            <button mat-raised-button color="warn"
                    (click)="onApply()"
                    [disabled]="overrideForm.invalid || scoreError">
              <mat-icon>check</mat-icon>
              Appliquer Override
            </button>
          </div>
        </form>

      </div>
    </mat-expansion-panel>
  `,
  styles: [`
    .override-panel {
      border-left: 4px solid var(--warn, #f44336);
    }

    .override-content {
      padding: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .override-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .delta-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
  `]
})
export class OverrideZoneComponent implements OnInit {
  @Input() caseId: string;
  @Input() currentScore: number;
  @Input() isOverridden: boolean;
  @Input() overrideRationale: string;
  @Output() onOverrideApplied = new EventEmitter<{
    caseId: string;
    adjustment: number;
    rationale: string;
  }>();

  overrideForm: FormGroup;
  overrideEnabled = false;
  scoreError: string | null = null;
  Math = Math;

  constructor(private fb: FormBuilder) {
    this.overrideForm = this.fb.group({
      adjustedScore: ['', [Validators.required, Validators.min(0), Validators.max(5)]],
      rationale: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  ngOnInit() {
    if (this.isOverridden) {
      this.overrideEnabled = true;
      this.overrideForm.patchValue({
        adjustedScore: this.currentScore,
        rationale: this.overrideRationale || ''
      });
    }
  }

  validateScore() {
    const newScore = this.overrideForm.get('adjustedScore').value;
    const delta = Math.abs(newScore - this.currentScore);

    if (delta > 1.0) {
      this.scoreError = `Écart max ±1.0 (actuellement: ${delta.toFixed(1)})`;
    } else {
      this.scoreError = null;
    }
  }

  onToggleOverride() {
    if (!this.overrideEnabled) {
      this.overrideForm.reset();
    }
  }

  onCancel() {
    this.overrideEnabled = false;
    this.overrideForm.reset();
  }

  onApply() {
    if (this.overrideForm.valid && !this.scoreError) {
      const newScore = this.overrideForm.get('adjustedScore').value;
      const rationale = this.overrideForm.get('rationale').value;

      this.onOverrideApplied.emit({
        caseId: this.caseId,
        adjustment: newScore - this.currentScore,
        rationale: rationale
      });
    }
  }
}
```

---

### 8. Sub-component: RecommendationsSectionComponent

```typescript
@Component({
  selector: 'app-recommendations-section',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatListModule],
  template: `
    <mat-card class="recommendations-card">
      <mat-card-header>
        <h3>{{ title }}</h3>
        <p class="subtitle">Actions suggérées basées sur l'analyse MCC</p>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="recommendations.length === 0" class="no-recommendations">
          ✓ Aucune recommandation critique.
        </div>
        <div *ngIf="recommendations.length > 0" class="recommendations-list">
          <div *ngFor="let rec of recommendations"
               class="recommendation-item"
               [ngClass]="'priority-' + rec.priority | lowercase">
            <div class="rec-header">
              <mat-icon [color]="priorityColor(rec.priority)">
                {{ priorityIcon(rec.priority) }}
              </mat-icon>
              <h4>{{ rec.title }}</h4>
              <span class="category-badge">{{ rec.category }}</span>
            </div>
            <p class="rec-description">{{ rec.description }}</p>
            <div *ngIf="rec.action_items" class="action-items">
              <strong>Actions:</strong>
              <ul>
                <li *ngFor="let item of rec.action_items">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .recommendations-card {
      margin-top: 24px;

      mat-card-header {
        h3 { margin-bottom: 4px; }
        .subtitle { color: var(--text-secondary); font-size: 0.9em; margin: 0; }
      }
    }

    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .recommendation-item {
      padding: 12px;
      border-left: 3px solid;
      border-radius: 2px;

      &.priority-high {
        border-left-color: #f44336;
        background: rgba(244, 67, 54, 0.05);
      }
      &.priority-medium {
        border-left-color: #ff9800;
        background: rgba(255, 152, 0, 0.05);
      }
      &.priority-low {
        border-left-color: #2196f3;
        background: rgba(33, 150, 243, 0.05);
      }

      .rec-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        h4 { margin: 0; flex: 1; }

        .category-badge {
          background: var(--mcc-moderate);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75em;
          font-weight: 500;
        }
      }

      .rec-description {
        margin: 0 0 8px 0;
        line-height: 1.5;
      }

      .action-items {
        margin-top: 8px;

        ul {
          margin: 4px 0 0 20px;
          padding: 0;
          li { margin: 4px 0; }
        }
      }
    }

    .no-recommendations {
      text-align: center;
      padding: 24px;
      color: var(--text-secondary);
    }
  `]
})
export class RecommendationsSectionComponent {
  @Input() recommendations: Recommendation[];
  @Input() title = 'Recommandations';

  priorityIcon(priority: string): string {
    return priority === 'HIGH' ? 'error' : priority === 'MEDIUM' ? 'warning' : 'info';
  }

  priorityColor(priority: string): string {
    return priority === 'HIGH' ? 'warn' : priority === 'MEDIUM' ? 'accent' : 'primary';
  }
}
```

---

### 9. Shared Components

#### FinacesScoreGaugeComponent (reusable for both MCC & IA)

```typescript
@Component({
  selector: 'app-finaces-score-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg [attr.viewBox]="'0 0 200 200'"
         [attr.width]="size"
         [attr.height]="size"
         class="gauge"
         [class]="'rail-' + rail">

      <!-- Background circle -->
      <circle cx="100" cy="100" r="95" fill="none" stroke="var(--bg-light)" stroke-width="20"></circle>

      <!-- Colored arc (0 → score/5 * 360°) -->
      <circle cx="100" cy="100" r="95"
              fill="none"
              [attr.stroke]="gaugeColor"
              stroke-width="20"
              stroke-dasharray="[arcLength, 300]"
              stroke-dashoffset="0"
              stroke-linecap="round"
              transform="rotate(-90 100 100)"></circle>

      <!-- Center text -->
      <text x="100" y="95" text-anchor="middle" font-size="32" font-weight="bold">
        {{ score | number:'1.1-1' }}
      </text>
      <text x="100" y="115" text-anchor="middle" font-size="14" fill="var(--text-secondary)">
        / 5.0
      </text>

    </svg>
  `,
  styles: [`
    .gauge {
      &.rail-mcc {
        filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3));
      }
      &.rail-ia {
        filter: drop-shadow(0 2px 4px rgba(103, 58, 183, 0.3));
      }
    }
  `]
})
export class FinacesScoreGaugeComponent {
  @Input() score: number;  // 0-5
  @Input() rail: 'MCC' | 'IA' = 'MCC';
  @Input() size: number = 160;

  get arcLength(): number {
    return (this.score / 5) * 300;  // 300 = circumference
  }

  get gaugeColor(): string {
    if (this.rail === 'MCC') {
      if (this.score <= 1.5) return '#f44336';       // red
      if (this.score <= 2.5) return '#ff9800';       // orange
      if (this.score <= 3.5) return '#ffc107';       // yellow
      if (this.score <= 4.5) return '#8bc34a';       // light green
      return '#4caf50';                              // green
    } else {
      // IA colors: blue → violet
      if (this.score <= 1.5) return '#1a237e';       // dark blue
      if (this.score <= 2.5) return '#283593';       // blue
      if (this.score <= 3.5) return '#512da8';       // indigo
      if (this.score <= 4.5) return '#7b1fa2';       // purple
      return '#c2185b';                              // violet
    }
  }
}
```

#### FinacesRiskBadgeComponent

```typescript
@Component({
  selector: 'app-finaces-risk-badge',
  standalone: true,
  imports: [CommonModule, MatBadgeModule, MatIconModule],
  template: `
    <div class="risk-badge" [class]="'risk-' + riskClass | lowercase">
      <mat-icon>{{ riskIcon }}</mat-icon>
      <span>{{ riskClass }}</span>
    </div>
  `,
  styles: [`
    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 16px;
      font-weight: 600;
      font-size: 0.9em;

      &.risk-critique {
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        mat-icon { color: #f44336; }
      }
      &.risk-élevé {
        background: rgba(255, 152, 0, 0.2);
        color: #ff9800;
        mat-icon { color: #ff9800; }
      }
      &.risk-modéré {
        background: rgba(255, 193, 7, 0.2);
        color: #ffc107;
        mat-icon { color: #ffc107; }
      }
      &.risk-faible {
        background: rgba(139, 195, 74, 0.2);
        color: #8bc34a;
        mat-icon { color: #8bc34a; }
      }
      &.risk-très_faible {
        background: rgba(76, 175, 80, 0.2);
        color: #4caf50;
        mat-icon { color: #4caf50; }
      }
    }
  `]
})
export class FinacesRiskBadgeComponent {
  @Input() riskClass: string;  // CRITIQUE, ÉLEVÉ, MODÉRÉ, FAIBLE, TRÈS_FAIBLE
  @Input() rail: 'MCC' | 'IA' = 'MCC';

  get riskIcon(): string {
    const icons: Record<string, string> = {
      'CRITIQUE': 'priority_high',
      'ÉLEVÉ': 'warning_amber',
      'MODÉRÉ': 'info',
      'FAIBLE': 'check_circle',
      'TRÈS_FAIBLE': 'verified'
    };
    return icons[this.riskClass] || 'help';
  }
}
```

---

### 10. Service: ScoringMccService

```typescript
@Injectable({ providedIn: 'root' })
export class ScoringMccService {

  constructor(private http: HttpClient) {}

  computeScore(caseId: string): Observable<ScorecardOutputSchema> {
    return this.http.post<ScorecardOutputSchema>(
      `/api/v1/cases/${caseId}/score`,
      {}
    ).pipe(
      tap(result => console.log('Score computed:', result)),
      catchError(err => {
        console.error('Score calculation error:', err);
        return throwError(() => new Error('Impossible de calculer le score MCC'));
      })
    );
  }

  applyOverride(caseId: string, request: OverrideRequest): Observable<ScorecardOutputSchema> {
    return this.http.patch<ScorecardOutputSchema>(
      `/api/v1/cases/${caseId}/score/override`,
      request
    ).pipe(
      tap(result => console.log('Override applied:', result)),
      catchError(err => {
        console.error('Override error:', err);
        return throwError(() => new Error('Impossible d\'appliquer l\'override'));
      })
    );
  }
}

export interface OverrideRequest {
  adjusted_score: number;
  rationale: string;
}
```

---

## CONTRAINTES ANGULAR

### Standalone Components
- Tous les composants Bloc 5 sont **standalone: true**
- Explicit imports

### Change Detection
- OnPush where possible
- Observables + async pipe
- markForCheck() après override application

### Performance
- Scorecard computation côté backend (>2s autorisé pour calcul complexe)
- Tables: max 50 lignes, virtualScroll si nécessaire
- Gauge SVG: optimisé (canvas fallback si perf issue)

### Accessibility
- Color not only visual indicator (status icons)
- Labels for all form fields
- Aria-labels for complex gauge

---

## BINDING API

### Endpoints

```typescript
// 1. Compute score (POST)
POST /api/v1/cases/{id}/score
Input: {}
Output: ScorecardOutputSchema

// 2. Apply override (PATCH)
PATCH /api/v1/cases/{id}/score/override
Input: { adjusted_score: number, rationale: string }
Output: ScorecardOutputSchema (is_overridden=true)
```

### Error handling
- 400: Données incomplètes → afficher message
- 409: Case not in right status → message + redirect
- 500: Backend error → retry option + support

---

## CRITÈRES DE VALIDATION

### Fonctionnels
- ✓ Gauge MCC affiche score 0-5 avec couleurs correctes
- ✓ 5 piliers affichés en accordion avec détails complets
- ✓ Chaque pilier montre indicateurs, signaux, tendance
- ✓ Override possible (max ±1.0) avec justification obligatoire
- ✓ Audit trail tracé (is_overridden, timestamp, analyst ID)
- ✓ Smart recommendations affichées par priorité
- ✓ Cross-analysis alerts affichées si présentes
- ✓ Navigation vers Tension MCC↔IA fonctionnelle

### Techniques
- ✓ MCC-R1 respectée: score MCC est seul décisif
- ✓ MCC-R4 respectée: MCC hiérarchie visuelle > IA
- ✓ MCC-R6 respectée: bloc visible seulement si Gate SEALED
- ✓ Performance: gauge render < 100ms, accordions expand < 200ms
- ✓ Responsive: grid adapté (mobile/tablet/desktop)

### UX
- ✓ Score global visible immédiatement
- ✓ Override disabled par défaut, activation explicite
- ✓ Erreurs claires, lien vers documentation
- ✓ Icônes cohérentes (Material Design)
- ✓ Animations smooth (expansion panels)

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/features/cases/components/
├── bloc5-scoring-mcc/
│   ├── bloc5-scoring-mcc.component.ts
│   ├── bloc5-scoring-mcc.component.html
│   ├── bloc5-scoring-mcc.component.scss
│   ├── pillar-detail-card/
│   │   ├── pillar-detail-card.component.ts
│   │   ├── pillar-detail-card.component.html
│   │   └── pillar-detail-card.component.scss
│   ├── override-zone/
│   │   ├── override-zone.component.ts
│   │   ├── override-zone.component.html
│   │   └── override-zone.component.scss
│   └── recommendations-section/
│       ├── recommendations-section.component.ts
│       ├── recommendations-section.component.html
│       └── recommendations-section.component.scss
src/app/features/cases/services/
└── scoring-mcc.service.ts
src/app/shared/models/
└── scoring.model.ts
src/app/shared/components/
├── finaces-score-gauge/
│   ├── finaces-score-gauge.component.ts
│   └── finaces-score-gauge.component.html
└── finaces-risk-badge/
    ├── finaces-risk-badge.component.ts
    └── finaces-risk-badge.component.html
```

**Routing updates:**
- Route `/cases/:caseId/scoring`
- Guards: GateCheckGuard, StatusCheckGuard
- Navigation from Bloc 4 (Ratios) → Bloc 5 (Scoring)
- Navigation from Bloc 5 → Bloc 7 (Tension) après validation

---

**STATUS À LA FIN :** Dossier passe de `RATIOS_COMPUTED` → `SCORING_DONE`
**NEXT PROMPT :** P13 — Bloc 6 — Prédiction IA (Disclaimer, SHAP, What-If)
