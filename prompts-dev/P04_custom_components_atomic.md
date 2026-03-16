═══════════════════════════════════════════════════════════
PROMPT 4 — COMPOSANTS ATOMIQUES (FINACES)
Dépend de : PROMPT 3 (App Shell + Routing)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

Phase 1 Design System - Étape 4 : Création des **4 composants atomiques** réutilisables qui constituent
les briques élémentaires du système FinaCES.

Ces composants sont **indépendants, sans dépendances internes** (ne s'appellent pas entre eux).
Chaque composant expose une API stricte en inputs/outputs et supporte les deux rails de scoring :
- **MCC** (vert→rouge) : scoring officiel, visuellement solide
- **IA** (bleu→violet) : outil de challenge, visuellement transparent/outlined

Les 4 composants :
1. **finaces-risk-badge** : Badge coloré pour afficher une classe de risque (LOW/MODERATE/HIGH/CRITICAL)
2. **finaces-tension-badge** : Badge spécialisé pour afficher le niveau de tension dynamique (NONE/MILD/MODERATE/SEVERE)
3. **finaces-score-gauge** : Jauge SVG circulaire animée (0-5) avec arc progressif
4. **finaces-ia-disclaimer** : Banneau/chip de disclaimer IA (non-décisionnel)

---

## RÈGLES MÉTIER APPLICABLES

### Système de couleurs FinaCES

#### MCC Rail (Solid, High Contrast)
- **LOW** : #22C55E (Emerald 500) + white text
- **MODERATE** : #F59E0B (Amber 500) + white text
- **HIGH** : #F97316 (Orange 500) + white text
- **CRITICAL** : #EF4444 (Red 500) + white text

#### IA Rail (Transparent, Outlined)
- **LOW** : bg=rgba(59, 130, 246, 0.15) + text=#3B82F6 (Blue 500) + border=1px #3B82F6
- **MODERATE** : bg=rgba(99, 102, 241, 0.15) + text=#6366F1 (Indigo 500) + border=1px #6366F1
- **HIGH** : bg=rgba(139, 92, 246, 0.15) + text=#8B5CF6 (Purple 500) + border=1px #8B5CF6
- **CRITICAL** : bg=rgba(168, 85, 247, 0.15) + text=#A855F7 (Violet 500) + border=1px #A855F7

### Tension Levels & Icons

| Level | Icon | Label (FR) | MCC Color | IA Color |
|-------|------|-----------|-----------|----------|
| NONE | ✓ | Convergence | #22C55E | #3B82F6 |
| MILD | ℹ | Tension légère | #3B82F6 | #6366F1 |
| MODERATE | ⚠ | Tension modérée | #F59E0B | #8B5CF6 |
| SEVERE | 🔴 | TENSION MAJEURE | #EF4444 | #A855F7 |

### Design Tokens (Tailwind extended)
```
Spacing: 4px (xs), 8px (sm), 12px (md), 16px (lg), 24px (xl)
Border radius: 4px (xs), 6px (sm), 8px (md), 12px (lg), 16px (xl)
Typography:
  - Label Small: 11px, 500, line-height 1.4
  - Body Small: 12px, 400, line-height 1.5
  - Body Base: 14px, 400, line-height 1.5
  - Score Large: 28px, 700, line-height 1.2
```

### Angular Constraints
- Standalone components mandatory
- ChangeDetectionStrategy.OnPush for all
- OnInit → ngOnChanges for reactive updates
- No template references, no @ViewChild
- Material icons where applicable
- Optional D3.js for SVG (score-gauge)

---

## FICHIERS À CRÉER / MODIFIER

### Arborescence finale (Phase 4)

```
src/app/shared/
├── components/
│   ├── finaces-risk-badge/
│   │   ├── finaces-risk-badge.component.ts
│   │   ├── finaces-risk-badge.component.html
│   │   ├── finaces-risk-badge.component.scss
│   │   └── finaces-risk-badge.component.spec.ts
│   ├── finaces-tension-badge/
│   │   ├── finaces-tension-badge.component.ts
│   │   ├── finaces-tension-badge.component.html
│   │   ├── finaces-tension-badge.component.scss
│   │   └── finaces-tension-badge.component.spec.ts
│   ├── finaces-score-gauge/
│   │   ├── finaces-score-gauge.component.ts
│   │   ├── finaces-score-gauge.component.html
│   │   ├── finaces-score-gauge.component.scss
│   │   └── finaces-score-gauge.component.spec.ts
│   ├── finaces-ia-disclaimer/
│   │   ├── finaces-ia-disclaimer.component.ts
│   │   ├── finaces-ia-disclaimer.component.html
│   │   ├── finaces-ia-disclaimer.component.scss
│   │   └── finaces-ia-disclaimer.component.spec.ts
│   └── index.ts (barrel export)
└── ...
```

### Modifications à PROMPT 3 (App Shell)
Ajouter à `shared/components/index.ts` :
```typescript
export * from './finaces-risk-badge/finaces-risk-badge.component';
export * from './finaces-tension-badge/finaces-tension-badge.component';
export * from './finaces-score-gauge/finaces-score-gauge.component';
export * from './finaces-ia-disclaimer/finaces-ia-disclaimer.component';
```

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. FinacesRiskBadgeComponent

**Objectif** : Afficher une classe de risque dans un badge coloré. Deux styles distincts : MCC (solid) et IA (outlined).

#### TypeScript Specification

```typescript
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type RiskClass = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Rail = 'MCC' | 'IA';

interface RiskColorScheme {
  mcc: { bg: string; text: string };
  ia: { bg: string; text: string; border: string };
  label: string;
  icon?: string;
}

@Component({
  selector: 'finaces-risk-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './finaces-risk-badge.component.html',
  styleUrls: ['./finaces-risk-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesRiskBadgeComponent implements OnChanges {
  @Input({ required: true }) riskClass: RiskClass = 'LOW';
  @Input() rail: Rail = 'MCC';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() showLabel: boolean = true;
  @Input() showIcon: boolean = false;

  colorScheme: RiskColorScheme | null = null;
  isMcc: boolean = true;

  private readonly colorMap: Record<RiskClass, RiskColorScheme> = {
    LOW: {
      mcc: { bg: '#22C55E', text: '#FFFFFF' },
      ia: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', border: '#3B82F6' },
      label: 'Faible',
      icon: 'check_circle'
    },
    MODERATE: {
      mcc: { bg: '#F59E0B', text: '#FFFFFF' },
      ia: { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1', border: '#6366F1' },
      label: 'Modéré',
      icon: 'warning'
    },
    HIGH: {
      mcc: { bg: '#F97316', text: '#FFFFFF' },
      ia: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6', border: '#8B5CF6' },
      label: 'Élevé',
      icon: 'error'
    },
    CRITICAL: {
      mcc: { bg: '#EF4444', text: '#FFFFFF' },
      ia: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7', border: '#A855F7' },
      label: 'Critique',
      icon: 'crisis_alert'
    }
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['riskClass'] || changes['rail']) {
      this.updateColorScheme();
    }
  }

  private updateColorScheme(): void {
    this.colorScheme = this.colorMap[this.riskClass] || this.colorMap.LOW;
    this.isMcc = this.rail === 'MCC';
    this.cdr.markForCheck();
  }

  get badgeClasses(): string {
    const sizeClass = this.size === 'sm' ? 'badge-sm' : 'badge-md';
    const railClass = this.isMcc ? 'badge-mcc' : 'badge-ia';
    return `finaces-badge ${sizeClass} ${railClass}`;
  }

  get badgeStyle(): Record<string, string> {
    if (!this.colorScheme) return {};

    if (this.isMcc) {
      return {
        'background-color': this.colorScheme.mcc.bg,
        color: this.colorScheme.mcc.text
      };
    } else {
      return {
        'background-color': this.colorScheme.ia.bg,
        color: this.colorScheme.ia.text,
        'border-color': this.colorScheme.ia.border
      };
    }
  }
}
```

#### HTML Template

```html
<span [ngClass]="badgeClasses" [ngStyle]="badgeStyle">
  <mat-icon *ngIf="showIcon && colorScheme?.icon" class="badge-icon">
    {{ colorScheme.icon }}
  </mat-icon>
  <span class="badge-prefix" *ngIf="!isMcc && showLabel">IA</span>
  <span class="badge-label" *ngIf="showLabel">
    {{ colorScheme?.label }}
  </span>
</span>
```

#### SCSS Styles

```scss
.finaces-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  border-radius: 6px;
  white-space: nowrap;
  transition: all 150ms ease-in-out;

  &.badge-mcc {
    border: 1px solid transparent;
  }

  &.badge-ia {
    border: 1px solid;
  }

  &.badge-sm {
    height: 20px;
    padding: 2px 8px;
    font-size: 11px;
    line-height: 1.4;
  }

  &.badge-md {
    height: 24px;
    padding: 4px 12px;
    font-size: 12px;
    line-height: 1.5;
  }

  .badge-icon {
    font-size: 14px;
    width: 14px;
    height: 14px;
    margin-right: 2px;
  }

  .badge-prefix {
    font-size: 10px;
    font-weight: 600;
    margin-right: 2px;
    opacity: 0.8;
  }

  .badge-label {
    white-space: nowrap;
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesRiskBadgeComponent } from './finaces-risk-badge.component';

describe('FinacesRiskBadgeComponent', () => {
  let component: FinacesRiskBadgeComponent;
  let fixture: ComponentFixture<FinacesRiskBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesRiskBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesRiskBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display LOW risk with MCC colors', () => {
    component.riskClass = 'LOW';
    component.rail = 'MCC';
    component.ngOnChanges({
      riskClass: {} as any,
      rail: {} as any
    });
    expect(component.colorScheme?.label).toBe('Faible');
    expect(component.isMcc).toBeTrue();
  });

  it('should display CRITICAL risk with IA colors', () => {
    component.riskClass = 'CRITICAL';
    component.rail = 'IA';
    component.ngOnChanges({
      riskClass: {} as any,
      rail: {} as any
    });
    expect(component.colorScheme?.label).toBe('Critique');
    expect(component.isMcc).toBeFalse();
  });

  it('should render size sm with correct classes', () => {
    component.size = 'sm';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.badge-sm');
    expect(badge).toBeTruthy();
  });

  it('should hide label when showLabel is false', () => {
    component.showLabel = false;
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.badge-label');
    expect(label).toBeFalsy();
  });
});
```

---

### 2. FinacesTensionBadgeComponent

**Objectif** : Afficher un niveau de tension dynamique avec direction et delta (variation).
Quatre états : NONE (convergence), MILD (légère), MODERATE (modérée), SEVERE (majeure).

#### TypeScript Specification

```typescript
import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type TensionLevel = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
export type Direction = 'UP' | 'DOWN';

interface TensionScheme {
  icon: string;
  labelFr: string;
  bgColor: string;
  textColor: string;
  borderColor?: string;
}

@Component({
  selector: 'finaces-tension-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './finaces-tension-badge.component.html',
  styleUrls: ['./finaces-tension-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesTensionBadgeComponent implements OnChanges {
  @Input({ required: true }) level: TensionLevel = 'NONE';
  @Input() direction?: Direction;
  @Input() delta?: number;
  @Input() size: 'sm' | 'md' = 'md';

  tensionScheme: TensionScheme | null = null;
  displayDelta: string = '';
  directionIcon: string = '';

  private readonly schemeMap: Record<TensionLevel, TensionScheme> = {
    NONE: {
      icon: 'check_circle',
      labelFr: 'Convergence',
      bgColor: '#22C55E',
      textColor: '#FFFFFF'
    },
    MILD: {
      icon: 'info',
      labelFr: 'Tension légère',
      bgColor: '#3B82F6',
      textColor: '#FFFFFF'
    },
    MODERATE: {
      icon: 'warning',
      labelFr: 'Tension modérée',
      bgColor: '#F59E0B',
      textColor: '#FFFFFF'
    },
    SEVERE: {
      icon: 'crisis_alert',
      labelFr: 'TENSION MAJEURE',
      bgColor: '#EF4444',
      textColor: '#FFFFFF',
      borderColor: '#DC2626'
    }
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['level'] || changes['direction'] || changes['delta']) {
      this.updateScheme();
    }
  }

  private updateScheme(): void {
    this.tensionScheme = this.schemeMap[this.level] || this.schemeMap.NONE;

    // Format delta
    if (this.delta !== undefined && this.delta !== null) {
      const sign = this.delta > 0 ? '+' : '';
      this.displayDelta = `${sign}${this.delta.toFixed(2)}`;
    }

    // Direction icon
    this.directionIcon =
      this.direction === 'UP' ? 'trending_up' : 'trending_down';

    this.cdr.markForCheck();
  }

  get badgeClasses(): string {
    const sizeClass = this.size === 'sm' ? 'tension-sm' : 'tension-md';
    const severityClass = `tension-${this.level.toLowerCase()}`;
    return `finaces-tension ${sizeClass} ${severityClass}`;
  }

  get badgeStyle(): Record<string, string> {
    if (!this.tensionScheme) return {};
    return {
      'background-color': this.tensionScheme.bgColor,
      color: this.tensionScheme.textColor,
      'border-color': this.tensionScheme.borderColor || 'transparent'
    };
  }

  get showDirectionDelta(): boolean {
    return (this.direction !== undefined || this.delta !== undefined) &&
           this.level !== 'NONE';
  }
}
```

#### HTML Template

```html
<div [ngClass]="badgeClasses" [ngStyle]="badgeStyle">
  <mat-icon class="tension-icon">{{ tensionScheme?.icon }}</mat-icon>
  <span class="tension-label">{{ tensionScheme?.labelFr }}</span>

  <span *ngIf="showDirectionDelta" class="tension-delta">
    <mat-icon *ngIf="direction" class="delta-arrow">
      {{ directionIcon }}
    </mat-icon>
    <span *ngIf="delta !== undefined" class="delta-value">
      {{ displayDelta }}
    </span>
  </span>
</div>
```

#### SCSS Styles

```scss
.finaces-tension {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 150ms ease-in-out;

  &.tension-sm {
    height: 20px;
    padding: 2px 8px;
    font-size: 11px;
  }

  &.tension-md {
    height: 28px;
    padding: 4px 12px;
    font-size: 13px;
  }

  &.tension-severe {
    border: 1px solid;
    background-image: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.1),
      rgba(239, 68, 68, 0.05)
    );
  }

  .tension-icon {
    font-size: 16px;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tension-label {
    white-space: nowrap;
    flex: 1;
  }

  .tension-delta {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: 4px;
    padding-left: 4px;
    border-left: 1px solid currentColor;
    opacity: 0.85;

    .delta-arrow {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .delta-value {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesTensionBadgeComponent } from './finaces-tension-badge.component';

describe('FinacesTensionBadgeComponent', () => {
  let component: FinacesTensionBadgeComponent;
  let fixture: ComponentFixture<FinacesTensionBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesTensionBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesTensionBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display NONE level with convergence icon', () => {
    component.level = 'NONE';
    component.ngOnChanges({
      level: {} as any
    });
    expect(component.tensionScheme?.labelFr).toBe('Convergence');
  });

  it('should display delta with direction UP', () => {
    component.level = 'MODERATE';
    component.delta = 0.15;
    component.direction = 'UP';
    component.ngOnChanges({
      level: {} as any,
      delta: {} as any,
      direction: {} as any
    });
    expect(component.displayDelta).toBe('+0.15');
    expect(component.directionIcon).toBe('trending_up');
  });

  it('should display negative delta with direction DOWN', () => {
    component.level = 'MILD';
    component.delta = -0.08;
    component.direction = 'DOWN';
    component.ngOnChanges({
      level: {} as any,
      delta: {} as any,
      direction: {} as any
    });
    expect(component.displayDelta).toBe('-0.08');
    expect(component.directionIcon).toBe('trending_down');
  });
});
```

---

### 3. FinacesScoreGaugeComponent

**Objectif** : Jauge SVG circulaire animée (270°, -135° à +135°).
Arc de progression colorée selon la classe de risque.
Animation fluide 0→score en 800ms avec requestAnimationFrame.

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
  ViewEncapsulation,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type GaugeSize = 80 | 120 | 160;

interface GaugeMetrics {
  size: number;
  cx: number;
  cy: number;
  radius: number;
  arcRadius: number;
}

@Component({
  selector: 'finaces-score-gauge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finaces-score-gauge.component.html',
  styleUrls: ['./finaces-score-gauge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FinacesScoreGaugeComponent implements OnChanges {
  @Input({ required: true }) score: number = 0;
  @Input() maxScore: number = 5;
  @Input() rail: 'MCC' | 'IA' = 'MCC';
  @Input() riskClass?: string;
  @Input() size: GaugeSize = 120;
  @Input() animated: boolean = true;
  @Input() showLabel: boolean = true;

  @Output() rendered = new EventEmitter<void>();

  metrics: GaugeMetrics | null = null;
  arcPath: string = '';
  backgroundColor: string = '';
  arcColor: string = '';
  displayScore: number = 0;
  displayScoreStr: string = '0.0';
  animationId: number | null = null;

  private readonly colorMap = {
    MCC: {
      LOW: '#22C55E',
      MODERATE: '#F59E0B',
      HIGH: '#F97316',
      CRITICAL: '#EF4444'
    },
    IA: {
      LOW: '#3B82F6',
      MODERATE: '#6366F1',
      HIGH: '#8B5CF6',
      CRITICAL: '#A855F7'
    }
  };

  private readonly backgroundArc = '#E2E8F0';
  private readonly startAngle = -135;
  private readonly totalArcAngle = 270;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.initializeMetrics(120);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size']) {
      this.initializeMetrics(this.size);
    }

    if (changes['score'] || changes['riskClass'] || changes['rail']) {
      this.backgroundColor = this.backgroundArc;
      this.updateArcColor();
      this.updateBackground();
      this.startAnimation();
    }
  }

  private initializeMetrics(size: GaugeSize): void {
    const padding = size / 10;
    this.metrics = {
      size,
      cx: size / 2,
      cy: size / 2,
      radius: size / 2 - padding,
      arcRadius: (size / 2 - padding) * 0.75
    };
  }

  private updateArcColor(): void {
    const colorKey = this.riskClass?.toUpperCase() || 'MODERATE';
    const railColors = this.rail === 'MCC'
      ? this.colorMap.MCC
      : this.colorMap.IA;
    this.arcColor = (railColors as any)[colorKey] || railColors.MODERATE;
  }

  private updateBackground(): void {
    if (!this.metrics) return;

    const { cx, cy, arcRadius } = this.metrics;
    const startRad = this.degToRad(this.startAngle);
    const endRad = this.degToRad(this.startAngle + this.totalArcAngle);

    const x1 = cx + arcRadius * Math.cos(startRad);
    const y1 = cy + arcRadius * Math.sin(startRad);
    const x2 = cx + arcRadius * Math.cos(endRad);
    const y2 = cy + arcRadius * Math.sin(endRad);

    const largeArc = this.totalArcAngle > 180 ? 1 : 0;

    this.arcPath = `
      M ${x1} ${y1}
      A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}
    `;
  }

  private startAnimation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (!this.animated) {
      this.displayScore = this.score;
      this.displayScoreStr = this.score.toFixed(1);
      this.cdr.markForCheck();
      return;
    }

    const startTime = performance.now();
    const duration = 800;
    const startScore = 0;
    const endScore = this.score;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.displayScore = startScore + (endScore - startScore) * progress;
      this.displayScoreStr = this.displayScore.toFixed(1);

      this.cdr.markForCheck();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
        this.rendered.emit();
      }
    };

    this.ngZone.runOutsideAngular(() => {
      this.animationId = requestAnimationFrame(animate);
    });
  }

  private degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  getProgressPath(): string {
    if (!this.metrics) return '';

    const { cx, cy, arcRadius } = this.metrics;
    const progressPercent = this.displayScore / this.maxScore;
    const angleSpan = this.totalArcAngle * progressPercent;
    const endAngle = this.startAngle + angleSpan;

    const startRad = this.degToRad(this.startAngle);
    const endRad = this.degToRad(endAngle);

    const x1 = cx + arcRadius * Math.cos(startRad);
    const y1 = cy + arcRadius * Math.sin(startRad);
    const x2 = cx + arcRadius * Math.cos(endRad);
    const y2 = cy + arcRadius * Math.sin(endRad);

    const largeArc = angleSpan > 180 ? 1 : 0;

    return `
      M ${x1} ${y1}
      A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}
    `;
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
```

#### HTML Template

```html
<div class="finaces-gauge" [style.width.px]="metrics?.size" [style.height.px]="metrics?.size">
  <svg
    [attr.viewBox]="'0 0 ' + metrics?.size + ' ' + metrics?.size"
    [attr.width]="metrics?.size"
    [attr.height]="metrics?.size"
    class="gauge-svg"
  >
    <!-- Background arc -->
    <path
      [attr.d]="arcPath"
      [attr.stroke]="backgroundColor"
      stroke-width="6"
      fill="none"
      stroke-linecap="round"
    />

    <!-- Progress arc -->
    <path
      [attr.d]="getProgressPath()"
      [attr.stroke]="arcColor"
      stroke-width="6"
      fill="none"
      stroke-linecap="round"
      class="progress-arc"
    />

    <!-- Center text -->
    <text
      *ngIf="showLabel"
      [attr.x]="metrics?.cx"
      [attr.y]="metrics?.cy - 8"
      text-anchor="middle"
      class="gauge-score-value"
    >
      {{ displayScoreStr }}
    </text>
    <text
      *ngIf="showLabel"
      [attr.x]="metrics?.cx"
      [attr.y]="metrics?.cy + 14"
      text-anchor="middle"
      class="gauge-max-label"
    >
      / {{ maxScore }}
    </text>
  </svg>
</div>
```

#### SCSS Styles

```scss
.finaces-gauge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .gauge-svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));

    .progress-arc {
      transition: stroke 200ms ease-in-out;
      animation: gauge-pulse 1.2s ease-in-out forwards;
    }

    .gauge-score-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      fill: #1e293b;
    }

    .gauge-max-label {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.5;
      fill: #64748b;
    }
  }
}

@keyframes gauge-pulse {
  0% {
    stroke-width: 4px;
    opacity: 0;
  }
  50% {
    stroke-width: 8px;
  }
  100% {
    stroke-width: 6px;
    opacity: 1;
  }
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FinacesScoreGaugeComponent } from './finaces-score-gauge.component';

describe('FinacesScoreGaugeComponent', () => {
  let component: FinacesScoreGaugeComponent;
  let fixture: ComponentFixture<FinacesScoreGaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinacesScoreGaugeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesScoreGaugeComponent);
    component = fixture.componentInstance;
  });

  it('should create with default size 120', () => {
    expect(component).toBeTruthy();
    expect(component.metrics?.size).toBe(120);
  });

  it('should initialize correct metrics for different sizes', () => {
    component.size = 80;
    component.ngOnChanges({ size: {} as any });
    expect(component.metrics?.size).toBe(80);

    component.size = 160;
    component.ngOnChanges({ size: {} as any });
    expect(component.metrics?.size).toBe(160);
  });

  it('should animate score from 0 to target', fakeAsync(() => {
    component.score = 3.5;
    component.animated = true;
    component.ngOnChanges({
      score: {} as any,
      riskClass: {} as any,
      rail: {} as any
    });

    expect(component.displayScore).toBe(0);

    tick(400);
    expect(component.displayScore).toBeGreaterThan(1.5);
    expect(component.displayScore).toBeLessThan(2.5);

    tick(400);
    expect(component.displayScore).toBeCloseTo(3.5, 0.1);
  }));

  it('should display score instantly when animated=false', () => {
    component.score = 4.2;
    component.animated = false;
    component.ngOnChanges({
      score: {} as any,
      riskClass: {} as any,
      rail: {} as any
    });

    expect(component.displayScore).toBe(4.2);
  });

  it('should emit rendered when animation completes', fakeAsync(() => {
    spyOn(component.rendered, 'emit');
    component.score = 3.0;
    component.animated = true;
    component.ngOnChanges({
      score: {} as any,
      riskClass: {} as any,
      rail: {} as any
    });

    tick(800);

    expect(component.rendered.emit).toHaveBeenCalled();
  }));

  it('should generate correct progress path', () => {
    component.displayScore = 2.5;
    component.maxScore = 5;
    component.ngOnChanges({
      riskClass: {} as any,
      rail: {} as any
    });

    const path = component.getProgressPath();
    expect(path).toBeTruthy();
    expect(path).toContain('M');
    expect(path).toContain('A');
  });
});
```

---

### 4. FinacesIaDisclaimerComponent

**Objectif** : Disclaimer IA affiché en haut de chaque page IA.
Trois variantes : banner (large, en haut), inline (compact), chip (une ligne).
Optionnellement dismissible avec événement.

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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type DisclaimerVariant = 'banner' | 'inline' | 'chip';

@Component({
  selector: 'finaces-ia-disclaimer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './finaces-ia-disclaimer.component.html',
  styleUrls: ['./finaces-ia-disclaimer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesIaDisclaimerComponent {
  @Input() variant: DisclaimerVariant = 'banner';
  @Input() dismissible: boolean = false;
  @Input() pilotMode: boolean = false;

  @Output() dismissed = new EventEmitter<void>();

  isDismissed: boolean = false;

  readonly disclaimerText =
    'Ce scoring IA est un outil de challenge NON DÉCISIONNEL. ' +
    'Il ne remplace pas le score MCC.';

  readonly pilotModeText =
    'Mode pilote IA : résultats expérimentaux, à titre informatif uniquement.';

  constructor(private cdr: ChangeDetectorRef) {}

  onDismiss(): void {
    this.isDismissed = true;
    this.dismissed.emit();
    this.cdr.markForCheck();
  }

  get containerClasses(): string {
    return `ia-disclaimer ia-${this.variant}`;
  }
}
```

#### HTML Template

```html
<div
  *ngIf="!isDismissed"
  [ngClass]="containerClasses"
  role="alert"
  aria-live="polite"
>
  <div class="disclaimer-content">
    <mat-icon class="disclaimer-icon">info</mat-icon>

    <div class="disclaimer-text-section">
      <p class="disclaimer-main">{{ disclaimerText }}</p>
      <p *ngIf="pilotMode" class="disclaimer-pilot">
        {{ pilotModeText }}
      </p>
    </div>

    <button
      *ngIf="dismissible"
      mat-icon-button
      (click)="onDismiss()"
      class="dismiss-button"
      aria-label="Fermer le disclaimer"
    >
      <mat-icon>close</mat-icon>
    </button>
  </div>
</div>
```

#### SCSS Styles

```scss
.ia-disclaimer {
  display: flex;
  align-items: flex-start;
  font-family: inherit;
  transition: all 200ms ease-in-out;

  &.ia-banner {
    width: 100%;
    padding: 12px 16px;
    background-color: rgba(99, 102, 241, 0.08);
    border-left: 3px solid #6366F1;
    border-radius: 4px;
    margin-bottom: 16px;

    .disclaimer-content {
      display: flex;
      gap: 12px;
      width: 100%;
      align-items: flex-start;
    }

    .disclaimer-icon {
      color: #6366F1;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .disclaimer-text-section {
      flex: 1;

      p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: #334155;

        &.disclaimer-main {
          font-weight: 500;
          color: #1e293b;
        }

        &.disclaimer-pilot {
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
          font-style: italic;
        }
      }
    }

    .dismiss-button {
      margin-left: auto;
      flex-shrink: 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
      }

      &:hover {
        background-color: rgba(99, 102, 241, 0.1);
      }
    }
  }

  &.ia-inline {
    padding: 8px 12px;
    background-color: rgba(99, 102, 241, 0.06);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 4px;
    font-size: 12px;
    color: #475569;

    .disclaimer-content {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .disclaimer-icon {
      color: #6366F1;
      font-size: 16px;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .disclaimer-text-section {
      flex: 1;

      p {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: #475569;

        &.disclaimer-pilot {
          display: none;
        }
      }
    }

    .dismiss-button {
      padding: 0;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
  }

  &.ia-chip {
    display: inline-flex;
    padding: 4px 12px;
    background-color: rgba(99, 102, 241, 0.12);
    border: 1px solid #6366F1;
    border-radius: 12px;
    font-size: 11px;
    color: #6366F1;
    font-weight: 500;

    .disclaimer-content {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .disclaimer-icon {
      color: #6366F1;
      font-size: 14px;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .disclaimer-text-section {
      p {
        margin: 0;
        font-size: 11px;
        line-height: 1.3;
        white-space: nowrap;

        &.disclaimer-pilot {
          display: none;
        }
      }
    }

    .dismiss-button {
      padding: 0;
      margin-left: 4px;

      mat-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }
  }

  &.ia-banner + .ia-banner {
    margin-top: 8px;
  }
}

/* Accessibility: high contrast mode */
@media (prefers-contrast: more) {
  .ia-disclaimer {
    border-width: 2px;

    &.ia-banner {
      border-left-width: 4px;
    }
  }
}

/* Animation: slide-in on mount */
@keyframes disclaimer-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ia-disclaimer {
  animation: disclaimer-slide-in 300ms ease-out;
}
```

#### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesIaDisclaimerComponent } from './finaces-ia-disclaimer.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

describe('FinacesIaDisclaimerComponent', () => {
  let component: FinacesIaDisclaimerComponent;
  let fixture: ComponentFixture<FinacesIaDisclaimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinacesIaDisclaimerComponent,
        MatIconModule,
        MatButtonModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FinacesIaDisclaimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display banner variant', () => {
    component.variant = 'banner';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ia-banner');
    expect(el).toBeTruthy();
  });

  it('should display inline variant', () => {
    component.variant = 'inline';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ia-inline');
    expect(el).toBeTruthy();
  });

  it('should display chip variant', () => {
    component.variant = 'chip';
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.ia-chip');
    expect(el).toBeTruthy();
  });

  it('should show pilot mode text when enabled', () => {
    component.variant = 'banner';
    component.pilotMode = true;
    fixture.detectChanges();
    const pilotText = fixture.nativeElement.querySelector('.disclaimer-pilot');
    expect(pilotText).toBeTruthy();
  });

  it('should emit dismissed event when dismissed', () => {
    spyOn(component.dismissed, 'emit');
    component.variant = 'banner';
    component.dismissible = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.dismiss-button');
    button.click();

    expect(component.dismissed.emit).toHaveBeenCalled();
  });

  it('should hide disclaimer when dismissed', () => {
    component.variant = 'banner';
    component.dismissible = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.dismiss-button');
    button.click();
    fixture.detectChanges();

    const disclaimer = fixture.nativeElement.querySelector('.ia-disclaimer');
    expect(disclaimer).toBeFalsy();
  });
});
```

---

## CONTRAINTES ANGULAR

1. **Standalone mandatory** : Tous les composants sont déclarés avec `standalone: true`.
2. **OnPush change detection** : Tous utilisent `ChangeDetectionStrategy.OnPush` pour optimiser la performance.
3. **No @ViewChild** : Gestion de l'état uniquement via inputs/outputs/signals.
4. **Proper cleanup** : Les composants avec animations (`FinacesScoreGaugeComponent`) nettoient les `requestAnimationFrame` dans `ngOnDestroy`.
5. **Zone.runOutsideAngular()** : L'animation SVG s'exécute hors de la zone Angular pour éviter les cycles de détection.
6. **CommonModule** : Tous les composants importent `CommonModule` pour *ngIf, *ngFor, etc.
7. **Material Icons** : Intégration native via `MatIconModule` (inclus dans chaque composant).

---

## BINDING API

### FinacesRiskBadgeComponent
```typescript
// Usage
<finaces-risk-badge
  [riskClass]="'CRITICAL'"
  [rail]="'MCC'"
  [size]="'md'"
  [showLabel]="true"
  [showIcon]="false"
></finaces-risk-badge>
```

### FinacesTensionBadgeComponent
```typescript
// Usage
<finaces-tension-badge
  [level]="'SEVERE'"
  [direction]="'UP'"
  [delta]="0.15"
  [size]="'md'"
></finaces-tension-badge>
```

### FinacesScoreGaugeComponent
```typescript
// Usage
<finaces-score-gauge
  [score]="3.5"
  [maxScore]="5"
  [rail]="'MCC'"
  [riskClass]="'HIGH'"
  [size]="120"
  [animated]="true"
  [showLabel]="true"
  (rendered)="onGaugeRendered()"
></finaces-score-gauge>
```

### FinacesIaDisclaimerComponent
```typescript
// Usage
<finaces-ia-disclaimer
  [variant]="'banner'"
  [dismissible]="true"
  [pilotMode]="false"
  (dismissed)="onDisclaimerClosed()"
></finaces-ia-disclaimer>
```

---

## CRITÈRES DE VALIDATION

### ✓ Validation visuelle (QA manual)
- [ ] finaces-risk-badge affiche toutes les couleurs MCC (4 classes × 2 tailles)
- [ ] finaces-risk-badge affiche toutes les couleurs IA (4 classes × outlined + border)
- [ ] finaces-tension-badge affiche les 4 niveaux avec icônes correctes
- [ ] finaces-tension-badge affiche direction UP/DOWN avec delta formaté
- [ ] finaces-score-gauge anime l'arc de 0 à score en 800ms
- [ ] finaces-score-gauge affiche le label central "X.X / 5"
- [ ] finaces-ia-disclaimer affiche banner/inline/chip sans rejet
- [ ] finaces-ia-disclaimer dismissible masque le contenu après click

### ✓ Validation technique
- [ ] Tous les composants exportés depuis `shared/components/index.ts`
- [ ] Pas d'erreurs de compilation `ng build`
- [ ] Tous les tests unitaires passent `ng test`
- [ ] OnPush et standalone activés sur chaque composant
- [ ] Material icons chargés correctement
- [ ] Pas d'avertissements ng lint

### ✓ Validation de performance
- [ ] Pas de memory leaks (requestAnimationFrame canceled)
- [ ] Animations fluides (60 FPS)
- [ ] Temps de rendu < 16ms par composant

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

```
src/app/shared/
├── components/
│   ├── finaces-risk-badge/
│   │   ├── finaces-risk-badge.component.ts
│   │   ├── finaces-risk-badge.component.html
│   │   ├── finaces-risk-badge.component.scss
│   │   └── finaces-risk-badge.component.spec.ts
│   ├── finaces-tension-badge/
│   │   ├── finaces-tension-badge.component.ts
│   │   ├── finaces-tension-badge.component.html
│   │   ├── finaces-tension-badge.component.scss
│   │   └── finaces-tension-badge.component.spec.ts
│   ├── finaces-score-gauge/
│   │   ├── finaces-score-gauge.component.ts
│   │   ├── finaces-score-gauge.component.html
│   │   ├── finaces-score-gauge.component.scss
│   │   └── finaces-score-gauge.component.spec.ts
│   ├── finaces-ia-disclaimer/
│   │   ├── finaces-ia-disclaimer.component.ts
│   │   ├── finaces-ia-disclaimer.component.html
│   │   ├── finaces-ia-disclaimer.component.scss
│   │   └── finaces-ia-disclaimer.component.spec.ts
│   └── index.ts (UPDATED avec exports)
└── ...
```

═══════════════════════════════════════════════════════════
FIN PROMPT 4 — COMPOSANTS ATOMIQUES
═══════════════════════════════════════════════════════════
