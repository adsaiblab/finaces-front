═══════════════════════════════════════════════════════════════════════════════
PROMPT 3 — APP SHELL (TOPBAR + SIDEBAR) + ROUTING SQUELETTE
═══════════════════════════════════════════════════════════════════════════════

**Dépend de:** PROMPT 1 (styles/tokens), PROMPT 2 (services/modèles)
**Peut être parallélisé avec:** Aucun
**Livré à:** fin de ce prompt

---

## CONTEXTE

L'infrastructure (P1) et les services/modèles (P2) sont en place. Ce prompt crée:

1. **App Shell** — Layout principal avec Topbar fixe (64px) et Sidebar fixe (240px)
2. **Routing** — Configuration complète avec lazy loading de toutes les features
3. **Placeholders** — Composants stub pour toutes les pages (BLOC 0 à BLOC 10, consortium, admin, auth)
4. **Navigation** — Sidebar links avec active state highlighting
5. **Topbar** — Logo, search, notifications, user avatar

À l'issue de ce prompt, l'application compile, naviguer fonctionne, et tous les placeholders sont visibles. La structure est prête pour les développements de feature (PROMPT 4+).

---

## RÈGLES MÉTIER APPLICABLES

Aucune règle métier directement — shell UI uniquement.

**Contraintes de layout:**
- Sidebar: 240px fixed, dark background (#bg-sidebar), left side
- Topbar: 64px fixed, top side, brand primary color (#primary)
- Main content: max-width 1160px, centered, padding 32px
- Router outlet: prend le reste de l'espace disponible

**Case status machine (information):**
Utilisée pour la validation des transitions dans les features (non ici).

**Guards (stubs):** À implémer en PROMPT 20 — pour maintenant, toujours retourner `true`.

---

## FICHIERS À CRÉER / MODIFIER

### App Shell (5 fichiers):
1. `src/app/app.component.ts` — Root component minimal
2. `src/app/layout/app-shell/app-shell.component.ts` (+ .html + .scss)
3. `src/app/layout/app-shell/sidebar/sidebar.component.ts` (+ .html + .scss)
4. `src/app/layout/app-shell/topbar/topbar.component.ts` (+ .html + .scss)

### Routing:
5. `src/app/app.routes.ts` — FULL routing tree avec lazy loading

### Feature Placeholders (16 fichiers):
6. `src/app/features/bloc0-dashboard/dashboard.component.ts` (+ .html + .scss)
7. `src/app/features/bloc0-dashboard/dashboard.routes.ts`
8. `src/app/features/bloc1a-recevabilite/recevabilite.component.ts` (+ .html + .scss)
9. `src/app/features/bloc1a-recevabilite/recevabilite.routes.ts`
10. `src/app/features/bloc1b-gate/gate.component.ts` (+ .html + .scss)
11. `src/app/features/bloc1b-gate/gate.routes.ts`
12. `src/app/features/bloc2-financials/financials.component.ts` (+ .html + .scss)
13. `src/app/features/bloc2-financials/financials.routes.ts`
14. + `bloc3-normalization`, `bloc4-ratios`, `bloc5-scoring-mcc`, `bloc6-ia`, `bloc7-tension`, `bloc8-stress`, `bloc9-expert`, `bloc10-rapport` (similar structure)
15. `src/app/features/consortium/consortium.component.ts` (+ .html + .scss)
16. `src/app/features/consortium/consortium.routes.ts`
17. `src/app/features/admin-ia/admin-ia.component.ts` (+ .html + .scss)
18. `src/app/features/admin-ia/admin-ia.routes.ts`
19. `src/app/features/auth/login/login.component.ts` (+ .html + .scss)
20. `src/app/features/cases/cases-list/cases-list.component.ts` (+ .html + .scss)
21. `src/app/features/cases/case-workspace/case-workspace.component.ts` (+ .html + .scss)
22. `src/app/features/reporting/reporting.component.ts` (+ .html + .scss)

**Total: ~40 fichiers** (composants + routes + styles)

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### 1. APP COMPONENT (ROOT)

#### FILE: src/app/app.component.ts

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  template: `
    <app-shell></app-shell>
  `,
})
export class AppComponent {
  title = 'FinaCES';
}
```

---

### 2. APP SHELL COMPONENT

#### FILE: src/app/layout/app-shell/app-shell.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent implements OnInit {
  sidebarOpen = true;

  constructor() {}

  ngOnInit(): void {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
```

#### FILE: src/app/layout/app-shell/app-shell.component.html

```html
<div class="app-shell">
  <!-- Topbar (fixed top) -->
  <app-topbar (sidebarToggled)="toggleSidebar()"></app-topbar>

  <!-- Main container -->
  <div class="app-container">
    <!-- Sidebar (fixed left) -->
    <app-sidebar [isOpen]="sidebarOpen"></app-sidebar>

    <!-- Main content area -->
    <div class="main-content">
      <router-outlet></router-outlet>
    </div>
  </div>
</div>
```

#### FILE: src/app/layout/app-shell/app-shell.component.scss

```scss
@import 'styles/variables';

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-default);
}

.app-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: var(--topbar-height); // Account for fixed topbar
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

// Scrollbar styling
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--bg-default);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;

  &:hover {
    background: var(--text-secondary);
  }
}
```

---

### 3. SIDEBAR COMPONENT

#### FILE: src/app/layout/app-shell/sidebar/sidebar.component.ts

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface SidebarLink {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = true;

  sidebarLinks: SidebarLink[] = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
    { label: 'Dossiers', icon: 'folder', route: '/cases' },
    { label: 'Intelligence Artificielle', icon: 'smart_toy', route: '/ia' },
    { label: 'Rapports', icon: 'bar_chart', route: '/reporting' },
    { label: 'Administration', icon: 'settings', route: '/admin/ia' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
```

#### FILE: src/app/layout/app-shell/sidebar/sidebar.component.html

```html
<div class="sidebar" [class.collapsed]="!isOpen">
  <!-- Logo / Brand -->
  <div class="sidebar-header">
    <div class="logo">
      <span class="logo-icon">FinaCES</span>
      <span class="logo-text" *ngIf="isOpen">FinaCES</span>
    </div>
  </div>

  <!-- Navigation Links -->
  <nav class="sidebar-nav">
    <ul class="nav-list">
      <li *ngFor="let link of sidebarLinks" class="nav-item">
        <a
          [routerLink]="link.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="nav-link"
          [matTooltip]="!isOpen ? link.label : ''"
        >
          <mat-icon class="nav-icon">{{ link.icon }}</mat-icon>
          <span class="nav-label" *ngIf="isOpen">{{ link.label }}</span>
          <span class="badge" *ngIf="link.badge && isOpen">
            {{ link.badge }}
          </span>
        </a>
      </li>
    </ul>
  </nav>

  <!-- Footer (optional) -->
  <div class="sidebar-footer" *ngIf="isOpen">
    <p class="text-body-small">v1.0.0</p>
  </div>
</div>
```

#### FILE: src/app/layout/app-shell/sidebar/sidebar.component.scss

```scss
@import 'styles/variables';

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  transition: width var(--transition-base);
  position: fixed;
  left: 0;
  top: var(--topbar-height);
  z-index: var(--z-sticky);

  &.collapsed {
    width: 80px;

    .logo-text {
      display: none;
    }

    .nav-label,
    .sidebar-footer {
      display: none;
    }

    .nav-icon {
      margin-right: 0;
    }
  }
}

.sidebar-header {
  padding: var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 700;
  color: var(--sidebar-active);
  font-size: 18px;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
    font-weight: 700;
  }
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md) var(--space-xs);
  overflow-y: auto;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin-bottom: var(--space-sm);
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--space-sm) var(--space-sm);
  border-radius: var(--radius-base);
  color: var(--sidebar-text);
  text-decoration: none;
  transition: all var(--transition-base);
  gap: var(--space-sm);
  position: relative;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--sidebar-active);
  }

  &.active {
    background-color: var(--sidebar-active-bg);
    color: var(--sidebar-active);
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: var(--primary-light);
      border-radius: 0 2px 2px 0;
    }
  }
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-xs);
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge {
  background-color: var(--error);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
  margin-left: auto;
}

.sidebar-footer {
  padding: var(--space-md) var(--space-sm);
  border-top: 1px solid var(--border);
  color: var(--sidebar-text);
  text-align: center;
  font-size: 12px;
}
```

---

### 4. TOPBAR COMPONENT

#### FILE: src/app/layout/app-shell/topbar/topbar.component.ts

```typescript
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  @Output() sidebarToggled = new EventEmitter<void>();

  notificationCount = 3;
  userMenuOpen = false;

  constructor() {}

  ngOnInit(): void {}

  toggleSidebar(): void {
    this.sidebarToggled.emit();
  }

  logout(): void {
    console.log('Logout clicked');
    // TODO: Implement logout via AuthService
  }

  openProfile(): void {
    console.log('Profile clicked');
  }
}
```

#### FILE: src/app/layout/app-shell/topbar/topbar.component.html

```html
<mat-toolbar class="topbar" color="primary">
  <!-- Left side: Menu toggle + Logo -->
  <div class="topbar-left">
    <button
      mat-icon-button
      (click)="toggleSidebar()"
      class="menu-toggle"
      aria-label="Toggle sidebar"
    >
      <mat-icon>menu</mat-icon>
    </button>

    <div class="topbar-brand">
      <span class="brand-icon">FinaCES</span>
      <span class="brand-title">Financial Capacity Evaluation System</span>
    </div>
  </div>

  <!-- Center: Search -->
  <div class="topbar-center">
    <div class="search-box">
      <mat-icon class="search-icon">search</mat-icon>
      <input
        type="text"
        class="search-input"
        placeholder="Chercher un dossier..."
        aria-label="Search cases"
      />
    </div>
  </div>

  <!-- Right side: Notifications + User -->
  <div class="topbar-right">
    <!-- Notifications -->
    <button
      mat-icon-button
      [matMenuTriggerFor]="notificationsMenu"
      [matBadge]="notificationCount"
      matBadgeColor="warn"
      matBadgeSize="small"
      aria-label="Notifications"
    >
      <mat-icon>notifications</mat-icon>
    </button>
    <mat-menu #notificationsMenu="matMenu" class="notifications-menu">
      <button mat-menu-item>
        <span>Document importé</span>
      </button>
      <button mat-menu-item>
        <span>Score calculé</span>
      </button>
      <button mat-menu-item>
        <span>Gate évalué</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item>
        <span>Voir tous</span>
      </button>
    </mat-menu>

    <!-- User menu -->
    <button
      mat-icon-button
      [matMenuTriggerFor]="userMenu"
      aria-label="User menu"
      class="user-avatar"
    >
      <mat-icon class="avatar-icon">account_circle</mat-icon>
    </button>
    <mat-menu #userMenu="matMenu" class="user-menu">
      <button mat-menu-item (click)="openProfile()">
        <mat-icon>person</mat-icon>
        <span>Profil</span>
      </button>
      <button mat-menu-item>
        <mat-icon>settings</mat-icon>
        <span>Paramètres</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Déconnexion</span>
      </button>
    </mat-menu>
  </div>
</mat-toolbar>
```

#### FILE: src/app/layout/app-shell/topbar/topbar.component.scss

```scss
@import 'styles/variables';

.topbar {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height) !important;
  padding: 0 var(--space-md) !important;
  background-color: var(--primary) !important;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  box-shadow: var(--shadow-md);

  mat-icon {
    color: white;
  }
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
}

.menu-toggle {
  color: white !important;
  transition: transform var(--transition-base);

  &:hover {
    transform: scale(1.1);
  }
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: white;
  font-weight: 700;
  font-size: 18px;
  white-space: nowrap;

  .brand-icon {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--radius-base);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .brand-title {
    display: none;

    @media (min-width: 1024px) {
      display: block;
      font-size: 14px;
      font-weight: 500;
      opacity: 0.9;
      margin-left: var(--space-sm);
    }
  }
}

.topbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 var(--space-lg);

  @media (max-width: 768px) {
    display: none;
  }
}

.search-box {
  width: 100%;
  max-width: 400px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-md);
  transition: all var(--transition-base);

  &:hover,
  &:focus-within {
    background: rgba(255, 255, 255, 0.25);
  }

  .search-icon {
    color: rgba(255, 255, 255, 0.7);
    margin-right: var(--space-sm);
  }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: white;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-shrink: 0;
}

.user-avatar {
  .avatar-icon {
    font-size: 28px;
    width: 28px;
    height: 28px;
  }
}

// Material Menu overrides
::ng-deep {
  .notifications-menu,
  .user-menu {
    .mat-mdc-menu-content {
      padding: var(--space-xs) 0;
    }

    button {
      min-height: 40px;
      font-size: 14px;
    }
  }
}
```

---

### 5. ROUTING CONFIGURATION

#### FILE: src/app/app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      // BLOC 0 — Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './features/bloc0-dashboard/dashboard.component'
          ).then((m) => m.DashboardComponent),
      },

      // BLOC 1A — Recevabilité (Cases Management)
      {
        path: 'cases',
        loadComponent: () =>
          import(
            './features/cases/cases-list/cases-list.component'
          ).then((m) => m.CasesListComponent),
      },
      {
        path: 'cases/new',
        loadComponent: () =>
          import(
            './features/bloc1a-recevabilite/recevabilite.component'
          ).then((m) => m.RecevabiliteComponent),
      },
      {
        path: 'cases/:caseId/workspace',
        loadComponent: () =>
          import(
            './features/cases/case-workspace/case-workspace.component'
          ).then((m) => m.CaseWorkspaceComponent),
      },

      // BLOC 1B — Gate
      {
        path: 'cases/:caseId/gate',
        loadComponent: () =>
          import(
            './features/bloc1b-gate/gate.component'
          ).then((m) => m.GateComponent),
      },

      // BLOC 2 — Financials
      {
        path: 'cases/:caseId/financials',
        loadComponent: () =>
          import(
            './features/bloc2-financials/financials.component'
          ).then((m) => m.FinancialsComponent),
      },

      // BLOC 3 — Normalization
      {
        path: 'cases/:caseId/normalization',
        loadComponent: () =>
          import(
            './features/bloc3-normalization/normalization.component'
          ).then((m) => m.NormalizationComponent),
      },

      // BLOC 4 — Ratios
      {
        path: 'cases/:caseId/ratios',
        loadComponent: () =>
          import(
            './features/bloc4-ratios/ratios.component'
          ).then((m) => m.RatiosComponent),
      },

      // BLOC 5 — MCC Scoring
      {
        path: 'cases/:caseId/scoring',
        loadComponent: () =>
          import(
            './features/bloc5-scoring-mcc/scoring-mcc.component'
          ).then((m) => m.ScoringMccComponent),
      },

      // BLOC 6 — IA
      {
        path: 'ia',
        loadComponent: () =>
          import(
            './features/bloc6-ia/ia.component'
          ).then((m) => m.IaComponent),
      },
      {
        path: 'cases/:caseId/ia',
        loadComponent: () =>
          import(
            './features/bloc6-ia/ia.component'
          ).then((m) => m.IaComponent),
      },

      // BLOC 7 — Tension
      {
        path: 'cases/:caseId/tension',
        loadComponent: () =>
          import(
            './features/bloc7-tension/tension.component'
          ).then((m) => m.TensionComponent),
      },

      // BLOC 8 — Stress
      {
        path: 'cases/:caseId/stress',
        loadComponent: () =>
          import(
            './features/bloc8-stress/stress.component'
          ).then((m) => m.StressComponent),
      },

      // BLOC 9 — Expert Review
      {
        path: 'cases/:caseId/expert',
        loadComponent: () =>
          import(
            './features/bloc9-expert/expert.component'
          ).then((m) => m.ExpertComponent),
      },

      // BLOC 10 — Rapport
      {
        path: 'cases/:caseId/rapport',
        loadComponent: () =>
          import(
            './features/bloc10-rapport/rapport.component'
          ).then((m) => m.RapportComponent),
      },

      // Consortium
      {
        path: 'consortium',
        loadComponent: () =>
          import(
            './features/consortium/consortium.component'
          ).then((m) => m.ConsortiumComponent),
      },

      // Admin — IA Configuration
      {
        path: 'admin/ia',
        loadComponent: () =>
          import(
            './features/admin-ia/admin-ia.component'
          ).then((m) => m.AdminIaComponent),
      },

      // Reporting
      {
        path: 'reporting',
        loadComponent: () =>
          import(
            './features/reporting/reporting.component'
          ).then((m) => m.ReportingComponent),
      },

      // Default route
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Auth routes (outside shell)
  {
    path: 'auth/login',
    loadComponent: () =>
      import(
        './features/auth/login/login.component'
      ).then((m) => m.LoginComponent),
  },

  // Catch-all
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
```

---

### 6. FEATURE PLACEHOLDERS

Pour chaque feature, créer:
1. `[feature].component.ts` — Composant standalone
2. `[feature].component.html` — Template minimal
3. `[feature].component.scss` — Styles

#### FILE: src/app/features/bloc0-dashboard/dashboard.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  title = 'Tableau de bord';

  constructor() {}

  ngOnInit(): void {}
}
```

#### FILE: src/app/features/bloc0-dashboard/dashboard.component.html

```html
<div class="container">
  <div class="page-header">
    <h1>{{ title }}</h1>
    <p class="subtitle">Bienvenue sur FinaCES</p>
  </div>

  <div class="placeholder-content">
    <div class="placeholder-card">
      <h2>Bloc 0 — Tableau de bord</h2>
      <p>À développer: statistiques, cas récents, alertes</p>
    </div>
  </div>
</div>
```

#### FILE: src/app/features/bloc0-dashboard/dashboard.component.scss

```scss
@import 'styles/variables';

.container {
  width: 100%;
  max-width: var(--max-width-content);
  margin: 0 auto;
  padding: var(--margin);
}

.page-header {
  margin-bottom: var(--space-2xl);

  h1 {
    font-size: var(--h1);
    color: var(--text-primary);
    margin-bottom: var(--space-sm);
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.placeholder-content {
  display: grid;
  gap: var(--space-lg);

  .placeholder-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-xl);
    box-shadow: var(--shadow-card);

    h2 {
      font-size: var(--h2);
      color: var(--text-primary);
      margin-bottom: var(--space-md);
    }

    p {
      color: var(--text-secondary);
      line-height: 1.6;
    }
  }
}
```

**Pour les autres features, utiliser le même pattern:**

- `bloc1a-recevabilite/`
- `bloc1b-gate/`
- `bloc2-financials/`
- `bloc3-normalization/`
- `bloc4-ratios/`
- `bloc5-scoring-mcc/`
- `bloc6-ia/`
- `bloc7-tension/`
- `bloc8-stress/`
- `bloc9-expert/`
- `bloc10-rapport/`
- `consortium/`
- `admin-ia/`
- `cases/cases-list/`
- `cases/case-workspace/`
- `auth/login/`
- `reporting/`

Chacun avec:
```typescript
// [name].component.ts
export class [Name]Component {
  title = '[Title]';
}

// [name].component.html (from snippet above)
```

---

### 7. APP.CONFIG.TS (PROVIDERS)

#### FILE: src/main.ts

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
  ],
}).catch((err) => console.error(err));
```

---

## CONTRAINTES ANGULAR

**Standalone components:** Tous les composants sont standalone
**Lazy loading:** Utilisé partout via `loadComponent`
**Material components:** Mat modules importés directement dans les composants
**Router:** Configuration plate dans `app.routes.ts`, pas de modules Angular
**Interceptors:** JWT injecté automatiquement via `withInterceptors`

---

## BINDING API

**Navigation:**
```typescript
// Via routerLink
<a routerLink="/cases" routerLinkActive="active">Dossiers</a>

// Via programmatic navigation
this.router.navigate(['/cases', caseId, 'financials']);
```

**Layout responsif:**
```html
<!-- Sidebar toggle -->
<button (click)="toggleSidebar()">Menu</button>

<!-- Conditional display -->
<div *ngIf="isOpen">Contenu visible</div>
```

---

## CRITÈRES DE VALIDATION

À la fin de ce prompt, vérifier:

✓ `ng serve` compile sans erreur
✓ App ouvre sur `http://localhost:4200` avec layout visible
✓ Sidebar et topbar affichés correctement
✓ Sidebar toggle fonctionne (sidebar collapse/expand)
✓ Navigation entre pages via sidebar links fonctionne
✓ Toutes les routes lazy-load correctement
✓ Router outlet affiche le contenu des features
✓ Search bar visible dans topbar
✓ User menu dans topbar fonctionne
✓ Notification bell badge affiche le nombre
✓ Active link highlighting dans sidebar
✓ Aucun error dans la console
✓ Responsive design fonctionne sur mobile
✓ Scrollbar styling appliqué
✓ Design tokens CSS appliqués (couleurs, fonts, spacing)
✓ Material components stylisés correctement

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

Total: **~40 fichiers** créés

```
src/app/
├── app.component.ts ...................... Root component
├── app.routes.ts ......................... Full routing tree
├── layout/
│   └── app-shell/
│       ├── app-shell.component.ts ........ Main shell
│       ├── app-shell.component.html
│       ├── app-shell.component.scss
│       ├── topbar/
│       │   ├── topbar.component.ts
│       │   ├── topbar.component.html
│       │   └── topbar.component.scss
│       └── sidebar/
│           ├── sidebar.component.ts
│           ├── sidebar.component.html
│           └── sidebar.component.scss
├── features/
│   ├── bloc0-dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   └── dashboard.component.scss
│   ├── bloc1a-recevabilite/
│   │   ├── recevabilite.component.ts
│   │   ├── recevabilite.component.html
│   │   └── recevabilite.component.scss
│   ├── bloc1b-gate/
│   │   ├── gate.component.ts
│   │   ├── gate.component.html
│   │   └── gate.component.scss
│   ├── bloc2-financials/
│   │   ├── financials.component.ts
│   │   ├── financials.component.html
│   │   └── financials.component.scss
│   ├── bloc3-normalization/
│   │   └── (same pattern)
│   ├── bloc4-ratios/
│   │   └── (same pattern)
│   ├── bloc5-scoring-mcc/
│   │   └── (same pattern)
│   ├── bloc6-ia/
│   │   └── (same pattern)
│   ├── bloc7-tension/
│   │   └── (same pattern)
│   ├── bloc8-stress/
│   │   └── (same pattern)
│   ├── bloc9-expert/
│   │   └── (same pattern)
│   ├── bloc10-rapport/
│   │   └── (same pattern)
│   ├── consortium/
│   │   └── (same pattern)
│   ├── admin-ia/
│   │   └── (same pattern)
│   ├── cases/
│   │   ├── cases-list/
│   │   │   └── (same pattern)
│   │   └── case-workspace/
│   │       └── (same pattern)
│   ├── auth/
│   │   └── login/
│   │       └── (same pattern)
│   └── reporting/
│       └── (same pattern)
└── main.ts ............................ Application bootstrap
```

---

## CHECKPOINT PHASE 0

À ce stade, l'application doit:

- ✓ Compiler et servir sans erreur (`ng serve`)
- ✓ Afficher le layout principal (Topbar 64px + Sidebar 240px + zone contenu)
- ✓ Naviguer entre les pages placeholder via la sidebar
- ✓ Tous les services HTTP typés et prêts à être appelés
- ✓ Tous les modèles TypeScript correspondant aux schemas Swagger
- ✓ Tous les design tokens CSS disponibles globalement
- ✓ Responsive design fonctionne (collapse sidebar sur mobile)
- ✓ Material components stylisés avec thème custom
- ✓ Aucun warning ou error dans la console

### La PHASE 0 — Infrastructure est complète.

Prochaines phases (PROMPT 4+):
- PHASE 1 (P04-P09): Développement des BLOCs (1A, 1B, 2, 3, 4, 5, 6, 7, 8, 9, 10)
- PHASE 2 (P10+): Features avancées (consortium, admin, reporting)
- PHASE 3 (P20+): Guards, interceptors avancés, auth
- PHASE 4 (P30+): Tests unitaires et e2e

---

## RÉFÉRENCES

- Design tokens: `/src/styles/_variables.scss`
- Layout specs: Section 4, Angular Architecture / Layout
- Routing: 12 routes principales + 5 sub-routes par case
- Case status machine: 9 states + CANCELLED
- Angular Material docs: https://material.angular.io/

