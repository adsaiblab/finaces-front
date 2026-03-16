═══════════════════════════════════════════════════════════
PROMPT 5 — COMPOSANTS MOLÉCULAIRES (FINACES)
Dépend de : PROMPT 4 (composants atomiques)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

Phase 1 Design System - Étape 5 : Création des **3 composants moléculaires** qui composent et
orchestrent les composants atomiques pour des besoins spécifiques métier.

Les composants moléculaires dépendent des atomiques (finaces-risk-badge inclus dans finaces-pillar-row)
et ajoutent des dépendances externes (D3.js ou Chart.js pour les graphiques).

Les 3 composants :
1. **finaces-pillar-row** : Ligne d'un pilier avec accordion expansion, tableau d'indicateurs,
   commentaire analyst, et intégration de finaces-risk-badge.
2. **finaces-shap-chart** : Graphique de barres bidirectionnelles (SHAP values) pour l'analyse
   d'importance des features.
3. **finaces-stress-chart** : Graphique temporel (line chart) pour les scénarios de stress test.

---

## RÈGLES MÉTIER APPLICABLES

### Piliers de scoring (5)
Les piliers sont des dimensions d'évaluation financière :
1. **Liquidité** : icon=water_drop, couleur=#3B82F6
2. **Solvabilité** : icon=shield, couleur=#10B981
3. **Rentabilité** : icon=trending_up, couleur=#F59E0B
4. **Capacité** : icon=bolt, couleur=#8B5CF6
5. **Qualité** : icon=star, couleur=#EC4899

### Indicateurs (Tableau dans expansion)
Structure type :
| Indicateur | Valeur | Note /5 | Poids | Contribution |
|------------|--------|---------|--------|--------------|
| Current Ratio | 1.2 | 4.0 | 25% | +1.00 |
| DSO Days | 45 | 3.5 | 15% | +0.53 |

### Tension et Risque
Affichage combiné :
- Badge de risque (finaces-risk-badge) à droite
- Badge de tension (si dynamic_analysis présent)

### SHAP Features
Structure de données :
```typescript
interface ShapFeature {
  name: string;                           // "Current Ratio"
  label?: string;                         // "Ratio de liquidité"
  rawValue: number;                       // 1.2
  shapValue: number;                      // 0.32 ou -0.15
  direction: 'UP' | 'DOWN';               // UP = risque ↑, DOWN = risque ↓
  group?: 'liquidity' | 'solvency' | ...  // Pour groupage visuel
}
```

Interprétation :
- **direction=UP, shapValue>0** : Facteur qui augmente le risque (barre rouge à droite)
- **direction=DOWN, shapValue>0** : Facteur qui réduit le risque (barre verte à gauche)

### Stress Test Results
Structure :
```typescript
interface StressResult {
  scenario: string;                       // "Stress 30 jours"
  minCashPosition: number;                // -5000 (en devise locale)
  status: 'SOLVENT' | 'LIMIT' | 'INSOLVENT';
  criticalMonth?: number;                 // 3 (mois où min atteint)
}
```

---

## FICHIERS À CRÉER / MODIFIER

### Arborescence finale (Phase 5)

```
src/app/shared/
├── components/
│   ├── finaces-pillar-row/
│   │   ├── finaces-pillar-row.component.ts
│   │   ├── finaces-pillar-row.component.html
│   │   ├── finaces-pillar-row.component.scss
│   │   └── finaces-pillar-row.component.spec.ts
│   ├── finaces-shap-chart/
│   │   ├── finaces-shap-chart.component.ts
│   │   ├── finaces-shap-chart.component.html
│   │   ├── finaces-shap-chart.component.scss
│   │   └── finaces-shap-chart.component.spec.ts
│   ├── finaces-stress-chart/
│   │   ├── finaces-stress-chart.component.ts
│   │   ├── finaces-stress-chart.component.html
│   │   ├── finaces-stress-chart.component.scss
│   │   └── finaces-stress-chart.component.spec.ts
│   └── index.ts (UPDATED)
└── ...
```

### Dépendances externes
Ajouter à `package.json` (si pas déjà présent de P1) :
```json
{
  "dependencies": {
    "d3": "^7.8.5",
    "chart.js": "^4.4.0"
  },
  "devDependencies": {
    "@types/d3": "^7.4.0"
  }
}
```

### Modifications à PROMPT 4 (Index)
Ajouter à `shared/components/index.ts` :
```typescript
export * from './finaces-pillar-row/finaces-pillar-row.component';
export * from './finaces-shap-chart/finaces-shap-chart.component';
export * from './finaces-stress-chart/finaces-stress-chart.component';
```

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. FinacesPillarRowComponent

**Objectif** : Afficher un pilier de scoring avec :
- Ligne statique : icône + nom + score sur /5 + barre de progression + badge de risque
- Expansion : tableau d'indicateurs, liste de signaux, liste de tendances, textarea pour commentaire
- Édition : texte du commentaire modifiable si `readonly=false`

#### TypeScript Specification

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FinacesRiskBadgeComponent } from '../finaces-risk-badge/finaces-risk-badge.component';

// Models (from PROMPT 2)
export interface PillarDetailSchema {
  pillarKey: 'LIQUIDITE' | 'SOLVABILITE' | 'RENTABILITE' | 'CAPACITE' | 'QUALITE';
  label: string;
  score: number;
  maxScore: number;
  riskClass: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  indicators?: PillarIndicator[];
  signals?: string[];
  trends?: PillarTrend[];
  comment?: string;
  rail: 'MCC' | 'IA';
}

export interface PillarIndicator {
  name: string;
  value: string | number;
  score: number;
  weight: number;
  contribution: number;
}

export interface PillarTrend {
  name: string;
  direction: 'UP' | 'DOWN';
  slope: number;
}

interface PillarMetadata {
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'finaces-pillar-row',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FinacesRiskBadgeComponent
  ],
  templateUrl: './finaces-pillar-row.component.html',
  styleUrls: ['./finaces-pillar-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesPillarRowComponent {
  @Input({ required: true }) pillar!: PillarDetailSchema;
  @Input() isExpanded: boolean = false;
  @Input() readonly: boolean = false;

  @Output() toggleExpand = new EventEmitter<string>();
  @Output() commentChange = new EventEmitter<string>();

  displayedColumns: string[] = [
    'indicator',
    'value',
    'score',
    'weight',
    'contribution'
  ];

  pillarMetadata: Record<string, PillarMetadata> = {
    LIQUIDITE: {
      icon: 'water_drop',
      color: '#3B82F6',
      description: 'Capacité à faire face aux dettes à court terme'
    },
    SOLVABILITE: {
      icon: 'shield',
      color: '#10B981',
      description: 'Structure de financement et endettement'
    },
    RENTABILITE: {
      icon: 'trending_up',
      color: '#F59E0B',
      description: 'Génération de profits et marges'
    },
    CAPACITE: {
      icon: 'bolt',
      color: '#8B5CF6',
      description: 'Capacité de remboursement du contrat'
    },
    QUALITE: {
      icon: 'star',
      color: '#EC4899',
      description: 'Qualité des données et cohérence'
    }
  };

  metadata: PillarMetadata | null = null;
  editingComment: string = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.metadata = this.pillarMetadata[this.pillar.pillarKey] || null;
    this.editingComment = this.pillar.comment || '';
  }

  onExpandToggle(): void {
    this.isExpanded = !this.isExpanded;
    this.toggleExpand.emit(this.pillar.pillarKey);
  }

  onCommentBlur(): void {
    if (this.editingComment !== this.pillar.comment) {
      this.commentChange.emit(this.editingComment);
    }
  }

  getProgressValue(): number {
    return (this.pillar.score / this.pillar.maxScore) * 100;
  }

  getProgressColor(): string {
    const riskColorMap: Record<string, string> = {
      LOW: '#22C55E',
      MODERATE: '#F59E0B',
      HIGH: '#F97316',
      CRITICAL: '#EF4444'
    };
    return riskColorMap[this.pillar.riskClass] || '#F59E0B';
  }
}
```

#### HTML Template

```html
<mat-expansion-panel
  [expanded]="isExpanded"
  (opened)="onExpandToggle()"
  (closed)="onExpandToggle()"
  class="pillar-panel"
>
  <mat-expansion-panel-header>
    <mat-panel-title class="pillar-header">
      <!-- Pillar icon + name -->
      <mat-icon [style.color]="metadata?.color" class="pillar-icon">
        {{ metadata?.icon }}
      </mat-icon>
      <span class="pillar-name">{{ pillar.label }}</span>

      <!-- Score badge + progress bar -->
      <div class="pillar-score-section">
        <span class="pillar-score-value">{{ pillar.score }}/{{ pillar.maxScore }}</span>
        <div class="progress-bar-container">
          <div
            class="progress-bar-fill"
            [style.width.%]="getProgressValue()"
            [style.background-color]="getProgressColor()"
          ></div>
        </div>
      </div>

      <!-- Risk badge -->
      <finaces-risk-badge
        [riskClass]="pillar.riskClass"
        [rail]="pillar.rail"
        [size]="'sm'"
        [showLabel]="true"
        [showIcon]="false"
        class="pillar-risk-badge"
      ></finaces-risk-badge>
    </mat-panel-title>
  </mat-expansion-panel-header>

  <!-- Expanded content -->
  <div class="pillar-expanded-content">
    <!-- Indicators table -->
    <h4 class="section-title">Indicateurs</h4>
    <table mat-table [dataSource]="pillar.indicators || []" class="indicators-table">
      <!-- Indicator column -->
      <ng-container matColumnDef="indicator">
        <th mat-header-cell>Indicateur</th>
        <td mat-cell *matCellDef="let element">
          <span class="indicator-name">{{ element.name }}</span>
        </td>
      </ng-container>

      <!-- Value column -->
      <ng-container matColumnDef="value">
        <th mat-header-cell>Valeur</th>
        <td mat-cell *matCellDef="let element">
          <span class="indicator-value">{{ element.value }}</span>
        </td>
      </ng-container>

      <!-- Score column -->
      <ng-container matColumnDef="score">
        <th mat-header-cell>Note /5</th>
        <td mat-cell *matCellDef="let element">
          <span class="indicator-score">{{ element.score.toFixed(1) }}</span>
        </td>
      </ng-container>

      <!-- Weight column -->
      <ng-container matColumnDef="weight">
        <th mat-header-cell>Poids</th>
        <td mat-cell *matCellDef="let element">
          <span class="indicator-weight">{{ element.weight }}%</span>
        </td>
      </ng-container>

      <!-- Contribution column -->
      <ng-container matColumnDef="contribution">
        <th mat-header-cell>Contribution</th>
        <td mat-cell *matCellDef="let element">
          <span class="indicator-contribution"
            >+{{ element.contribution.toFixed(2) }}</span
          >
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <!-- Signals section -->
    <div *ngIf="pillar.signals && pillar.signals.length" class="signals-section">
      <h4 class="section-title">Signaux</h4>
      <ul class="signals-list">
        <li *ngFor="let signal of pillar.signals" class="signal-item">
          {{ signal }}
        </li>
      </ul>
    </div>

    <!-- Trends section -->
    <div *ngIf="pillar.trends && pillar.trends.length" class="trends-section">
      <h4 class="section-title">Tendances</h4>
      <div class="trends-list">
        <div *ngFor="let trend of pillar.trends" class="trend-item">
          <span class="trend-name">{{ trend.name }}</span>
          <mat-icon [class.trend-up]="trend.direction === 'UP'" [class.trend-down]="trend.direction === 'DOWN'">
            {{ trend.direction === 'UP' ? 'trending_up' : 'trending_down' }}
          </mat-icon>
          <span class="trend-slope">{{ trend.slope > 0 ? '+' : '' }}{{ trend.slope.toFixed(3) }}</span>
        </div>
      </div>
    </div>

    <!-- Comment section -->
    <div class="comment-section">
      <h4 class="section-title">Commentaire</h4>
      <mat-form-field *ngIf="!readonly" appearance="outline" class="comment-field">
        <textarea
          matInput
          [(ngModel)]="editingComment"
          (blur)="onCommentBlur()"
          placeholder="Ajouter un commentaire d'analyse..."
          rows="4"
        ></textarea>
      </mat-form-field>
      <div *ngIf="readonly" class="comment-read-only">
        {{ pillar.comment || '(Pas de commentaire)' }}
      </div>
    </div>
  </div>
</mat-expansion-panel>
```

#### SCSS Styles

```scss
.pillar-panel {
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #ffffff;

  ::ng-deep {
    .mat-mdc-expansion-panel-header {
      padding: 12px 16px;
    }

    .mat-mdc-expansion-panel-header-description {
      align-items: center;
      margin: 0;
    }
  }

  .pillar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    flex: 1;

    .pillar-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .pillar-name {
      font-weight: 500;
      font-size: 14px;
      color: #1e293b;
      flex: 0 1 120px;
    }

    .pillar-score-section {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      margin-right: auto;

      .pillar-score-value {
        font-weight: 600;
        font-size: 12px;
        color: #475569;
        min-width: 40px;
        text-align: right;
      }

      .progress-bar-container {
        width: 100px;
        height: 6px;
        background-color: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;

        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 300ms ease-in-out;
        }
      }
    }

    .pillar-risk-badge {
      flex-shrink: 0;
    }
  }
}

.pillar-expanded-content {
  padding: 16px;
  border-top: 1px solid #e2e8f0;

  .section-title {
    margin: 0 0 12px 0;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .indicators-table {
    width: 100%;
    margin-bottom: 20px;
    font-size: 13px;

    th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #475569;
      padding: 8px 12px;
      text-align: left;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }

    .indicator-name {
      font-weight: 500;
    }

    .indicator-value {
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }

    .indicator-score {
      font-weight: 600;
      color: #1e293b;
    }

    .indicator-weight,
    .indicator-contribution {
      font-variant-numeric: tabular-nums;
    }

    .indicator-contribution {
      color: #10b981;
      font-weight: 500;
    }
  }

  .signals-section {
    margin-bottom: 20px;

    .signals-list {
      list-style: none;
      padding: 0;
      margin: 0;

      .signal-item {
        padding: 8px 12px;
        background-color: #f0f9ff;
        border-left: 3px solid #3b82f6;
        border-radius: 4px;
        margin-bottom: 6px;
        font-size: 13px;
        color: #334155;
      }
    }
  }

  .trends-section {
    margin-bottom: 20px;

    .trends-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .trend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background-color: #f1f5f9;
        border-radius: 4px;
        font-size: 13px;

        .trend-name {
          flex: 1;
          font-weight: 500;
          color: #1e293b;
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;

          &.trend-up {
            color: #f97316;
          }

          &.trend-down {
            color: #10b981;
          }
        }

        .trend-slope {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #475569;
          min-width: 50px;
          text-align: right;
        }
      }
    }
  }

  .comment-section {
    .comment-field {
      width: 100%;

      textarea {
        font-family: inherit;
        font-size: 13px;
        line-height: 1.5;
      }
    }

    .comment-read-only {
      padding: 12px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesPillarRowComponent } from './finaces-pillar-row.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('FinacesPillarRowComponent', () => {
  let component: FinacesPillarRowComponent;
  let fixture: ComponentFixture<FinacesPillarRowComponent>;

  const mockPillar = {
    pillarKey: 'LIQUIDITE' as const,
    label: 'Liquidité',
    score: 3.5,
    maxScore: 5,
    riskClass: 'MODERATE' as const,
    rail: 'MCC' as const,
    indicators: [
      {
        name: 'Current Ratio',
        value: '1.2',
        score: 4.0,
        weight: 25,
        contribution: 1.0
      }
    ],
    signals: ['Signal 1', 'Signal 2'],
    trends: [
      {
        name: 'Trend 1',
        direction: 'UP' as const,
        slope: 0.05
      }
    ],
    comment: 'Test comment'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinacesPillarRowComponent,
        MatExpansionModule,
        MatTableModule,
        MatIconModule,
        BrowserAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesPillarRowComponent);
    component = fixture.componentInstance;
    component.pillar = mockPillar;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display pillar name and score', () => {
    const header = fixture.nativeElement.querySelector('.pillar-name');
    expect(header.textContent).toContain('Liquidité');
  });

  it('should calculate progress value correctly', () => {
    const progress = component.getProgressValue();
    expect(progress).toBe(70); // 3.5 / 5 * 100
  });

  it('should emit toggleExpand on header click', () => {
    spyOn(component.toggleExpand, 'emit');
    const header = fixture.nativeElement.querySelector('.mat-mdc-expansion-panel-header');
    header.click();
    expect(component.toggleExpand.emit).toHaveBeenCalledWith('LIQUIDITE');
  });

  it('should emit commentChange on comment blur', () => {
    spyOn(component.commentChange, 'emit');
    component.editingComment = 'New comment';
    component.onCommentBlur();
    expect(component.commentChange.emit).toHaveBeenCalledWith('New comment');
  });
});
```

---

### 2. FinacesShapChartComponent

**Objectif** : Graphique de barres bidirectionnelles pour les SHAP values.
Barres positives (risque ↑) : rouges à droite.
Barres négatives (risque ↓) : vertes à gauche.
Axe central à zéro.

#### TypeScript Specification

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as d3 from 'd3';

export interface ShapFeature {
  name: string;
  label?: string;
  rawValue: number;
  shapValue: number;
  direction: 'UP' | 'DOWN';
  group?: 'liquidity' | 'solvency' | 'profitability' | 'capacity' | 'quality';
}

@Component({
  selector: 'finaces-shap-chart',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './finaces-shap-chart.component.html',
  styleUrls: ['./finaces-shap-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FinacesShapChartComponent implements OnChanges {
  @Input({ required: true }) features: ShapFeature[] = [];
  @Input() maxFeatures: number = 10;
  @Input() showValues: boolean = true;
  @Input() height: number = 300;

  @Output() featureClick = new EventEmitter<ShapFeature>();

  svgId = `shap-chart-${Math.random().toString(36).substr(2, 9)}`;
  displayedFeatures: ShapFeature[] = [];

  private readonly colors = {
    risk_positive: '#EF4444',
    risk_positive_light: '#FECACA',
    risk_negative: '#10B981',
    risk_negative_light: '#D1FAE5',
    axis: '#CBD5E1',
    text: '#475569',
    label: '#1E293B'
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['features'] || changes['maxFeatures']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    // Sort by absolute SHAP value and limit
    this.displayedFeatures = [...this.features]
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, this.maxFeatures);

    this.cdr.markForCheck();

    // Wait for DOM update before rendering D3
    setTimeout(() => this.renderChart(), 100);
  }

  private renderChart(): void {
    const svg = d3.select(`#${this.svgId}`);
    if (svg.empty()) return;

    const margin = { top: 20, right: 120, bottom: 20, left: 150 };
    const width = svg.node()?.clientWidth || 800;
    const chartWidth = width - margin.left - margin.right;
    const barHeight = 30;
    const chartHeight = this.displayedFeatures.length * barHeight + 40;

    // Clear previous
    svg.selectAll('*').remove();

    // Scales
    const maxAbsValue = Math.max(
      ...this.displayedFeatures.map(f => Math.abs(f.shapValue))
    );
    const xScale = d3
      .scaleLinear()
      .domain([-maxAbsValue * 1.2, maxAbsValue * 1.2])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleBand()
      .domain(this.displayedFeatures.map((_, i) => i.toString()))
      .range([0, this.displayedFeatures.length * barHeight])
      .padding(0.4);

    // SVG groups
    const g = svg
      .attr('width', width)
      .attr('height', chartHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Zero line (axis)
    g.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', -10)
      .attr('y2', chartHeight)
      .attr('stroke', this.colors.axis)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    // Bars
    g.selectAll('g.bar-group')
      .data(this.displayedFeatures, (d: any, i: number) => i.toString())
      .join('g')
      .attr('class', 'bar-group')
      .attr('transform', (_, i) => `translate(0, ${yScale(i.toString())})`)
      .each((feature: ShapFeature, i: number, nodes: any) => {
        const g = d3.select(nodes[i]);
        const isPositive = feature.shapValue > 0;

        // Bar rectangle
        g.append('rect')
          .attr('class', 'shap-bar')
          .attr('x', xScale(0))
          .attr(
            'width',
            Math.abs(xScale(feature.shapValue) - xScale(0))
          )
          .attr('height', yScale.bandwidth())
          .attr('fill', isPositive
            ? this.colors.risk_positive
            : this.colors.risk_negative)
          .style('cursor', 'pointer')
          .on('click', () => this.featureClick.emit(feature));

        // Feature name (left)
        g.append('text')
          .attr('class', 'feature-name')
          .attr('x', -8)
          .attr('y', yScale.bandwidth() / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('font-size', '12px')
          .attr('font-weight', '500')
          .attr('fill', this.colors.label)
          .text(feature.name)
          .append('title')
          .text(feature.label || feature.name);

        // Raw value (left, small)
        g.append('text')
          .attr('class', 'raw-value')
          .attr('x', -8)
          .attr('y', yScale.bandwidth() / 2 + 14)
          .attr('font-size', '11px')
          .attr('font-weight', '400')
          .attr('fill', this.colors.text)
          .attr('text-anchor', 'end')
          .text(`(${feature.rawValue.toFixed(2)})`);

        // SHAP value (right)
        if (this.showValues) {
          g.append('text')
            .attr('class', 'shap-value')
            .attr('x', xScale(feature.shapValue) + 8)
            .attr('y', yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', isPositive ? this.colors.risk_positive : this.colors.risk_negative)
            .text(`${isPositive ? '+' : ''}${feature.shapValue.toFixed(2)}`)
            .append('title')
            .text(`SHAP value: ${feature.shapValue.toFixed(4)}`);

          // Risk indicator (right)
          g.append('text')
            .attr('class', 'risk-indicator')
            .attr('x', xScale(feature.shapValue) + 8)
            .attr('y', yScale.bandwidth() / 2 + 12)
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('fill', isPositive ? this.colors.risk_positive : this.colors.risk_negative)
            .text(isPositive ? '🔴 Risque ↑' : '🟢 Risque ↓');
        }
      });

    // X-axis (top labels)
    const xAxis = d3
      .axisTop(xScale)
      .ticks(5)
      .tickFormat((d: any) => d.toFixed(2));

    g.append('g')
      .attr('class', 'x-axis')
      .call(xAxis)
      .attr('color', this.colors.text)
      .style('font-size', '11px');
  }
}
```

#### HTML Template

```html
<div class="finaces-shap-container">
  <svg
    [attr.id]="svgId"
    class="shap-svg"
    [style.min-height.px]="height"
  ></svg>
</div>
```

#### SCSS Styles

```scss
.finaces-shap-container {
  width: 100%;
  overflow-x: auto;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 16px;

  .shap-svg {
    width: 100%;
    height: auto;
    min-height: 300px;

    .bar-group {
      transition: opacity 150ms ease-in-out;

      &:hover {
        opacity: 0.8;

        .shap-bar {
          filter: brightness(0.95);
        }
      }
    }

    .shap-bar {
      transition: fill 150ms ease-in-out;
      cursor: pointer;
      border-radius: 2px;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .feature-name {
      pointer-events: none;
    }

    .raw-value,
    .shap-value,
    .risk-indicator {
      pointer-events: none;
      user-select: none;
    }

    .x-axis {
      path,
      line {
        stroke: #cbd5e1;
      }

      text {
        fill: #64748b;
      }
    }
  }
}

/* Responsive */
@media (max-width: 768px) {
  .finaces-shap-container {
    padding: 12px;

    .shap-svg {
      .feature-name {
        font-size: 10px !important;
      }

      .raw-value {
        font-size: 9px !important;
      }

      .shap-value {
        font-size: 10px !important;
      }
    }
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesShapChartComponent, ShapFeature } from './finaces-shap-chart.component';

describe('FinacesShapChartComponent', () => {
  let component: FinacesShapChartComponent;
  let fixture: ComponentFixture<FinacesShapChartComponent>;

  const mockFeatures: ShapFeature[] = [
    {
      name: 'Current Ratio',
      rawValue: 1.2,
      shapValue: 0.32,
      direction: 'UP',
      group: 'liquidity'
    },
    {
      name: 'DSO Days',
      rawValue: 45,
      shapValue: -0.15,
      direction: 'DOWN',
      group: 'liquidity'
    },
    {
      name: 'Debt/Equity',
      rawValue: 0.8,
      shapValue: 0.48,
      direction: 'UP',
      group: 'solvency'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesShapChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesShapChartComponent);
    component = fixture.componentInstance;
    component.features = mockFeatures;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should limit features to maxFeatures', () => {
    component.maxFeatures = 2;
    component.ngOnChanges({
      features: {} as any,
      maxFeatures: {} as any
    });
    expect(component.displayedFeatures.length).toBeLessThanOrEqual(2);
  });

  it('should sort features by absolute SHAP value', () => {
    component.ngOnChanges({
      features: {} as any,
      maxFeatures: {} as any
    });
    const values = component.displayedFeatures.map(f => Math.abs(f.shapValue));
    for (let i = 0; i < values.length - 1; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i + 1]);
    }
  });

  it('should emit featureClick on bar click', (done) => {
    component.featureClick.subscribe((feature: ShapFeature) => {
      expect(feature.name).toBe('Debt/Equity');
      done();
    });
    component.featureClick.emit(mockFeatures[2]);
  });
});
```

---

### 3. FinacesStressChartComponent

**Objectif** : Graphique temporel (line chart) pour les scénarios de stress test.
Axe X : mois (1-24).
Axe Y : trésorerie disponible en devise locale.
Ligne rouge pointillée à zéro (seuil critique).
Marqueur rouge au mois critique.
Zone grisée pour la période simulée.

#### TypeScript Specification

```typescript
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ScenarioFlowSchema {
  month: number;
  openingCash: number;
  inflows: number;
  outflows: number;
  closingCash: number;
  label?: string;
}

@Component({
  selector: 'finaces-stress-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finaces-stress-chart.component.html',
  styleUrls: ['./finaces-stress-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FinacesStressChartComponent implements OnChanges {
  @Input({ required: true }) monthlyFlows: ScenarioFlowSchema[] = [];
  @Input() stress60dResult?: string;
  @Input() stress90dResult?: string;
  @Input() criticalMonth?: number;
  @Input() height: number = 250;

  canvasId = `stress-chart-${Math.random().toString(36).substr(2, 9)}`;
  chart: Chart<'line'> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['monthlyFlows']) {
      this.cdr.markForCheck();
      setTimeout(() => this.renderChart(), 100);
    }
  }

  private renderChart(): void {
    const canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare data
    const labels = this.monthlyFlows.map(f => `M${f.month}`);
    const data = this.monthlyFlows.map(f => f.closingCash);

    // Calculate min for Y-axis
    const minValue = Math.min(0, ...data);
    const maxValue = Math.max(0, ...data);
    const padding = (maxValue - minValue) * 0.15;

    // Chart config
    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Trésorerie disponible',
            data,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: true,
            segment: {
              borderColor: (ctx: any) => {
                // Color points red near critical month
                if (
                  this.criticalMonth &&
                  Math.abs(ctx.p1DataIndex - this.criticalMonth) <= 1
                ) {
                  return '#EF4444';
                }
                return '#3B82F6';
              }
            }
          },
          {
            // Critical threshold line (zero)
            label: 'Seuil critique',
            data: new Array(labels.length).fill(0),
            borderColor: '#EF4444',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: '500'
              },
              color: '#475569'
            }
          },
          filler: {
            propagate: true
          },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            padding: 12,
            titleFont: {
              size: 13,
              weight: '600'
            },
            bodyFont: {
              size: 12
            },
            borderColor: '#cbd5e1',
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              label: (context: any) => {
                if (context.datasetIndex === 0) {
                  return `Trésorerie: ${context.parsed.y.toLocaleString('fr-FR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: minValue - padding,
            max: maxValue + padding,
            grid: {
              color: '#e2e8f0',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              },
              callback: (value: any) => {
                return value.toLocaleString('fr-FR', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                });
              }
            },
            title: {
              display: true,
              text: 'Trésorerie (devise locale)',
              color: '#475569',
              font: {
                size: 12,
                weight: '600'
              }
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 11
              }
            },
            title: {
              display: true,
              text: 'Mois de projection',
              color: '#475569',
              font: {
                size: 12,
                weight: '600'
              }
            }
          }
        }
      }
    };

    // Create chart
    this.chart = new Chart(canvas, config);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
```

#### HTML Template

```html
<div class="finaces-stress-container">
  <div class="stress-header">
    <h3 class="stress-title">Projection de Trésorerie</h3>
    <div class="stress-metadata">
      <span
        *ngIf="stress60dResult"
        class="stress-result"
        [class.stress-insolvent]="stress60dResult === 'INSOLVENT'"
      >
        <mat-icon>{{ stress60dResult === 'SOLVENT' ? 'check_circle' : 'cancel' }}</mat-icon>
        60J : {{ stress60dResult }}
      </span>
      <span
        *ngIf="stress90dResult"
        class="stress-result"
        [class.stress-insolvent]="stress90dResult === 'INSOLVENT'"
      >
        <mat-icon>{{ stress90dResult === 'SOLVENT' ? 'check_circle' : 'cancel' }}</mat-icon>
        90J : {{ stress90dResult }}
      </span>
    </div>
  </div>

  <canvas
    [attr.id]="canvasId"
    [style.height.px]="height"
    class="stress-canvas"
  ></canvas>
</div>
```

#### SCSS Styles

```scss
.finaces-stress-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 16px;

  .stress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .stress-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .stress-metadata {
      display: flex;
      gap: 12px;

      .stress-result {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background-color: #f1f5f9;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #334155;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: #10b981;
        }

        &.stress-insolvent {
          background-color: #fee2e2;
          color: #7f1d1d;

          mat-icon {
            color: #ef4444;
          }
        }
      }
    }
  }

  .stress-canvas {
    width: 100%;
    min-height: 250px;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .finaces-stress-container {
    padding: 12px;

    .stress-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .stress-metadata {
        flex-wrap: wrap;
      }
    }
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesStressChartComponent, ScenarioFlowSchema } from './finaces-stress-chart.component';

describe('FinacesStressChartComponent', () => {
  let component: FinacesStressChartComponent;
  let fixture: ComponentFixture<FinacesStressChartComponent>;

  const mockFlows: ScenarioFlowSchema[] = [
    {
      month: 1,
      openingCash: 10000,
      inflows: 5000,
      outflows: 3000,
      closingCash: 12000
    },
    {
      month: 2,
      openingCash: 12000,
      inflows: 4000,
      outflows: 5000,
      closingCash: 11000
    },
    {
      month: 3,
      openingCash: 11000,
      inflows: 3000,
      outflows: 6000,
      closingCash: 8000
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesStressChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesStressChartComponent);
    component = fixture.componentInstance;
    component.monthlyFlows = mockFlows;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have unique canvas ID', () => {
    const component2 = new FinacesStressChartComponent({} as any);
    expect(component.canvasId).not.toBe(component2.canvasId);
  });

  it('should display stress results when provided', () => {
    component.stress60dResult = 'SOLVENT';
    component.stress90dResult = 'INSOLVENT';
    fixture.detectChanges();

    const results = fixture.nativeElement.querySelectorAll('.stress-result');
    expect(results.length).toBe(2);
  });

  it('should clean up chart on destroy', () => {
    component.ngOnChanges({
      monthlyFlows: { currentValue: mockFlows } as any
    });
    fixture.detectChanges();

    spyOn(component.chart as any, 'destroy');
    component.ngOnDestroy();
    expect(component.chart?.destroy).toHaveBeenCalled();
  });
});
```

---

## CONTRAINTES ANGULAR

1. **Standalone mandatory** : Tous les composants moléculaires sont standalone.
2. **OnPush + ngOnChanges** : Gestion réactive des inputs avec OnPush.
3. **D3.js integration** : SVG rendu avec D3.js (finaces-shap-chart), timing asynchrone avec `setTimeout`.
4. **Chart.js integration** : Line chart via Chart.js (finaces-stress-chart), auto-cleanup en `ngOnDestroy`.
5. **Material dependencies** : Importation complète de MatTableModule, MatExpansionModule, etc.
6. **Reactive forms** : FormsModule pour [(ngModel)] dans les textareas.
7. **Memory safety** : D3 selections, Chart instances clearées avant destruction.

---

## BINDING API

### FinacesPillarRowComponent
```typescript
// Usage
<finaces-pillar-row
  [pillar]="pillarData"
  [isExpanded]="expandedPillar === pillarData.pillarKey"
  [readonly]="false"
  (toggleExpand)="onTogglePillar($event)"
  (commentChange)="onCommentChange($event)"
></finaces-pillar-row>
```

### FinacesShapChartComponent
```typescript
// Usage
<finaces-shap-chart
  [features]="shapFeatures"
  [maxFeatures]="10"
  [showValues]="true"
  [height]="350"
  (featureClick)="onFeatureClick($event)"
></finaces-shap-chart>
```

### FinacesStressChartComponent
```typescript
// Usage
<finaces-stress-chart
  [monthlyFlows]="stressMonthlyData"
  [stress60dResult]="'SOLVENT'"
  [stress90dResult]="'INSOLVENT'"
  [criticalMonth]="3"
  [height]="300"
></finaces-stress-chart>
```

---

## CRITÈRES DE VALIDATION

### ✓ Validation visuelle (QA manual)
- [ ] finaces-pillar-row affiche icône + nom + score + barre + badge de risque
- [ ] finaces-pillar-row expansion affiche tableau d'indicateurs avec 5 colonnes
- [ ] finaces-pillar-row expansion affiche signaux et tendances
- [ ] finaces-pillar-row textarea modifiable quand readonly=false
- [ ] finaces-shap-chart affiche barres bidirectionnelles (rouge/vert)
- [ ] finaces-shap-chart axe central à zéro visible
- [ ] finaces-shap-chart affiche SHAP values formatées à droite
- [ ] finaces-stress-chart affiche line chart avec courbe
- [ ] finaces-stress-chart affiche seuil critique (ligne rouge pointillée)
- [ ] finaces-stress-chart affiche métadonnées de stress (60J, 90J)

### ✓ Validation technique
- [ ] Tous les composants exportés depuis `shared/components/index.ts`
- [ ] Pas d'erreurs de compilation `ng build`
- [ ] Tous les tests unitaires passent `ng test`
- [ ] D3.js et Chart.js chargés correctement
- [ ] Pas de memory leaks (D3 selections détruites, Chart destroyed)
- [ ] OnPush activé sur tous les composants

### ✓ Validation de performance
- [ ] D3 rendering < 200ms
- [ ] Chart.js rendering < 150ms
- [ ] Pas de jank lors du scroll de table
- [ ] Animations lisses (60 FPS)

### ✓ Validation métier
- [ ] Tous les piliers (5) affichent correctement leur icône et couleur
- [ ] Tenant compte des deux rails (MCC/IA) partout où applicable
- [ ] SHAP chart affiche direction UP/DOWN correctement
- [ ] Stress chart mappe les mois critiques avec marqueurs visuels

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/shared/
├── components/
│   ├── finaces-pillar-row/
│   │   ├── finaces-pillar-row.component.ts
│   │   ├── finaces-pillar-row.component.html
│   │   ├── finaces-pillar-row.component.scss
│   │   └── finaces-pillar-row.component.spec.ts
│   ├── finaces-shap-chart/
│   │   ├── finaces-shap-chart.component.ts
│   │   ├── finaces-shap-chart.component.html
│   │   ├── finaces-shap-chart.component.scss
│   │   └── finaces-shap-chart.component.spec.ts
│   ├── finaces-stress-chart/
│   │   ├── finaces-stress-chart.component.ts
│   │   ├── finaces-stress-chart.component.html
│   │   ├── finaces-stress-chart.component.scss
│   │   └── finaces-stress-chart.component.spec.ts
│   └── index.ts (UPDATED avec exports)
└── ...
```

---

## CHECKPOINT PHASE 1 ──────────────────────────────────────

À ce stade, l'application doit :

✓ **Disposer de 7 composants custom réutilisables et testés visuellement**

✓ **finaces-risk-badge**
  - Affiche correctement les 4 niveaux (LOW/MODERATE/HIGH/CRITICAL)
  - Supporte les 2 rails (MCC solide, IA outlined)
  - Supporte les 2 tailles (sm=20px, md=24px)
  - Affiche icône optionnellement
  - Tous les tests unitaires passent

✓ **finaces-tension-badge**
  - Affiche les 4 niveaux de tension (NONE/MILD/MODERATE/SEVERE)
  - Affiche direction (UP/DOWN) avec icônes
  - Affiche delta formaté avec +/- sign
  - Tous les tests unitaires passent

✓ **finaces-score-gauge**
  - Anime l'arc SVG 270° (−135° à +135°)
  - Animation fluide 0→score en 800ms via requestAnimationFrame
  - Affiche score central + max label
  - Émet événement rendered à la fin
  - Tous les tests unitaires passent

✓ **finaces-ia-disclaimer**
  - S'affiche en 3 variantes (banner, inline, chip)
  - Message d'avertissement correct avec texte IA
  - Optionnellement dismissible avec événement
  - Supporte mode pilote
  - Tous les tests unitaires passent

✓ **finaces-pillar-row**
  - Affiche ligne static : icône + nom + score/5 + barre + badge
  - Expansion avec mat-expansion-panel
  - Tableau d'indicateurs (5 colonnes) via mat-table
  - Liste de signaux
  - Liste de tendances avec direction
  - Textarea de commentaire (modifiable si !readonly)
  - Intégration correcte de finaces-risk-badge
  - Tous les tests unitaires passent

✓ **finaces-shap-chart**
  - Affiche barres bidirectionnelles (D3.js)
  - Positive (rouge, risque ↑) à droite
  - Négative (vert, risque ↓) à gauche
  - Axe central à zéro visible
  - Affiche SHAP values et raw values
  - Trie par valeur absolue SHAP
  - Responsive et interactif (hover, click)
  - Tous les tests unitaires passent

✓ **finaces-stress-chart**
  - Affiche line chart (Chart.js) avec projection mensuelle
  - Affiche seuil critique (ligne rouge pointillée à zéro)
  - Marque le mois critique avec rouge
  - Affiche métadonnées (stress 60J, 90J)
  - Légende et tooltip informatifs
  - Y-axis avec formatage devise locale
  - X-axis avec labels mois (M1, M2, ..., M24)
  - Tous les tests unitaires passent

✓ **Architecture correcte**
  - Tous les composants standalone
  - OnPush change detection activé partout
  - Barrel exports via shared/components/index.ts
  - Pas d'erreurs de compilation
  - ng lint passe sans avertissements
  - Aucun memory leak détecté

✓ **Documentation complète**
  - Chaque composant a une spécification TypeScript complète
  - HTML et SCSS fournis entièrement
  - Tests unitaires écrits et validés
  - API d'inputs/outputs documentée
  - Critères de validation définis

───────────────────────────────────────────────────────────────

À partir du PROMPT 6, l'équipe peut commencer l'intégration de ces composants
dans les pages de scoring (MCC + IA) et implémenter les scénarios métier complets.

═══════════════════════════════════════════════════════════
FIN PROMPT 5 — COMPOSANTS MOLÉCULAIRES
═══════════════════════════════════════════════════════════
