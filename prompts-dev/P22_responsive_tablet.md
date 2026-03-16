═══════════════════════════════════════════════════════════════════════════════
PROMPT 22 — Responsive Tablet (1024px — règles SCSS + sidenav mobile)
Dépend de : PROMPT 21 (États d'exception)
Peut être parallélisé avec : PROMPT 21 partiellement
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

FinaCES est conçu pour desktop (1920px+) mais doit fonctionner correctement sur
tablettes (1024px) et smartphones (375-480px). Ce prompt couvre le breakpoint TABLET.

Règles principales pour 1024px:
- **Sidebar:** Repliée par défaut (icons-only, 40px width)
- **Topbar:** Hamburger toggle visible
- **Contenu:** Full width
- **Grilles:** 2 colonnes → 1 colonne (empilage vertical)
- **Rapports:** Single column layout
- **Stepper:** Horizontal → Vertical (optional)
- **Tableaux:** Hide non-essential columns, enable horizontal scroll

Ceci garantit une expérience fluide de 375px à 1920px.

## FICHIERS À MODIFIER

**Modify (SCSS responsive sections):**
- `src/styles/_responsive.scss` (NEW — all breakpoints)
- `src/app/shared/layouts/app-shell/app-shell.component.scss` (sidebar toggle)
- `src/app/shared/layouts/topbar/topbar.component.scss` (hamburger icon)
- `src/app/features/cases/blocs/bloc-*/bloc-*.component.scss` (all blocs)
- `src/app/shared/components/finaces-*/*.component.scss` (all custom components)

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Global Breakpoints

```scss
// src/styles/_responsive.scss

/**
 * FinaCES Responsive Design System
 * Breakpoints: Desktop (1920+), Laptop (1280), Tablet (1024), Mobile (768), Phone (480)
 */

// Define breakpoints as variables
$breakpoint-xl: 1920px;  // Desktop (production target)
$breakpoint-lg: 1280px;  // Laptop
$breakpoint-md: 1024px;  // Tablet (THIS PROMPT)
$breakpoint-sm: 768px;   // Mobile landscape
$breakpoint-xs: 480px;   // Phone portrait

// Mixins for clean responsive code
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'tablet' {
    @media (max-width: #{$breakpoint-md}) {
      @content;
    }
  } @else if $breakpoint == 'mobile' {
    @media (max-width: #{$breakpoint-sm}) {
      @content;
    }
  } @else if $breakpoint == 'phone' {
    @media (max-width: #{$breakpoint-xs}) {
      @content;
    }
  }
}

// Example usage:
// .my-element {
//   padding: 20px;
//   @include respond-to('tablet') {
//     padding: 12px;
//   }
// }

/**
 * Sidebar Responsive Rules
 */
.sidebar {
  width: 240px;
  transition: width 0.3s ease;

  @include respond-to('tablet') {
    width: 40px; // Icon-only mode

    // Hide text labels
    .sidebar-label {
      display: none;
    }

    // Icons centered
    .sidebar-icon {
      margin: 0 auto;
    }

    // Expand on toggle
    &.expanded {
      width: 240px;

      .sidebar-label {
        display: inline;
      }
    }
  }
}

/**
 * Topbar Responsive Rules
 */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  // Hamburger button (hidden on desktop)
  .hamburger-button {
    display: none;

    @include respond-to('tablet') {
      display: flex;
      margin-right: 16px;
    }
  }

  // Logo/title
  .topbar-title {
    font-size: 18px;

    @include respond-to('tablet') {
      font-size: 16px;
    }

    @include respond-to('phone') {
      font-size: 14px;
    }
  }

  // Actions (print, export, etc.)
  .topbar-actions {
    display: flex;
    gap: 8px;

    @include respond-to('tablet') {
      gap: 4px;

      .action-label {
        display: none; // Show icons only
      }

      button {
        padding: 8px;
      }
    }

    @include respond-to('phone') {
      .action-label {
        display: none;
      }

      // Overflow menu
      .actions-menu {
        display: flex;
      }
    }
  }
}

/**
 * Main Content Responsive Rules
 */
.main-content {
  margin-left: 240px;
  transition: margin-left 0.3s ease;

  @include respond-to('tablet') {
    margin-left: 40px;

    .sidebar.expanded ~ & {
      margin-left: 240px;
    }
  }
}

/**
 * 2-Column Layout → 1-Column on Tablet
 */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @include respond-to('tablet') {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @include respond-to('phone') {
    gap: 12px;
  }
}

/**
 * 3-Column Layout → 1-Column on Tablet
 */
.gate-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @include respond-to('tablet') {
    grid-template-columns: 1fr;
    gap: 16px;

    // Cards wrap horizontally with scroll if needed
    overflow-x: auto;
    scroll-snap-type: x mandatory;

    > * {
      scroll-snap-align: start;
    }
  }
}

/**
 * KPI Row (Cards in row, wrap on tablet)
 */
.kpi-row {
  display: flex;
  gap: 16px;
  flex-wrap: nowrap;

  .kpi-card {
    flex: 1;
    min-width: calc(25% - 12px);

    @include respond-to('tablet') {
      min-width: calc(50% - 8px);
    }

    @include respond-to('phone') {
      min-width: 100%;
    }
  }
}

/**
 * Score Gauge (Reduce size on tablet)
 */
.score-gauge {
  width: 160px;
  height: 160px;

  @include respond-to('tablet') {
    width: 120px;
    height: 120px;
  }

  @include respond-to('phone') {
    width: 100px;
    height: 100px;
  }
}

/**
 * Table Responsive (Horizontal scroll)
 */
.responsive-table {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  table {
    min-width: 100%;
    font-size: 14px;

    @include respond-to('tablet') {
      font-size: 12px;

      // Hide non-essential columns
      th:nth-child(n+5),
      td:nth-child(n+5) {
        display: none;
      }

      // Add horizontal scroll indicator
      &::after {
        content: '→ Scroll →';
        position: absolute;
        right: 0;
        background: linear-gradient(to left, rgba(255,255,255,1), transparent);
        padding: 8px;
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }
}

/**
 * Rapport Grid (Single column on tablet)
 */
.rapport-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @include respond-to('tablet') {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

/**
 * Stepper (Horizontal → Vertical on tablet)
 */
mat-stepper {
  @include respond-to('tablet') {
    // mat-horizontal-stepper becomes vertical
    &.mat-horizontal-stepper {
      mat-step {
        // Override layout to vertical
      }

      .mat-horizontal-stepper-header-container {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }
}

/**
 * Form Controls (Full width on tablet)
 */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @include respond-to('tablet') {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .form-field {
    width: 100%;
  }
}

/**
 * Sidebar Navigation (Full width drawer on tablet)
 */
.sidenav-container {
  @include respond-to('tablet') {
    // mat-drawer becomes modal/overlay
    mat-drawer {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 240px;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

      // Close button when opened
      .close-button {
        display: flex;
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
    }

    // Scrim (overlay background)
    mat-drawer-container {
      position: relative;
    }

    // Hide scrim text on mobile
    .mat-drawer-backdrop {
      background-color: rgba(0, 0, 0, 0.32);
    }
  }
}

/**
 * Typography Responsive
 */
h1 {
  font-size: 32px;

  @include respond-to('tablet') {
    font-size: 24px;
  }

  @include respond-to('phone') {
    font-size: 20px;
  }
}

h2 {
  font-size: 24px;

  @include respond-to('tablet') {
    font-size: 18px;
  }

  @include respond-to('phone') {
    font-size: 16px;
  }
}

h3 {
  font-size: 20px;

  @include respond-to('tablet') {
    font-size: 16px;
  }

  @include respond-to('phone') {
    font-size: 14px;
  }
}

body {
  font-size: 14px;

  @include respond-to('tablet') {
    font-size: 13px;
  }

  @include respond-to('phone') {
    font-size: 12px;
  }
}

/**
 * Padding/Margin Responsive
 */
.container {
  padding: 24px;

  @include respond-to('tablet') {
    padding: 16px;
  }

  @include respond-to('phone') {
    padding: 12px;
  }
}

.section {
  margin-bottom: 24px;

  @include respond-to('tablet') {
    margin-bottom: 16px;
  }

  @include respond-to('phone') {
    margin-bottom: 12px;
  }
}

/**
 * Print Media (no sidebar, full width)
 */
@media print {
  .sidebar,
  .topbar,
  .footer {
    display: none !important;
  }

  .main-content {
    margin-left: 0 !important;
    width: 100%;
    max-width: 100%;
  }

  .sidebar.expanded ~ .main-content {
    margin-left: 0 !important;
  }

  // Avoid page breaks inside cards
  .card,
  .section {
    page-break-inside: avoid;
  }

  // Force page break before tables if they're long
  table {
    page-break-inside: avoid;
  }
}
```

### Sidebar Component (Toggle Logic)

```typescript
// src/app/shared/layouts/sidebar/sidebar.component.ts

import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [MatListModule, MatIconModule, CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  isTablet$!: Observable<boolean>;
  isExpanded$ = new BehaviorSubject<boolean>(false);

  constructor(private breakpointObserver: BreakpointObserver) {
    // Detect if device is tablet or smaller
    this.isTablet$ = this.breakpointObserver
      .observe(['(max-width: 1024px)'])
      .pipe(
        map(result => result.matches)
      );
  }

  ngOnInit(): void {
    // On tablet, start collapsed
    this.isTablet$.subscribe(isTablet => {
      if (isTablet) {
        this.isExpanded$.next(false);
      } else {
        this.isExpanded$.next(true);
      }
    });
  }

  toggleExpanded(): void {
    this.isExpanded$.next(!this.isExpanded$.value);
  }
}
```

```html
<!-- src/app/shared/layouts/sidebar/sidebar.component.html -->

<div class="sidebar" [class.expanded]="isExpanded$ | async">
  <div class="sidebar-header">
    <mat-icon class="logo-icon">assessment</mat-icon>
    <span class="logo-text">FinaCES</span>
  </div>

  <nav class="sidebar-nav">
    <a
      mat-list-item
      routerLink="/cases"
      routerLinkActive="active"
    >
      <mat-icon class="sidebar-icon">folder</mat-icon>
      <span class="sidebar-label">Dossiers</span>
    </a>

    <a
      mat-list-item
      routerLink="/admin/ia"
      routerLinkActive="active"
      *ngIf="hasAdminRole"
    >
      <mat-icon class="sidebar-icon">smart_toy</mat-icon>
      <span class="sidebar-label">Admin IA</span>
    </a>

    <!-- ... more nav items ... -->
  </nav>
</div>
```

```scss
// src/app/shared/layouts/sidebar/sidebar.component.scss

.sidebar {
  width: 240px;
  height: 100vh;
  background-color: #f8fafc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 16px;
    border-bottom: 1px solid #e2e8f0;

    .logo-icon {
      font-size: 24px;
      color: #0ea5e9;
    }

    .logo-text {
      font-weight: 700;
      color: #1e293b;
      font-size: 16px;
    }
  }

  .sidebar-nav {
    padding: 12px 8px;

    a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      color: #475569;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;

      .sidebar-icon {
        flex-shrink: 0;
      }

      .sidebar-label {
        font-size: 13px;
      }

      &:hover {
        background-color: #e2e8f0;
      }

      &.active {
        background-color: #dbeafe;
        color: #0ea5e9;
        font-weight: 600;
      }
    }
  }

  // Tablet: Icon-only mode
  @media (max-width: 1024px) {
    width: 40px;
    padding: 0;

    .sidebar-header {
      flex-direction: column;
      gap: 0;
      padding: 12px 8px;
      border-bottom: none;

      .logo-text {
        display: none;
      }

      .logo-icon {
        margin: 0 auto;
      }
    }

    .sidebar-nav a {
      justify-content: center;
      padding: 12px 8px;

      .sidebar-label {
        display: none;
      }
    }

    // Expand state
    &.expanded {
      width: 240px;

      .sidebar-header {
        flex-direction: row;
        gap: 12px;
        padding: 20px 16px;
        border-bottom: 1px solid #e2e8f0;

        .logo-text {
          display: inline;
        }
      }

      .sidebar-nav a {
        justify-content: flex-start;
        padding: 8px 12px;

        .sidebar-label {
          display: inline;
        }
      }
    }
  }
}
```

### Topbar Component (Hamburger Button)

```html
<!-- src/app/shared/layouts/topbar/topbar.component.html -->

<div class="topbar">
  <!-- Hamburger button (tablet only) -->
  <button
    class="hamburger-button"
    mat-icon-button
    (click)="onHamburgerClick()"
    matTooltip="Menu"
  >
    <mat-icon>menu</mat-icon>
  </button>

  <!-- Title -->
  <div class="topbar-title">
    {{ pageTitle }}
  </div>

  <!-- Actions (print, export, etc.) -->
  <div class="topbar-actions">
    <button mat-icon-button (click)="print()" matTooltip="Imprimer">
      <mat-icon>print</mat-icon>
      <span class="action-label">Imprimer</span>
    </button>

    <button mat-icon-button (click)="export()" matTooltip="Exporter">
      <mat-icon>download</mat-icon>
      <span class="action-label">Exporter</span>
    </button>

    <!-- ... more actions ... -->
  </div>
</div>
```

```typescript
// src/app/shared/layouts/topbar/topbar.component.ts

import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule]
})
export class TopbarComponent {
  @Output() hamburgerClicked = new EventEmitter<void>();

  pageTitle = 'FinaCES';

  onHamburgerClick(): void {
    this.hamburgerClicked.emit();
  }

  print(): void {
    window.print();
  }

  export(): void {
    // Trigger export logic
  }
}
```

```scss
// src/app/shared/layouts/topbar/topbar.component.scss

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  padding: 0 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;

  .hamburger-button {
    display: none; // Hidden on desktop

    @media (max-width: 1024px) {
      display: flex;
    }
  }

  .topbar-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    flex: 1;

    @media (max-width: 1024px) {
      font-size: 16px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }

  .topbar-actions {
    display: flex;
    gap: 8px;

    .action-label {
      margin-left: 4px;
    }

    @media (max-width: 1024px) {
      gap: 4px;

      .action-label {
        display: none; // Icons only
      }
    }
  }
}
```

### App Shell Component (Sidebar Toggle Integration)

```typescript
// src/app/shared/layouts/app-shell/app-shell.component.ts

import { Component, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  standalone: true,
  imports: [
    MatSidenavModule,
    MatDrawerModule,
    SidebarComponent,
    TopbarComponent,
    RouterOutlet
  ]
})
export class AppShellComponent {
  @ViewChild('drawer') drawer!: MatDrawer;

  onHamburgerClick(): void {
    this.drawer.toggle();
  }

  onSidebarToggle(): void {
    this.drawer.toggle();
  }
}
```

```html
<!-- src/app/shared/layouts/app-shell/app-shell.component.html -->

<mat-drawer-container class="shell-container">
  <!-- Sidebar (fixed on desktop, drawer on tablet) -->
  <mat-drawer
    #drawer
    mode="over"
    [opened]="false"
    class="shell-sidebar"
  >
    <app-sidebar
      (toggleExpanded)="onSidebarToggle()"
    ></app-sidebar>
  </mat-drawer>

  <!-- Main content -->
  <mat-drawer-content class="shell-content">
    <app-topbar
      (hamburgerClicked)="onHamburgerClick()"
    ></app-topbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  </mat-drawer-content>
</mat-drawer-container>
```

```scss
// src/app/shared/layouts/app-shell/app-shell.component.scss

.shell-container {
  height: 100vh;
  display: flex;

  .shell-sidebar {
    @media (max-width: 1024px) {
      // Drawer mode on tablet
      width: 240px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
  }

  .shell-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  @media (max-width: 1024px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
}
```

### Bloc Component Example (2-Column → 1-Column)

```scss
// src/app/features/cases/blocs/bloc-5-liquidite/bloc-5-liquidite.component.scss

.bloc-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.kpi-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .kpi-card {
    padding: 16px;

    @media (max-width: 480px) {
      padding: 12px;
    }
  }
}
```

## CONTRAINTES ANGULAR

**BreakpointObserver:**
- Use Angular CDK's BreakpointObserver for responsive detection
- Emit Observable<boolean> for each breakpoint
- Avoid window.innerWidth polling

**Material Breakpoints:**
- Material Design defines standard breakpoints
- Align FinaCES breakpoints with Material (if applicable)
- Override Material breakpoints if needed (via CSS custom properties)

**CSS-in-JS (if using Tailwind):**
- Use @apply directives for responsive utilities
- Mix Tailwind classes with custom SCSS

**Change Detection:**
- Use OnPush strategy (even with responsive changes)
- BreakpointObserver emissions trigger change detection

## CRITÈRES DE VALIDATION

### Tablet Layout (1024px)
1. ✅ Sidebar: collapsed to 40px (icons only)
2. ✅ Topbar: hamburger button visible
3. ✅ Main content: full width
4. ✅ KPI row: min-width adjusted (50% per card)
5. ✅ 2-column layouts: stacked to 1 column
6. ✅ Score gauges: reduced from 160px to 120px
7. ✅ Tables: non-essential columns hidden, horizontal scroll enabled
8. ✅ Report layout: single column (rapport-grid)
9. ✅ Padding/margins: reduced (24px → 16px)
10. ✅ Font sizes: slightly reduced (14px → 13px)

### Mobile Layout (480px, optional for Phase 5)
1. ✅ All tablet rules apply
2. ✅ Single column layouts enforced
3. ✅ Gauges: 100px
4. ✅ Padding: 12px
5. ✅ Font sizes: 12px
6. ✅ Bottom navigation (mat-tab-nav-bar) optional

### Responsive Behavior
1. ✅ Smooth transitions (no jarring layout shifts)
2. ✅ No horizontal scroll on main content (except tables)
3. ✅ Touchable buttons: min 44px × 44px
4. ✅ Font readability: no < 12px on phone
5. ✅ Images/icons scale proportionally

### Sidebar Drawer (Tablet)
1. ✅ Hamburger toggle shows/hides drawer
2. ✅ Drawer overlays content (modal)
3. ✅ Scrim (overlay background) works
4. ✅ Clicking scrim closes drawer
5. ✅ Logo/navigation visible in drawer

### Print Media (@media print)
1. ✅ Sidebar/topbar hidden
2. ✅ Main content full width
3. ✅ No page breaks inside cards/sections
4. ✅ Tables fit on page (single column if needed)
5. ✅ Page numbering clear (if applicable)

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/styles/_responsive.scss** (global breakpoints + mixins + all rules)
2. **src/app/shared/layouts/sidebar/sidebar.component.ts|html|scss** (updated)
3. **src/app/shared/layouts/topbar/topbar.component.ts|html|scss** (updated)
4. **src/app/shared/layouts/app-shell/app-shell.component.ts|html|scss** (updated)
5. **All bloc components *.component.scss** (updated with @media (max-width: 1024px) rules)
6. **All custom component *.component.scss** (updated with responsive rules)

---

## CHECKPOINT PHASE 5 ─────────────────────────────────────

À la fin de PROMPT 22, l'application doit :

✅ Protéger toutes les routes par les guards (AuthGuard + CaseStatusGuard)
✅ Rediriger automatiquement vers l'étape courante si accès hors séquence
✅ Afficher le message de redirection via toast
✅ Gérer gracieusement l'indisponibilité IA (fallback + retry)
✅ Afficher le mode pilote si activé (banner sur tous blocs IA)
✅ Montrer des empty states adaptés pour chaque scénario vide
✅ Afficher des skeleton loaders pendant les chargements API
✅ Gérer les erreurs inline avec retry dans chaque section
✅ S'adapter au format tablette 1024px:
   - Sidebar repliée (icons-only, 40px)
   - Hamburger toggle visible en topbar
   - Colonnes empilées (2-col → 1-col)
   - Score gauges réduits (160px → 120px)
   - Tables avec scroll horizontal (colonnes non-essentielles cachées)
   - Stepper vertical (optional)
   - Padding/font sizes réduits
✅ Gérer l'impression correctement (@media print)
✅ Flux complet DRAFT → CLOSED avec UX fluide

FINALISATION:
- Aucune dépendance externe non déclarée
- Tous les composants standalone (Angular 15+)
- Material Design respecté
- Accessibilité WCAG AA minimum
- Performance: <3s load time pour toute page
- Tests E2E (optional, post-Phase 5)

─────────────────────────────────────────────────────────────

