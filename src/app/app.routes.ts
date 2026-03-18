import { Routes } from '@angular/router';
import { AppLayoutComponent } from './core/layout/app-layout/app-layout.component';

export const routes: Routes = [
    // 1. Routes publiques (Hors du layout principal)
    {
        path: 'auth/login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },

    // 2. Routes privées (À l'intérieur de l'App Shell)
    {
        path: '',
        component: AppLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/bloc0-dashboard/dashboard.component').then(m => m.DashboardComponent),
                title: 'FinaCES — Tableau de Bord'
            },
            {
                path: 'cases',
                loadComponent: () => import('./features/cases/cases-list/cases-list.component').then(m => m.CasesListComponent)
            },
            // NOUVELLE ROUTE : Création de dossier (Placée AVANT cases/:id)
            {
                path: 'cases/new',
                loadComponent: () => import('./features/cases/case-create/case-create.component').then(m => m.CaseCreateComponent),
                title: 'FinaCES — Nouveau Dossier'
            },
            {
                path: 'admin-ia',
                loadComponent: () => import('./features/admin-ia/admin-ia.component').then(m => m.AdminIaComponent)
            },
            {
                path: 'reporting',
                loadComponent: () => import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
            },

            // Espace de travail d'un dossier spécifique (Nested Routing pour les blocs)
            {
                path: 'cases/:id',
                loadComponent: () => import('./features/cases/case-workspace/case-workspace.component').then(m => m.CaseWorkspaceComponent),
                children: [
                    { path: '', redirectTo: 'recevabilite', pathMatch: 'full' },
                    { path: 'recevabilite', loadComponent: () => import('./features/bloc1a-recevabilite/recevabilite.component').then(m => m.RecevabiliteComponent) },
                    { path: 'gate', loadComponent: () => import('./features/bloc1b-gate/gate.component').then(m => m.GateComponent) },
                    { path: 'financials', loadComponent: () => import('./features/bloc2-financials/financials.component').then(m => m.FinancialsComponent) },
                    { path: 'normalization', loadComponent: () => import('./features/bloc3-normalization/normalization.component').then(m => m.NormalizationComponent) },
                    { path: 'ratios', loadComponent: () => import('./features/bloc4-ratios/ratios.component').then(m => m.RatiosComponent) },
                    { path: 'scoring-mcc', loadComponent: () => import('./features/bloc5-scoring-mcc/scoring-mcc.component').then(m => m.ScoringMccComponent) },
                    { path: 'ia', loadComponent: () => import('./features/bloc6-ia/ia.component').then(m => m.IaComponent) },
                    { path: 'tension', loadComponent: () => import('./features/bloc7-tension/tension.component').then(m => m.TensionComponent) },
                    { path: 'stress', loadComponent: () => import('./features/bloc8-stress/stress.component').then(m => m.StressComponent) },
                    { path: 'expert', loadComponent: () => import('./features/bloc9-expert/expert.component').then(m => m.ExpertComponent) },
                    { path: 'rapport', loadComponent: () => import('./features/bloc10-rapport/rapport.component').then(m => m.RapportComponent) },
                    { path: 'consortium', loadComponent: () => import('./features/consortium/consortium.component').then(m => m.ConsortiumComponent) },
                ]
            }
        ]
    },

    // 3. Fallback (404)
    { path: '**', redirectTo: 'dashboard' }
];