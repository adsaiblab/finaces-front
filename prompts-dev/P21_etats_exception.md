═══════════════════════════════════════════════════════════════════════════════
PROMPT 21 — États d'exception (IA indisponible + mode pilote + empty states +
                               skeleton loaders + erreurs inline)
Dépend de : PROMPT 20 (Guards Angular)
Peut être parallélisé avec : PROMPT 22 (Responsive Tablet) partiellement
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

Tout système a des cas d'erreur, absence de données ou états transitoires.
FinaCES doit les gérer élégamment et sans friction utilisateur:

1. **IA Unavailable** — Modèle IA indisponible (crash, erreur API)
   → Afficher component réutilisable, fallback sur MCC
   → Tension marquée "N/A"

2. **Pilot Mode** — Flag backend pilot_mode=true
   → Banner warning sur tous blocs IA
   → Modèle en mode TEST only

3. **Empty States** — Aucune donnée (pas de dossiers, pas de tensions, etc.)
   → 5 variantes avec icônes et texte
   → CTA [Créer], [Retour], etc.

4. **Skeleton Loaders** — Chargement API en cours
   → Shimmer placeholders (ngx-skeleton-loader)
   → Plusieurs variantes (gauge, table, chart)

5. **Inline Errors** — Erreur dans une section spécifique
   → error_outline icon + message + retry button
   → Réutilisable dans tous blocs

Ces états garantissent une UX fluide même en conditions dégradées.

## RÈGLES MÉTIER APPLICABLES

**MCC-R3 — Disclaimer sur IA:**
Si IA indisponible: disclaimer "Le scoring MCC reste l'unique source décisionnelle"
reste visible (avec note: IA N/A).

**Pilot Mode Flag:**
- Backend: endpoint GET /api/v1/config/pilot-mode → {pilot_mode: boolean}
- Frontend: AppConfigService caches ce flag
- Si true: banner affichée sur TOUS blocs IA (P13)
- Modèles: seulement models avec status='TEST' affichés en /admin/ia

**Error Recovery:**
- Inline errors must have [Réessayer] button
- Click → re-trigger same API call
- Max 3 retries before showing "Contactez support"

**Loading States:**
- Skeleton loaders pendant API calls (<2s expect)
- Spinner (mat-spinner) si API call > 2s

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/shared/components/finaces-ia-unavailable/finaces-ia-unavailable.component.ts|html|scss`
- `src/app/shared/components/finaces-empty-state/finaces-empty-state.component.ts|html|scss`
- `src/app/shared/components/finaces-skeleton-loader/finaces-skeleton-loader.component.ts|html|scss`
- `src/app/shared/components/finaces-inline-error/finaces-inline-error.component.ts|html|scss`
- `src/app/shared/components/finaces-pilot-mode-banner/finaces-pilot-mode-banner.component.ts|html|scss`
- `src/app/core/services/app-config.service.ts` (new or extend existing)

**Modifier:**
- All case bloc templates (P6-P17): integrate skeleton loaders + inline errors
- Bloc 7 IA template (P13): add finaces-ia-unavailable + finaces-pilot-mode-banner
- Cases list template: add finaces-empty-state variant

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. IA Unavailable Component

**Use Case:**
IA API unavailable → show graceful fallback, don't block MCC.

**Component: finaces-ia-unavailable**

```html
<!-- src/app/shared/components/finaces-ia-unavailable/finaces-ia-unavailable.component.html -->

<div class="ia-unavailable-container">
  <div class="ia-unavailable-content">
    <mat-icon class="ia-icon">smart_toy</mat-icon>

    <h3>Scoring IA non disponible</h3>

    <p class="description">
      L'outil de scoring IA est temporairement indisponible.
      Le scoring MCC reste l'unique source décisionnelle.
    </p>

    <div class="alert-disclaimer">
      <mat-icon>info</mat-icon>
      <span>
        Le scoring IA est un outil d'aide à la décision, non décisionnel.
        Le score MCC reste l'unique source d'approbation.
      </span>
    </div>

    <div class="actions">
      <button mat-raised-button (click)="onRetry()" [disabled]="isRetrying">
        <mat-icon *ngIf="!isRetrying">refresh</mat-icon>
        <mat-spinner *ngIf="isRetrying" diameter="20"></mat-spinner>
        Réessayer
      </button>
    </div>

    <p class="error-details" *ngIf="errorMessage">
      <strong>Erreur:</strong> {{ errorMessage }}
    </p>
  </div>
</div>
```

```typescript
// src/app/shared/components/finaces-ia-unavailable/finaces-ia-unavailable.component.ts

import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-finaces-ia-unavailable',
  templateUrl: './finaces-ia-unavailable.component.html',
  styleUrls: ['./finaces-ia-unavailable.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule]
})
export class FinacesIaUnavailableComponent {
  @Input() errorMessage: string = '';
  @Output() retryClicked = new EventEmitter<void>();

  isRetrying = false;

  onRetry(): void {
    this.isRetrying = true;
    this.retryClicked.emit();
    // Reset after 2s (or API response)
    setTimeout(() => {
      this.isRetrying = false;
    }, 2000);
  }
}
```

```scss
// src/app/shared/components/finaces-ia-unavailable/finaces-ia-unavailable.component.scss

.ia-unavailable-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.ia-unavailable-content {
  text-align: center;
  max-width: 500px;
}

.ia-icon {
  font-size: 64px;
  width: 64px;
  height: 64px;
  color: #9ca3af;
  margin-bottom: 16px;
}

h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.alert-disclaimer {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #92400e;

  mat-icon {
    flex-shrink: 0;
    color: #f59e0b;
  }
}

.actions {
  margin-bottom: 16px;
}

button {
  min-width: 120px;
}

.error-details {
  font-size: 12px;
  color: #dc2626;
  margin-top: 12px;
}
```

**Usage in Bloc 7 (IA Scoring):**

```typescript
// In bloc-7-ia.component.ts
iaAvailable$ = this.iaService.checkAvailability();
iaError$ = this.iaService.getError();

onRetryIA(): void {
  this.iaService.retryScoring(this.caseId).subscribe(
    // success
  );
}
```

```html
<!-- In bloc-7-ia.component.html -->
<div class="ia-section">
  <ng-container *ngIf="(iaAvailable$ | async)">
    <!-- Normal IA scoring content -->
  </ng-container>

  <ng-container *ngIf="!(iaAvailable$ | async)">
    <app-finaces-ia-unavailable
      [errorMessage]="(iaError$ | async) || ''"
      (retryClicked)="onRetryIA()"
    ></app-finaces-ia-unavailable>
  </ng-container>
</div>
```

### 2. Pilot Mode Banner

**Component: finaces-pilot-mode-banner**

```html
<!-- src/app/shared/components/finaces-pilot-mode-banner/finaces-pilot-mode-banner.component.html -->

<div class="pilot-mode-banner" *ngIf="pilotMode$ | async">
  <mat-icon class="pilot-icon">science</mat-icon>

  <span class="pilot-text">
    Module IA en phase pilote — Scores indicatifs uniquement
  </span>

  <a [routerLink]="['/admin/ia/pilot-info']" class="pilot-link">
    En savoir plus
  </a>
</div>
```

```typescript
// src/app/shared/components/finaces-pilot-mode-banner/finaces-pilot-mode-banner.component.ts

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../../core/services/app-config.service';

@Component({
  selector: 'app-finaces-pilot-mode-banner',
  templateUrl: './finaces-pilot-mode-banner.component.html',
  styleUrls: ['./finaces-pilot-mode-banner.component.scss'],
  standalone: true,
  imports: [MatIconModule, CommonModule, RouterModule]
})
export class FinacesPilotModeBannerComponent implements OnInit {
  pilotMode$!: Observable<boolean>;

  constructor(private config: AppConfigService) {}

  ngOnInit(): void {
    this.pilotMode$ = this.config.getPilotMode();
  }
}
```

```scss
// src/app/shared/components/finaces-pilot-mode-banner/finaces-pilot-mode-banner.component.scss

.pilot-mode-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #e0e7ff; // indigo-100
  border-left: 4px solid #4f46e5; // indigo-600
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  font-size: 14px;
  color: #3730a3; // indigo-900

  .pilot-icon {
    flex-shrink: 0;
    color: #4f46e5;
  }

  .pilot-text {
    flex: 1;
  }

  .pilot-link {
    color: #4f46e5;
    text-decoration: none;
    font-weight: 600;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
    }
  }
}
```

**Usage:**
Add at top of every IA-related template (Bloc 7, Admin IA, etc.)

```html
<app-finaces-pilot-mode-banner></app-finaces-pilot-mode-banner>
```

### 3. Empty States (5 Variants)

**Component: finaces-empty-state**

```html
<!-- src/app/shared/components/finaces-empty-state/finaces-empty-state.component.html -->

<div class="empty-state-container" [ngClass]="'variant-' + variant">
  <mat-icon class="empty-icon">{{ iconName }}</mat-icon>

  <h3>{{ title }}</h3>
  <p class="empty-description">{{ description }}</p>

  <button
    *ngIf="cta"
    mat-raised-button
    [color]="ctaColor"
    (click)="onCtaClick()"
  >
    {{ cta }}
  </button>
</div>
```

```typescript
// src/app/shared/components/finaces-empty-state/finaces-empty-state.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

export type EmptyStateVariant =
  | 'no-cases'
  | 'no-tensions'
  | 'ia-not-calculated'
  | 'no-search-results'
  | 'case-cancelled';

const EMPTY_STATE_CONFIG: Record<EmptyStateVariant, any> = {
  'no-cases': {
    icon: 'folder_off',
    title: 'Aucun dossier trouvé',
    description: 'Commencez par créer un nouveau dossier pour démarrer.',
    cta: '+ Nouveau dossier',
    ctaColor: 'primary'
  },
  'no-tensions': {
    icon: 'check_circle',
    title: 'Aucune tension détectée',
    description: 'Convergence parfaite entre le scoring MCC et IA.',
    cta: '',
    ctaColor: 'accent'
  },
  'ia-not-calculated': {
    icon: 'smart_toy',
    title: 'Prédiction IA non lancée',
    description: 'Cliquez ci-dessous pour lancer la prédiction IA.',
    cta: 'Lancer la prédiction IA',
    ctaColor: 'accent'
  },
  'no-search-results': {
    icon: 'search',
    title: 'Aucun résultat',
    description: 'Aucun dossier ne correspond à votre recherche.',
    cta: 'Réinitialiser les filtres',
    ctaColor: 'primary'
  },
  'case-cancelled': {
    icon: 'cancel',
    title: 'Ce dossier a été annulé',
    description: 'Vous pouvez créer un nouveau dossier ou consulter les archives.',
    cta: '← Retour à la liste',
    ctaColor: 'primary'
  }
};

@Component({
  selector: 'app-finaces-empty-state',
  templateUrl: './finaces-empty-state.component.html',
  styleUrls: ['./finaces-empty-state.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule]
})
export class FinacesEmptyStateComponent {
  @Input() variant: EmptyStateVariant = 'no-cases';
  @Input() title?: string;
  @Input() description?: string;
  @Input() cta?: string;
  @Input() ctaColor: string = 'primary';
  @Output() ctaClicked = new EventEmitter<void>();

  get iconName(): string {
    return this.title ? EMPTY_STATE_CONFIG[this.variant]?.icon || 'info' : '';
  }

  ngOnInit(): void {
    const config = EMPTY_STATE_CONFIG[this.variant];
    if (config) {
      this.title = this.title || config.title;
      this.description = this.description || config.description;
      this.cta = this.cta ?? config.cta;
      this.ctaColor = this.ctaColor || config.ctaColor;
    }
  }

  onCtaClick(): void {
    this.ctaClicked.emit();
  }
}
```

```scss
// src/app/shared/components/finaces-empty-state/finaces-empty-state.component.scss

.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
  background-color: #fafafa;
  border-radius: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  color: #d1d5db;
}

h3 {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.empty-description {
  font-size: 14px;
  color: #6b7280;
  max-width: 400px;
  margin-bottom: 32px;
}

button {
  min-width: 160px;
}

/* Variant-specific colors */
.variant-no-tensions .empty-icon {
  color: #10b981;
}

.variant-ia-not-calculated .empty-icon {
  color: #6366f1;
}

.variant-no-search-results .empty-icon {
  color: #f59e0b;
}

.variant-case-cancelled .empty-icon {
  color: #ef4444;
}
```

**Usage Examples:**

```html
<!-- Cases list: no cases -->
<app-finaces-empty-state
  variant="no-cases"
  (ctaClicked)="createNewCase()"
></app-finaces-empty-state>

<!-- Tensions: none detected -->
<app-finaces-empty-state
  variant="no-tensions"
></app-finaces-empty-state>

<!-- Search results: empty -->
<app-finaces-empty-state
  variant="no-search-results"
  [title]="'Aucun résultat pour \"' + searchQuery + '\"'"
  (ctaClicked)="resetFilters()"
></app-finaces-empty-state>
```

### 4. Skeleton Loaders

**Component: finaces-skeleton-loader**

```html
<!-- src/app/shared/components/finaces-skeleton-loader/finaces-skeleton-loader.component.html -->

<div class="skeleton-container" [ngClass]="'skeleton-' + variant">
  <ng-container [ngSwitch]="variant">
    <!-- Gauge Skeleton -->
    <ng-template ngSwitchCase="gauge">
      <div class="skeleton-gauge">
        <ngx-skeleton-loader
          count="1"
          appearance="circle"
          [height]="height || '160px'"
          [width]="width || '160px'"
        ></ngx-skeleton-loader>
        <div class="skeleton-text-line"></div>
      </div>
    </ng-template>

    <!-- Table Skeleton (5 rows) -->
    <ng-template ngSwitchCase="table">
      <div class="skeleton-table">
        <ngx-skeleton-loader
          count="5"
          appearance="line"
          [height]="height || '48px'"
        ></ngx-skeleton-loader>
      </div>
    </ng-template>

    <!-- Chart Skeleton (SHAP bar chart) -->
    <ng-template ngSwitchCase="chart">
      <div class="skeleton-chart">
        <ngx-skeleton-loader
          count="10"
          appearance="line"
          [height]="height || '24px'"
        ></ngx-skeleton-loader>
      </div>
    </ng-template>

    <!-- Card Skeleton -->
    <ng-template ngSwitchCase="card">
      <div class="skeleton-card">
        <ngx-skeleton-loader
          count="3"
          appearance="line"
          [height]="height || '16px'"
        ></ngx-skeleton-loader>
      </div>
    </ng-template>

    <!-- Default -->
    <ng-template ngSwitchDefault>
      <ngx-skeleton-loader
        count="1"
        appearance="line"
      ></ngx-skeleton-loader>
    </ng-template>
  </ng-container>
</div>
```

```typescript
// src/app/shared/components/finaces-skeleton-loader/finaces-skeleton-loader.component.ts

import { Component, Input } from '@angular/core';

export type SkeletonVariant = 'gauge' | 'table' | 'chart' | 'card';

@Component({
  selector: 'app-finaces-skeleton-loader',
  templateUrl: './finaces-skeleton-loader.component.html',
  styleUrls: ['./finaces-skeleton-loader.component.scss'],
  standalone: true,
  imports: [NgxSkeletonLoaderModule, CommonModule]
})
export class FinacesSkeletonLoaderComponent {
  @Input() variant: SkeletonVariant = 'card';
  @Input() height?: string;
  @Input() width?: string;
}
```

```scss
// src/app/shared/components/finaces-skeleton-loader/finaces-skeleton-loader.component.scss

.skeleton-container {
  padding: 16px;
}

.skeleton-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.skeleton-text-line {
  width: 100px;
  height: 16px;
  background-color: #e5e7eb;
  border-radius: 4px;
}

.skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-chart {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// Override ngx-skeleton-loader shimmer color
::ng-deep .skeleton-wrapper {
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #ffffff 50%,
    #f3f4f6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

**Usage in Bloc Templates:**

```html
<!-- During API loading -->
<div *ngIf="(loading$ | async); else contentTemplate">
  <app-finaces-skeleton-loader
    variant="gauge"
    height="120px"
    width="120px"
  ></app-finaces-skeleton-loader>
</div>

<ng-template #contentTemplate>
  <!-- Actual content once loaded -->
</ng-template>
```

### 5. Inline Error Component

**Component: finaces-inline-error**

```html
<!-- src/app/shared/components/finaces-inline-error/finaces-inline-error.component.html -->

<div class="inline-error-container">
  <div class="error-content">
    <mat-icon class="error-icon">error_outline</mat-icon>

    <div class="error-text">
      <strong>Erreur:</strong>
      <p>{{ message }}</p>
    </div>
  </div>

  <div class="error-actions">
    <button mat-stroked-button (click)="onRetry()" [disabled]="isRetrying">
      <mat-icon *ngIf="!isRetrying">refresh</mat-icon>
      <mat-spinner *ngIf="isRetrying" diameter="16"></mat-spinner>
      Réessayer
    </button>

    <button mat-stroked-button (click)="onDismiss()">
      <mat-icon>close</mat-icon>
      Ignorer
    </button>
  </div>
</div>
```

```typescript
// src/app/shared/components/finaces-inline-error/finaces-inline-error.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-finaces-inline-error',
  templateUrl: './finaces-inline-error.component.html',
  styleUrls: ['./finaces-inline-error.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, CommonModule]
})
export class FinacesInlineErrorComponent {
  @Input() message: string = 'Une erreur s\'est produite. Veuillez réessayer.';
  @Input() maxRetries: number = 3;
  @Output() retryClicked = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  isRetrying = false;
  retryCount = 0;

  onRetry(): void {
    if (this.retryCount >= this.maxRetries) {
      alert('Nombre maximum de tentatives atteint. Contactez le support.');
      return;
    }

    this.isRetrying = true;
    this.retryCount++;
    this.retryClicked.emit();

    setTimeout(() => {
      this.isRetrying = false;
    }, 2000);
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
```

```scss
// src/app/shared/components/finaces-inline-error/finaces-inline-error.component.scss

.inline-error-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: #fee2e2;
  border-left: 4px solid #dc2626;
  padding: 12px 16px;
  border-radius: 4px;
  margin: 16px 0;
}

.error-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.error-icon {
  flex-shrink: 0;
  color: #dc2626;
  margin-top: 2px;
}

.error-text {
  font-size: 14px;
  color: #991b1b;

  strong {
    display: block;
    margin-bottom: 4px;
  }

  p {
    margin: 0;
  }
}

.error-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

button {
  min-width: 100px;
  font-size: 12px;
}
```

**Usage in Bloc Templates:**

```html
<!-- In a bloc section where API error occurred -->
<app-finaces-inline-error
  *ngIf="(error$ | async) as error"
  [message]="error.message"
  (retryClicked)="retryApiCall()"
  (dismissed)="clearError()"
></app-finaces-inline-error>
```

### 6. AppConfigService

```typescript
// src/app/core/services/app-config.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private pilotMode$ = new BehaviorSubject<boolean>(false);
  private iaAvailable$ = new BehaviorSubject<boolean>(true);

  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.http.get<{pilot_mode: boolean}>('/api/v1/config/pilot-mode')
      .pipe(
        tap(config => {
          this.pilotMode$.next(config.pilot_mode);
        }),
        catchError(err => {
          console.error('Failed to load pilot mode config:', err);
          return of({pilot_mode: false});
        })
      )
      .subscribe();
  }

  getPilotMode(): Observable<boolean> {
    return this.pilotMode$.asObservable();
  }

  getIaAvailability(): Observable<boolean> {
    return this.iaAvailable$.asObservable();
  }

  setIaAvailable(available: boolean): void {
    this.iaAvailable$.next(available);
  }
}
```

## CONTRAINTES ANGULAR

**Standalone Components:**
- All new components are standalone
- Import required modules in each component
- No module declarations needed

**Observables & Async Pipe:**
- Use observables for loading states
- Async pipe in templates for subscription management
- Unsubscribe via takeUntilDestroyed() where needed

**Material Components:**
- mat-icon, mat-button, mat-spinner
- Proper color binding for buttons
- Icon names from Material Icons library

**Change Detection:**
- ChangeDetectionStrategy.OnPush where appropriate
- Signals for state management (optional, if using Angular 16+)

## BINDING API

### GET Pilot Mode Config
```
GET /api/v1/config/pilot-mode
Response: {pilot_mode: boolean}
```

### GET IA Availability
```
GET /api/v1/cases/{caseId}/ia/status
Response: {available: boolean, error?: string}
```

## CRITÈRES DE VALIDATION

### IA Unavailable State
1. ✅ Component displays when IA API fails
2. ✅ Disclaimer visible and complete
3. ✅ [Réessayer] button triggers retry
4. ✅ Error message shown if provided
5. ✅ MCC scoring still accessible

### Pilot Mode Banner
1. ✅ Banner visible when pilot_mode=true
2. ✅ Hidden when pilot_mode=false
3. ✅ Link to /admin/ia/pilot-info working
4. ✅ Appears on all IA-related pages

### Empty States
1. ✅ Correct variant displayed based on input
2. ✅ Icon, title, description correct
3. ✅ CTA button present (if applicable)
4. ✅ CTA color correct
5. ✅ Responsive on mobile (icon size reduces)

### Skeleton Loaders
1. ✅ Correct variant (gauge, table, chart, card)
2. ✅ Shimmer animation working
3. ✅ Replaced with actual content when loaded
4. ✅ No layout shift (skeleton matches content height)

### Inline Errors
1. ✅ Displays on API error
2. ✅ [Réessayer] triggers same API call
3. ✅ [Ignorer] dismisses error
4. ✅ Retry count respected (max 3)
5. ✅ Error message clear and helpful

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **finaces-ia-unavailable.component.ts|html|scss** (standalone)
2. **finaces-pilot-mode-banner.component.ts|html|scss** (standalone)
3. **finaces-empty-state.component.ts|html|scss** (standalone)
4. **finaces-skeleton-loader.component.ts|html|scss** (standalone)
5. **finaces-inline-error.component.ts|html|scss** (standalone)
6. **src/app/core/services/app-config.service.ts** (updated)
7. **Usage examples in all existing bloc templates** (P6-P17 updates)

