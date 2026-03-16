═══════════════════════════════════════════════════════════
PROMPT 11 — BLOC 4 — Ratios Financiers
Dépend de : PROMPT 10 (Normalisation IFRS complète)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

À ce stade du flux dossier, l'analyste MCC a :
- Créé le dossier et rempli la Gate documentaire
- Saisi les états financiers bruts (4 ans de données minimum)
- Validé la normalisation IFRS (lecture seule, affichée en Bloc 3)

**PROMPT 11** calcule et affiche les **25+ ratios financiers** groupés en 5 catégories métier, enrichis d'alertes de cohérence et du Z-Score Altman. Ce bloc est le point de basculement : dès que les ratios sont calculés ET validés par l'analyste, le scoring MCC et la prédiction IA peuvent démarrer en parallèle.

---

## RÈGLES MÉTIER APPLICABLES

### MCC-R1 : Unicité de la décision MCC
Les ratios sont **lus seuls des données normalisées**. Aucune interprétation qualitative ne figure ici — c'est du pur calcul.

### MCC-R6 : Gate avant les financiers
PROMPT 11 ne s'affiche **que si status = FINANCIAL_INPUT ou plus avancé** ET **Gate = SCELLÉE**.

### MCC-R7 : Ratios sur données normalisées uniquement
Chaque ratio est calculé depuis `normalized_financial_data`, **jamais depuis les données brutes**. Les seuils de cohérence utilisent des benchmarks sectoriels (via `sector_code`).

### Règles de cohérence métier
1. **current_ratio > quick_ratio > cash_ratio** (ordre naturel) → alerte si violation
2. **dso_days + dio_days - dpo_days = wcr_days** (formule BFR) → alerte si écart > 5%
3. **net_margin ≤ ebitda_margin** (EBITDA > Résultat net) → alerte si violation
4. **debt_to_equity vs gearing** (relations) → alerte si logique brisée
5. **Z-Score < 1.81** = zone DISTRESS → alerte automatique avec recommandation "revue senior"

---

## FICHIERS À CRÉER / MODIFIER

### À créer :
```
src/app/features/cases/components/
  bloc4-ratios/
    bloc4-ratios.component.ts
    bloc4-ratios.component.html
    bloc4-ratios.component.scss
    ratio-group-card/
      ratio-group-card.component.ts
      ratio-group-card.component.html
      ratio-group-card.component.scss
    coherence-alerts/
      coherence-alerts.component.ts
      coherence-alerts.component.html
      coherence-alerts.component.scss
src/app/features/cases/services/
  ratio-calculation.service.ts
src/app/shared/models/
  ratio.model.ts (RatioSetSchema, RatioValue, CohereceAlert)
src/app/shared/icons/
  ratio-icons.ts (Liquidity, Solvency, Profitability, Capacity, ZScore icons)
```

### À modifier :
```
src/app/features/cases/pages/case-flow-page/case-flow-page.component.ts
  - Ajouter la route bloc4-ratios
  - Ajouter les boutons [Lancer Scoring MCC] et [Lancer Prédiction IA]
```

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. Route Angular

```typescript
// routing
{
  path: 'cases/:caseId/ratios',
  component: Bloc4RatiosComponent,
  data: {
    bloc: 'BLOC4_RATIOS',
    requiredStatus: ['FINANCIAL_INPUT', 'NORMALIZATION_DONE', 'RATIOS_COMPUTED', ...],
    requiredGateStatus: 'SEALED'
  }
}
```

---

### 2. Data Models (ratio.model.ts)

```typescript
// Types for each ratio group
export interface RatioSetSchema {
  case_id: string;
  fiscal_year: number;

  // LIQUIDITÉ (6 ratios + 4 working capital metrics)
  liquidite: LiquiditeGroup;

  // SOLVABILITÉ (6 ratios)
  solvabilite: SolvabiliteGroup;

  // RENTABILITÉ (5 ratios)
  rentabilite: RentabiliteGroup;

  // CAPACITÉ (3 ratios)
  capacite: CapaciteGroup;

  // Z-SCORE ALTMAN (2 values)
  z_score: ZScoreGroup;

  // Coherence validation
  coherence_alerts: CoherenceAlert[];
  coherence_status: 'CLEAN' | 'WARNINGS' | 'CRITICAL';

  // Metadata
  calculation_date: string;
  normalization_source: 'normalized_financial_data';
  sector_code: string;
}

// LIQUIDITÉ GROUP
export interface LiquiditeGroup {
  current_ratio: RatioValue;           // (CA + Stocks + Créances) / Dettes CT
  quick_ratio: RatioValue;             // (CA + Créances) / Dettes CT
  cash_ratio: RatioValue;              // (CA + TCN) / Dettes CT
  working_capital: RatioValue;         // Actif courant - Passif courant (€)
  wcr: RatioValue;                     // BFR en €
  wcr_pct_revenue: RatioValue;         // BFR / CA (%)
  dso_days: RatioValue;                // Délai moyen encaissement (jours)
  dpo_days: RatioValue;                // Délai moyen règlement (jours)
  dio_days: RatioValue;                // Délai rotation stocks (jours)
  cash_conversion_cycle: RatioValue;   // dso + dio - dpo (jours)
}

// SOLVABILITÉ GROUP
export interface SolvabiliteGroup {
  debt_to_equity: RatioValue;          // Dettes Financières / Capitaux propres
  financial_autonomy: RatioValue;      // Capitaux propres / Actif total (%)
  gearing: RatioValue;                 // Dettes Financières / (CP + DF)
  interest_coverage: RatioValue;       // EBIT / Intérêts
  debt_repayment_years: RatioValue;    // Dettes Fin. / CAF (années)
  negative_equity: RatioValue;         // 1 si CP<0 (alerte binaire)
}

// RENTABILITÉ GROUP
export interface RentabiliteGroup {
  net_margin: RatioValue;              // Résultat Net / CA (%)
  ebitda_margin: RatioValue;           // EBITDA / CA (%)
  operating_margin: RatioValue;        // Résultat d'Exploitation / CA (%)
  roa: RatioValue;                     // Résultat Net / Actif total (%)
  roe: RatioValue;                     // Résultat Net / CP (%)
}

// CAPACITÉ GROUP
export interface CapaciteGroup {
  cash_flow_capacity: RatioValue;      // CAF / Dettes Financières (ratio)
  cf_capacity_margin: RatioValue;      // CAF / CA (%)
  operating_cash_flow: RatioValue;     // From normalized: cash from operations (€)
}

// Z-SCORE ALTMAN (Modèle EM 4 variables)
export interface ZScoreGroup {
  z_score_altman: RatioValue;          // Valeur z-score (0-10 scale normalized)
  z_score_zone: 'SAFE' | 'GREY' | 'DISTRESS';  // Classification (z > 2.99 = SAFE, 1.81-2.99 = GREY, < 1.81 = DISTRESS)
  formula_breakdown: {
    x1: number;  // WC / TA (working capital / total assets)
    x2: number;  // RE / TA (retained earnings / total assets)
    x3: number;  // EBIT / TA (operating income / total assets)
    x4: number;  // BV_Equity / TL (book value equity / total liabilities)
  };
}

// Single Ratio Value + metadata
export interface RatioValue {
  current: number;                     // Dernière année
  trend: number[];                     // Historique 4 ans (si dispo)
  benchmark_min: number;               // Seuil bas healthy (secteur)
  benchmark_max: number;               // Seuil haut healthy (secteur)
  status: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';  // vs benchmarks
  unit: 'ratio' | '%' | 'jours' | '€' | 'binaire';
  variation_pct: number;               // vs année précédente
  analyst_note?: string;               // (optional) override human comment
}

// Coherence Alerts
export interface CoherenceAlert {
  id: string;
  severity: 'WARNING' | 'CRITICAL';
  rule_id: 'LIQUIDITY_ORDER' | 'BFR_FORMULA' | 'MARGIN_ORDER' |
           'SOLVENCY_LOGIC' | 'ZSCORE_DISTRESS' | 'CUSTOM';
  message: string;                     // User-friendly description
  rule_description: string;            // Technical explanation
  affected_ratios: string[];           // ['current_ratio', 'quick_ratio', ...]
  suggested_action: string;            // e.g., "Vérifier stock de fin de période"
  data_challenge?: boolean;            // true = may be data input error
}
```

---

### 3. API Endpoint

```typescript
// POST /api/v1/cases/{id}/ratios/compute
// Input: case_id + fiscal_year (or compute all 4 years)
// Backend returns: RatioSetSchema

// Service call:
ratioService.computeRatios(caseId: string, fiscalYear?: number): Observable<RatioSetSchema>
```

**Backend calculation (summary):**
- Fetch `normalized_financial_data` for the case
- For each fiscal year available:
  - Calculate all 25 ratios from normalized balances
  - Run coherence validation checks
  - Compare vs sectorial benchmarks (via sector_code)
  - Compute Z-Score Altman (4-variable model)
  - Assign traffic light status per ratio
- Return complete RatioSetSchema

---

### 4. Component Architecture: Bloc4RatiosComponent

```typescript
@Component({
  selector: 'app-bloc4-ratios',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatAlertModule,
    RatioGroupCardComponent,
    CoherenceAlertsComponent,
    FinacesScorerGaugeComponent,  // reuse from P12
    FinacesZScoreCardComponent,
  ],
  templateUrl: './bloc4-ratios.component.html',
  styleUrls: ['./bloc4-ratios.component.scss']
})
export class Bloc4RatiosComponent implements OnInit, OnDestroy {
  caseId$ = this.route.paramMap.pipe(map(p => p.get('caseId')));
  ratioSet$: Observable<RatioSetSchema>;
  isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);

  // Subflows for parallel execution
  scoringInProgress$ = new BehaviorSubject<boolean>(false);
  iaPredictionInProgress$ = new BehaviorSubject<boolean>(false);

  constructor(
    private ratioService: RatioCalculationService,
    private caseService: CaseService,
    private router: Router,
    private route: ActivatedRoute,
    private notif: MatSnackBar
  ) {}

  ngOnInit() {
    this.ratioSet$ = this.caseId$.pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(caseId => this.ratioService.computeRatios(caseId)),
      tap(() => this.isLoading$.next(false)),
      catchError(err => {
        this.error$.next(err.message);
        return throwError(err);
      })
    );
  }

  // Launch both scoring tasks in parallel
  launchScoringAndPrediction() {
    const caseId = this.caseId$.getValue();

    this.scoringInProgress$.next(true);
    this.iaPredictionInProgress$.next(true);

    forkJoin([
      this.caseService.launchMccScoring(caseId),
      this.caseService.launchIaPrediction(caseId)
    ]).subscribe(
      () => {
        this.notif.open('Scoring MCC et Prédiction IA lancés', '', { duration: 3000 });
        this.scoringInProgress$.next(false);
        this.iaPredictionInProgress$.next(false);
        // Navigate to next bloc (Scoring MCC)
        this.router.navigate([`/cases/${caseId}/scoring`]);
      },
      err => {
        this.notif.open(`Erreur : ${err.message}`, 'Fermer');
        this.scoringInProgress$.next(false);
        this.iaPredictionInProgress$.next(false);
      }
    );
  }
}
```

---

### 5. Template: bloc4-ratios.component.html

```html
<div class="bloc4-container">

  <!-- Header -->
  <div class="bloc-header">
    <div>
      <h2 class="bloc-title">
        <mat-icon>calculate</mat-icon>
        RATIOS FINANCIERS
      </h2>
      <p class="bloc-subtitle">Analyse groupée des 25+ indicateurs. Z-Score Altman + alertes cohérence.</p>
    </div>
    <button mat-raised-button color="primary"
            (click)="launchScoringAndPrediction()"
            [disabled]="(isLoading$ | async) || (scoringInProgress$ | async) || (iaPredictionInProgress$ | async)">
      <mat-icon *ngIf="!(scoringInProgress$ | async)">play_arrow</mat-icon>
      <mat-spinner *ngIf="(scoringInProgress$ | async)" diameter="20"></mat-spinner>
      Lancer Scoring MCC & Prédiction IA
    </button>
  </div>

  <!-- Loading state -->
  <mat-progress-bar *ngIf="(isLoading$ | async)" mode="indeterminate"></mat-progress-bar>

  <!-- Error banner -->
  <mat-alert *ngIf="(error$ | async) as error" type="error">
    {{ error }}
    <button mat-button (click)="error$.next(null)">Fermer</button>
  </mat-alert>

  <!-- Coherence Alerts (highest priority) -->
  <app-coherence-alerts
    *ngIf="(ratioSet$ | async) as ratioSet"
    [alerts]="ratioSet.coherence_alerts"
    [status]="ratioSet.coherence_status">
  </app-coherence-alerts>

  <!-- Z-Score Alert (if DISTRESS) -->
  <mat-card *ngIf="(ratioSet$ | async) as ratioSet; let zscore = ratioSet.z_score"
            class="z-score-alert-card"
            [ngClass]="zscore.z_score_zone === 'DISTRESS' ? 'distress' : 'warning'">
    <mat-card-header>
      <mat-icon [color]="zscore.z_score_zone === 'DISTRESS' ? 'warn' : 'accent'">
        {{ zscore.z_score_zone === 'DISTRESS' ? 'error' : 'warning' }}
      </mat-icon>
      <h3>Z-Score Altman: {{ zscore.z_score_zone }}</h3>
    </mat-card-header>
    <mat-card-content>
      <p *ngIf="zscore.z_score_zone === 'DISTRESS'">
        <strong>Risque de défaut élevé.</strong> Score Z = {{ zscore.z_score_altman.current | number:'1.2-2' }}.
        Recommandation : revue senior obligatoire avant scoring définitif.
      </p>
      <p *ngIf="zscore.z_score_zone === 'GREY'">
        <strong>Zone grise.</strong> Score Z = {{ zscore.z_score_altman.current | number:'1.2-2' }}.
        Approche prudente recommandée.
      </p>
    </mat-card-content>
  </mat-card>

  <!-- 5 Ratio Groups -->
  <div class="ratio-groups-grid">

    <!-- Liquidité -->
    <app-ratio-group-card
      [groupName]="'Liquidité'"
      [groupIcon]="'water_drop'"
      [ratios]="(ratioSet$ | async)?.liquidite"
      [rowCount]="10">
    </app-ratio-group-card>

    <!-- Solvabilité -->
    <app-ratio-group-card
      [groupName]="'Solvabilité'"
      [groupIcon]="'shield'"
      [ratios]="(ratioSet$ | async)?.solvabilite"
      [rowCount]="6">
    </app-ratio-group-card>

    <!-- Rentabilité -->
    <app-ratio-group-card
      [groupName]="'Rentabilité'"
      [groupIcon]="'trending_up'"
      [ratios]="(ratioSet$ | async)?.rentabilite"
      [rowCount]="5">
    </app-ratio-group-card>

    <!-- Capacité -->
    <app-ratio-group-card
      [groupName]="'Capacité'"
      [groupIcon]="'bolt'"
      [ratios]="(ratioSet$ | async)?.capacite"
      [rowCount]="3">
    </app-ratio-group-card>

  </div>

  <!-- Z-Score Detailed -->
  <app-finaces-zscore-card
    *ngIf="(ratioSet$ | async) as ratioSet"
    [zscore]="ratioSet.z_score">
  </app-finaces-zscore-card>

  <!-- Action Footer -->
  <div class="action-footer">
    <p class="info-text">
      ✓ {{ (ratioSet$ | async)?.coherence_alerts.length || 0 }} alerte(s) cohérence détectée(s).
    </p>
    <div class="button-group">
      <button mat-stroked-button color="accent" (click)="router.navigate(['/cases/' + (caseId$ | async) + '/normalization'])">
        ← Retour Normalisation
      </button>
      <button mat-raised-button color="primary"
              (click)="launchScoringAndPrediction()"
              [disabled]="(isLoading$ | async) || (scoringInProgress$ | async)">
        <mat-icon>play_arrow</mat-icon>
        Lancer Scoring MCC & Prédiction IA →
      </button>
    </div>
  </div>

</div>
```

---

### 6. Sub-component: RatioGroupCardComponent

```typescript
@Component({
  selector: 'app-ratio-group-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatTooltipModule],
  template: `
    <mat-card class="ratio-group-card">
      <mat-card-header>
        <mat-icon class="group-icon">{{ groupIcon }}</mat-icon>
        <h3>{{ groupName }}</h3>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="getRatioArray()">

          <!-- Colonne: Indicateur -->
          <ng-container matColumnDef="indicator">
            <th mat-header-cell>Indicateur</th>
            <td mat-cell>{{ element.label }}</td>
          </ng-container>

          <!-- Colonne: Valeur -->
          <ng-container matColumnDef="value">
            <th mat-header-cell>Valeur</th>
            <td mat-cell>{{ formatValue(element.value) }}</td>
          </ng-container>

          <!-- Colonne: Status (couleur) -->
          <ng-container matColumnDef="status">
            <th mat-header-cell>Status</th>
            <td mat-cell>
              <mat-icon [class]="'status-' + element.value.status | lowercase">
                {{ statusIcon(element.value.status) }}
              </mat-icon>
            </td>
          </ng-container>

          <!-- Colonne: Variation -->
          <ng-container matColumnDef="variation">
            <th mat-header-cell>Var. %</th>
            <td mat-cell [class.positive]="element.value.variation_pct > 0"
                         [class.negative]="element.value.variation_pct < 0">
              {{ element.value.variation_pct | number:'1.1-1' }}%
            </td>
          </ng-container>

          <tr mat-header-row></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ratio-group-card {
      mat-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        .group-icon { font-size: 28px; color: var(--mcc-moderate); }
      }
      table {
        width: 100%;
        th, td { padding: 12px; text-align: left; }
      }
      .status-green { color: #4caf50; }
      .status-yellow { color: #ffc107; }
      .status-orange { color: #ff9800; }
      .status-red { color: #f44336; }
      .positive { color: #4caf50; font-weight: 500; }
      .negative { color: #f44336; font-weight: 500; }
    }
  `]
})
export class RatioGroupCardComponent {
  @Input() groupName: string;
  @Input() groupIcon: string;
  @Input() ratios: any;  // LiquiditeGroup | SolvabiliteGroup | ...
  @Input() rowCount: number = 0;

  displayedColumns = ['indicator', 'value', 'status', 'variation'];

  getRatioArray() {
    if (!this.ratios) return [];
    return Object.entries(this.ratios).map(([key, value]) => ({
      label: this.labelFromKey(key),
      value: value
    }));
  }

  labelFromKey(key: string): string {
    const labels: Record<string, string> = {
      current_ratio: 'Current Ratio',
      quick_ratio: 'Quick Ratio',
      cash_ratio: 'Cash Ratio',
      // ... etc
    };
    return labels[key] || key;
  }

  formatValue(ratioValue: RatioValue): string {
    if (ratioValue.unit === '%') return ratioValue.current.toFixed(1) + '%';
    if (ratioValue.unit === 'jours') return ratioValue.current.toFixed(0) + ' j';
    if (ratioValue.unit === '€') return '€' + (ratioValue.current / 1000000).toFixed(1) + 'M';
    return ratioValue.current.toFixed(2);
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
}
```

---

### 7. Sub-component: CoherenceAlertsComponent

```typescript
@Component({
  selector: 'app-coherence-alerts',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="coherence-alerts-container" *ngIf="alerts && alerts.length > 0">
      <h3 class="alerts-title">
        <mat-icon [color]="statusColor(status)">
          {{ statusIcon(status) }}
        </mat-icon>
        {{ alerts.length }} Alerte(s) de cohérence détectée(s)
      </h3>

      <mat-accordion>
        <mat-expansion-panel *ngFor="let alert of alerts"
                             [ngClass]="'severity-' + alert.severity | lowercase">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="alert-icon">{{ alertIcon(alert.severity) }}</mat-icon>
              {{ alert.message }}
            </mat-panel-title>
          </mat-expansion-panel-header>

          <div class="alert-content">
            <p><strong>Règle:</strong> {{ alert.rule_description }}</p>
            <p><strong>Ratios affectés:</strong> {{ alert.affected_ratios.join(', ') }}</p>
            <p><strong>Action recommandée:</strong> {{ alert.suggested_action }}</p>
            <mat-icon *ngIf="alert.data_challenge" class="data-challenge-icon">info</mat-icon>
            <p *ngIf="alert.data_challenge" class="data-challenge-text">
              ⚠️ Peut indiquer un problème de saisie des données. Vérifier les états financiers bruts.
            </p>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: [`
    .coherence-alerts-container {
      background: rgba(245, 127, 23, 0.05);
      border-left: 4px solid #ff9800;
      padding: 16px;
      border-radius: 4px;
      margin-bottom: 24px;

      .alerts-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 16px 0;
      }

      .severity-warning {
        border-left: 3px solid #ffc107;
      }

      .severity-critical {
        border-left: 3px solid #f44336;
      }

      .alert-content {
        padding: 12px 0;
        p { margin: 8px 0; }
        .data-challenge-icon { color: #ff9800; margin-right: 8px; }
        .data-challenge-text { color: #ff9800; font-style: italic; }
      }
    }
  `]
})
export class CoherenceAlertsComponent {
  @Input() alerts: CoherenceAlert[];
  @Input() status: 'CLEAN' | 'WARNINGS' | 'CRITICAL';

  statusIcon(status: string): string {
    return status === 'CRITICAL' ? 'error' : status === 'WARNINGS' ? 'warning' : 'check_circle';
  }

  statusColor(status: string): string {
    return status === 'CRITICAL' ? 'warn' : status === 'WARNINGS' ? 'accent' : 'primary';
  }

  alertIcon(severity: string): string {
    return severity === 'CRITICAL' ? 'priority_high' : 'warning_amber';
  }
}
```

---

### 8. Service: RatioCalculationService

```typescript
@Injectable({ providedIn: 'root' })
export class RatioCalculationService {

  constructor(private http: HttpClient) {}

  computeRatios(caseId: string, fiscalYear?: number): Observable<RatioSetSchema> {
    const params = new HttpParams();
    if (fiscalYear) params = params.set('fiscal_year', fiscalYear.toString());

    return this.http.post<RatioSetSchema>(
      `/api/v1/cases/${caseId}/ratios/compute`,
      {},
      { params }
    ).pipe(
      tap(result => console.log('Ratios computed:', result)),
      catchError(err => {
        console.error('Ratio calculation error:', err);
        return throwError(() => new Error('Impossible de calculer les ratios'));
      })
    );
  }

  // Utility: Check if ratio status suggests deeper investigation
  requiresDeepDive(ratioValue: RatioValue): boolean {
    return ratioValue.status === 'RED' || ratioValue.status === 'ORANGE';
  }
}
```

---

## CONTRAINTES ANGULAR

### Standalone components
- Tous les composants Bloc 4 sont **standalone: true**
- Imports déclarés explicitement (CommonModule, MatXxx, etc.)

### Change detection
- OnPush où possible (données immuables)
- Utiliser les observables et async pipe

### Performance
- Ratio computation côté backend (Angular ne calcule pas les ratios)
- Tables de ratios : virtualScroll si > 20 lignes
- Lazy load des subcomponents

### Accessibility
- `mat-icon` avec `[attr.aria-label]`
- Labels explicites pour chaque groupe de ratio
- Contraste couleur pour status (GREEN/YELLOW/ORANGE/RED)

---

## BINDING API

### Endpoints utilisés

```typescript
// 1. Compute ratios (POST)
POST /api/v1/cases/{id}/ratios/compute
Input: {}
Output: RatioSetSchema (25+ ratios, coherence_alerts, z_score)

// 2. Launch MCC scoring (POST) — dans le service CaseService
POST /api/v1/cases/{id}/score
Input: {}
Output: { status: 'SCORING_IN_PROGRESS', ... }

// 3. Launch IA prediction (POST) — dans le service CaseService
POST /api/v1/ia/cases/{id}/predict
Input: {}
Output: { status: 'PREDICTION_IN_PROGRESS', ... }
```

### Error handling
- 400 Bad Request: données normalisées incomplètes → afficher message user-friendly
- 409 Conflict: dossier pas au bon statut → rediriger vers Gate
- 500 Server Error: retry + notifier analyste

---

## CRITÈRES DE VALIDATION

### Fonctionnels
- ✓ Tous les 25 ratios s'affichent groupés par catégorie
- ✓ Traffic light (GREEN/YELLOW/ORANGE/RED) reflète les benchmarks sectoriels
- ✓ Alertes de cohérence détectées et affichées avec explication
- ✓ Z-Score Altman calculé et zone (SAFE/GREY/DISTRESS) affichée
- ✓ Bouton [Lancer Scoring MCC & Prédiction IA] déclenche les deux en parallèle
- ✓ Status dossier passe à RATIOS_COMPUTED après calcul
- ✓ Historique (trend) des ratios sur 4 ans visible si dispo

### Techniques
- ✓ Aucun calcul ratio côté frontend — tout depuis backend
- ✓ MCC-R7 respectée : ratios depuis normalized_financial_data uniquement
- ✓ MCC-R6 respectée : bloc 4 visible seulement si Gate SEALED
- ✓ Performance : chargement < 2s, tables < 50ms render
- ✓ Responsive : grille ratio adaptée à mobile (1 col) / tablet (2 cols) / desktop (4 cols)

### UX
- ✓ Bouton action disabled pendant chargement/calcul
- ✓ Erreurs affichées de façon claire + lien vers documentation
- ✓ Variation % colorée (vert=amélioration, rouge=dégradation)
- ✓ Tooltip sur chaque ratio expliquant formule (optionnel mais recommandé)
- ✓ Icônes cohérentes avec Material Design

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/features/cases/components/
├── bloc4-ratios/
│   ├── bloc4-ratios.component.ts
│   ├── bloc4-ratios.component.html
│   ├── bloc4-ratios.component.scss
│   ├── ratio-group-card/
│   │   ├── ratio-group-card.component.ts
│   │   ├── ratio-group-card.component.html
│   │   └── ratio-group-card.component.scss
│   └── coherence-alerts/
│       ├── coherence-alerts.component.ts
│       ├── coherence-alerts.component.html
│       └── coherence-alerts.component.scss
src/app/features/cases/services/
└── ratio-calculation.service.ts
src/app/shared/models/
└── ratio.model.ts
src/app/shared/icons/
└── ratio-icons.ts
```

**Routing update (case-flow-page):**
- Ajouter route `/cases/:caseId/ratios`
- Ajouter guard `GateCheckGuard` + `StatusCheckGuard`
- Navigation depuis Bloc 3 (Normalisation) → Bloc 4 (Ratios)
- Navigation depuis Bloc 4 → Bloc 5 (Scoring MCC) après calcul

---

**STATUS À LA FIN :** Dossier passe de `NORMALIZATION_DONE` → `RATIOS_COMPUTED`
**NEXT PROMPT :** P12 — Bloc 5 — Scoring MCC (Gauge, 5 Piliers Accordion, Override)
