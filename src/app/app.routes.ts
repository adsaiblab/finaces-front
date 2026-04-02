import { Routes } from '@angular/router';
import { AppLayoutComponent } from './core/layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { uuidGuard } from './core/guards/uuid.guard';
import { consortiumGuard } from './core/guards/consortium.guard';

export const routes: Routes = [
  // 1. Routes publiques
  {
    path: 'auth/login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'FinaCES — Connexion',
  },

  // 2. Routes privées
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/bloc0-dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'FinaCES — Tableau de Bord',
      },
      {
        path: 'cases',
        loadComponent: () =>
          import('./features/cases/cases-list/cases-list.component').then((m) => m.CasesListComponent),
        title: 'FinaCES — Dossiers',
      },
      {
        path: 'cases/new',
        loadComponent: () =>
          import('./features/cases/case-create/case-create.component').then((m) => m.CaseCreateComponent),
        title: 'FinaCES — Nouveau Dossier',
      },
      {
        path: 'admin-ia',
        loadComponent: () =>
          import('./features/admin-ia/admin-ia.component').then((m) => m.AdminIaComponent),
        title: 'FinaCES — Administration IA',
      },

      // Espace de travail d’un dossier spécifique
      {
        path: 'cases/:id',
        canActivate: [uuidGuard],
        loadComponent: () =>
          import('./features/cases/case-workspace/case-workspace.component').then((m) => m.CaseWorkspaceComponent),
        children: [
          { path: '', redirectTo: 'recevabilite', pathMatch: 'full' },
          {
            path: 'recevabilite',
            loadComponent: () =>
              import('./features/bloc1a-recevabilite/recevabilite.component').then((m) => m.RecevabiliteComponent),
            title: 'FinaCES — Recevabilité',
          },
          {
            path: 'gate',
            loadComponent: () =>
              import('./features/bloc1b-gate/gate.component').then((m) => m.GateComponent),
            title: 'FinaCES — Gate Documents',
          },
          {
            path: 'financials',
            loadComponent: () =>
              import('./features/bloc2-financials/financials.component').then((m) => m.FinancialsComponent),
            title: 'FinaCES — États Financiers',
          },
          {
            path: 'normalization',
            loadComponent: () =>
              import('./features/bloc3-normalization/normalization.component').then((m) => m.NormalizationComponent),
            title: 'FinaCES — Normalisation',
          },
          {
            path: 'ratios',
            loadComponent: () =>
              import('./features/bloc4-ratios/bloc4-ratios.component').then((m) => m.Bloc4RatiosComponent),
            title: 'FinaCES — Ratios Financiers',
          },
          {
            path: 'scoring-mcc',
            loadComponent: () =>
              import('./features/bloc5-scoring-mcc/scoring-mcc.component').then((m) => m.ScoringMccComponent),
            title: 'FinaCES — Scoring MCC',
          },
          {
            path: 'ia',
            loadComponent: () =>
              import('./features/bloc6-ia/ia.component').then((m) => m.IaComponent),
            title: 'FinaCES — Analyse IA',
          },
          {
            path: 'tension',
            loadComponent: () =>
              import('./features/bloc7-tension/tension.component').then((m) => m.TensionComponent),
            title: 'FinaCES — Détection de Tension',
          },
          {
            path: 'stress',
            loadComponent: () =>
              import('./features/bloc8-stress/stress.component').then((m) => m.StressComponent),
            title: 'FinaCES — Stress Tests',
          },
          {
            path: 'expert',
            loadComponent: () =>
              import('./features/bloc9-expert/expert.component').then((m) => m.ExpertComponent),
            title: 'FinaCES — Revue Expert',
          },
          {
            path: 'rapport',
            loadComponent: () =>
              import('./features/bloc10-rapport/rapport.component').then((m) => m.RapportComponent),
            title: 'FinaCES — Rapport Final',
          },
          {
            path: 'consortium',
            loadComponent: () =>
              import('./features/bloc12-consortium/consortium.component').then((m) => m.ConsortiumComponent),
            canActivate: [consortiumGuard],
            title: 'FinaCES — Consortium',
          },
        ],
      },
    ],
  },

  // 3. Fallback 404
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
    title: 'FinaCES — Page introuvable',
  },
];
