═══════════════════════════════════════════════════════════════════════════════
PROMPT 20 — Guards Angular (CaseStatusGuard + AuthGuard + redirection status)
Dépend de : PROMPT 17 (Bloc 10 — tous les blocs implémentés)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

PROMPT 3 (Infrastructure) a créé des guards placeholders. Ce prompt remplace ces placeholders
par des implémentations RÉELLES et FONCTIONNELLES:

1. **AuthGuard**: Vérifier authentication + roles
2. **CaseStatusGuard**: Vérifier case.status vs route requiredStatuses, rediriger selon status

Le système garantit que :
- Utilisateurs non authentifiés → redirect /auth/login
- Utilisateurs avec mauvais rôle → redirect /access-denied
- Case au mauvais statut → redirect vers l'étape courante (via resolveRouteFromStatus)

Ceci complète le flux sécurisé end-to-end et garantit l'intégrité du workflow.

## RÈGLES MÉTIER APPLICABLES

**Workflow Status Transitions:**
```
DRAFT
  ↓
PENDING_GATE (gate checks)
  ↓
FINANCIAL_INPUT (financial data entry)
  ↓
NORMALIZATION_DONE (data normalized)
  ↓
RATIOS_COMPUTED (financial ratios calculated)
  ↓
SCORING_DONE (MCC scoring completed)
  ↓
STRESS_DONE (stress tests completed)
  ↓
EXPERT_REVIEWED (expert review completed)
  ↓
CLOSED (rapport final, case closed)
```

**Guard Rules:**

1. **AuthGuard:**
   - Check auth.service.isAuthenticated()
   - If false → redirect to /auth/login (with returnUrl in query params)
   - If authenticated but role not in route.data['roles'] → redirect /access-denied
   - Otherwise → allow navigation

2. **CaseStatusGuard:**
   - Extract caseId from route.params['caseId']
   - Call CaseService.getCaseStatus(caseId)
   - Compare case.status with route.data['requiredStatuses']
   - If match → allow navigation
   - If no match → call resolveRouteFromStatus(status) to determine target route
   - Redirect to target route (with toast message)

3. **Route Status Mapping:**
   Each case status maps to a canonical route:
   - DRAFT → /cases/{id}/workspace
   - PENDING_GATE → /cases/{id}/gate
   - FINANCIAL_INPUT → /cases/{id}/financials
   - NORMALIZATION_DONE → /cases/{id}/normalization
   - RATIOS_COMPUTED → /cases/{id}/ratios
   - SCORING_DONE → /cases/{id}/scoring
   - STRESS_DONE → /cases/{id}/stress
   - EXPERT_REVIEWED → /cases/{id}/expert
   - CLOSED → /cases/{id}/rapport

**Exception Handling:**
- If CaseService fails (404, 500) → show error toast + stay on current page
- If user is ANALYST but ADMIN-only route → finaces-alert-box error
- If case inexistant → finaces-alert-box error + redirect to /cases (list)

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/guards/case-status.guard.ts`

**Modifier:**
- `src/app/app.routes.ts` → replace placeholder guard imports, ensure real guards used
- `src/app/core/services/auth.service.ts` → ensure isAuthenticated(), getCurrentRole() methods exist

**Dépendances Existantes:**
- AuthService (should exist from P3)
- CaseService.getCaseStatus(caseId): Observable<{status: string}>
- Router, ActivatedRoute

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### File: src/app/core/guards/auth.guard.ts

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * AuthGuard: Protects routes from unauthenticated users
 *
 * Usage in route data:
 * {
 *   path: 'cases',
 *   canActivate: [authGuard],
 *   data: { roles: ['ANALYST', 'ADMIN'] }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.auth.isAuthenticated().pipe(
      map(isAuth => {
        if (!isAuth) {
          // Store return URL for post-login redirect
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        // Check role-based access if route requires specific roles
        const requiredRoles = route.data['roles'] as string[] | undefined;
        if (requiredRoles && requiredRoles.length > 0) {
          const userRole = this.auth.getCurrentRole();
          if (!requiredRoles.includes(userRole)) {
            this.router.navigate(['/access-denied']);
            return false;
          }
        }

        return true;
      }),
      catchError(err => {
        console.error('AuthGuard error:', err);
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}

/**
 * Functional CanActivateFn version (Angular 15+)
 * More tree-shakeable than service-based guards
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated().pipe(
    map(isAuth => {
      if (!isAuth) {
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }

      const requiredRoles = route.data['roles'] as string[] | undefined;
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = auth.getCurrentRole();
        if (!requiredRoles.includes(userRole)) {
          router.navigate(['/access-denied']);
          return false;
        }
      }

      return true;
    }),
    catchError(err => {
      console.error('AuthGuard error:', err);
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};
```

### File: src/app/core/guards/case-status.guard.ts

```typescript
import { Injectable } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { CaseService } from '../services/case.service';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

/**
 * Maps case status to canonical route for auto-redirect
 */
function resolveRouteFromStatus(status: string, caseId: string): string {
  const statusToRoute: Record<string, string> = {
    'DRAFT': `/cases/${caseId}/workspace`,
    'PENDING_GATE': `/cases/${caseId}/gate`,
    'FINANCIAL_INPUT': `/cases/${caseId}/financials`,
    'NORMALIZATION_DONE': `/cases/${caseId}/normalization`,
    'RATIOS_COMPUTED': `/cases/${caseId}/ratios`,
    'SCORING_DONE': `/cases/${caseId}/scoring`,
    'STRESS_DONE': `/cases/${caseId}/stress`,
    'EXPERT_REVIEWED': `/cases/${caseId}/expert`,
    'CLOSED': `/cases/${caseId}/rapport`
  };

  return statusToRoute[status] || `/cases/${caseId}/workspace`;
}

/**
 * CaseStatusGuard: Ensures case is in correct status for route access
 * Redirects to appropriate step if case is at wrong stage
 *
 * Usage in route data:
 * {
 *   path: 'cases/:caseId/scoring',
 *   canActivate: [caseStatusGuard],
 *   data: { requiredStatuses: ['SCORING_DONE', 'STRESS_DONE'] }
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class CaseStatusGuard {
  constructor(
    private cases: CaseService,
    private router: Router,
    private notification: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const caseId = route.params['caseId'];

    if (!caseId) {
      console.error('CaseStatusGuard: caseId not found in route params');
      this.router.navigate(['/cases']);
      return of(false);
    }

    return this.cases.getCaseStatus(caseId).pipe(
      switchMap(caseData => {
        const currentStatus = caseData.status;
        const requiredStatuses = (route.data['requiredStatuses'] as string[] | undefined) || [];

        // If no required statuses specified, allow access
        if (!requiredStatuses || requiredStatuses.length === 0) {
          return of(true);
        }

        // Check if current status is in allowed list
        if (requiredStatuses.includes(currentStatus)) {
          return of(true);
        }

        // Status mismatch: redirect to canonical route for current status
        const targetRoute = resolveRouteFromStatus(currentStatus, caseId);
        const message = `Ce dossier est à l'étape '${this.humanizeStatus(currentStatus)}'. Redirection...`;

        this.notification.showWarning(message, 3000);
        this.router.navigate([targetRoute]);

        return of(false);
      }),
      catchError(error => {
        console.error('CaseStatusGuard error:', error);

        // Handle 404: case not found
        if (error.status === 404) {
          this.notification.showError('Ce dossier n\'existe pas.');
          this.router.navigate(['/cases']);
          return of(false);
        }

        // Handle 500 or other errors: allow retry
        this.notification.showError('Erreur lors de la vérification du statut du dossier.');
        return of(false);
      })
    );
  }

  private humanizeStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      'DRAFT': 'Brouillon',
      'PENDING_GATE': 'Gate Check en attente',
      'FINANCIAL_INPUT': 'Saisie des données financières',
      'NORMALIZATION_DONE': 'Normalisation complétée',
      'RATIOS_COMPUTED': 'Ratios calculés',
      'SCORING_DONE': 'Scoring MCC terminé',
      'STRESS_DONE': 'Stress Test terminé',
      'EXPERT_REVIEWED': 'Revue expert complétée',
      'CLOSED': 'Dossier clôturé'
    };

    return statusLabels[status] || status;
  }
}

/**
 * Functional CanActivateFn version (Angular 15+)
 */
export const caseStatusGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const cases = inject(CaseService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  const caseId = route.params['caseId'];

  if (!caseId) {
    console.error('CaseStatusGuard: caseId not found in route params');
    router.navigate(['/cases']);
    return of(false);
  }

  return cases.getCaseStatus(caseId).pipe(
    switchMap(caseData => {
      const currentStatus = caseData.status;
      const requiredStatuses = (route.data['requiredStatuses'] as string[] | undefined) || [];

      if (!requiredStatuses || requiredStatuses.length === 0) {
        return of(true);
      }

      if (requiredStatuses.includes(currentStatus)) {
        return of(true);
      }

      const targetRoute = resolveRouteFromStatus(currentStatus, caseId);
      notification.showWarning(
        `Ce dossier est à l'étape '${humanizeStatus(currentStatus)}'. Redirection...`,
        3000
      );
      router.navigate([targetRoute]);

      return of(false);
    }),
    catchError(error => {
      console.error('CaseStatusGuard error:', error);

      if (error.status === 404) {
        notification.showError('Ce dossier n\'existe pas.');
        router.navigate(['/cases']);
        return of(false);
      }

      notification.showError('Erreur lors de la vérification du statut du dossier.');
      return of(false);
    })
  );
};

function humanizeStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    'DRAFT': 'Brouillon',
    'PENDING_GATE': 'Gate Check en attente',
    'FINANCIAL_INPUT': 'Saisie des données financières',
    'NORMALIZATION_DONE': 'Normalisation complétée',
    'RATIOS_COMPUTED': 'Ratios calculés',
    'SCORING_DONE': 'Scoring MCC terminé',
    'STRESS_DONE': 'Stress Test terminé',
    'EXPERT_REVIEWED': 'Revue expert complétée',
    'CLOSED': 'Dossier clôturé'
  };

  return statusLabels[status] || status;
}
```

### File: src/app/app.routes.ts (Update)

```typescript
import { Routes } from '@angular/router';

// Guards
import { authGuard } from './core/guards/auth.guard';
import { caseStatusGuard } from './core/guards/case-status.guard';

// Components (examples, adjust based on actual component paths)
import { WorkspaceComponent } from './features/cases/workspace/workspace.component';
import { GateComponent } from './features/cases/blocs/bloc-1-gate/gate.component';
import { FinancialsComponent } from './features/cases/blocs/bloc-2-financials/financials.component';
import { Bloc3NormalizationComponent } from './features/cases/blocs/bloc-3-normalization/bloc-3-normalization.component';
import { Bloc4RatiosComponent } from './features/cases/blocs/bloc-4-ratios/bloc-4-ratios.component';
import { Bloc5LiquiditeComponent } from './features/cases/blocs/bloc-5-liquidite/bloc-5-liquidite.component';
import { Bloc6SolvabiliteComponent } from './features/cases/blocs/bloc-6-solvabilite/bloc-6-solvabilite.component';
import { Bloc7RentabiliteComponent } from './features/cases/blocs/bloc-7-rentabilite/bloc-7-rentabilite.component';
import { Bloc8CapaciteComponent } from './features/cases/blocs/bloc-8-capacite/bloc-8-capacite.component';
import { Bloc9ExpertComponent } from './features/cases/blocs/bloc-9-expert/bloc-9-expert.component';
import { Bloc10RapportComponent } from './features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component';

export const routes: Routes = [
  // Auth routes (no guards)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent }
    ]
  },

  // Cases list and detail routes
  {
    path: 'cases',
    canActivate: [authGuard],
    data: { roles: ['ANALYST', 'ADMIN', 'VIEWER'] },
    children: [
      {
        path: '',
        component: CasesListComponent
      },

      // Case workspace (DRAFT)
      {
        path: ':caseId/workspace',
        component: WorkspaceComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['DRAFT']
        }
      },

      // Bloc 1: Gate Check (PENDING_GATE)
      {
        path: ':caseId/gate',
        component: GateComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['PENDING_GATE', 'FINANCIAL_INPUT']
        }
      },

      // Bloc 2: Financial Input (FINANCIAL_INPUT)
      {
        path: ':caseId/financials',
        component: FinancialsComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['FINANCIAL_INPUT', 'NORMALIZATION_DONE']
        }
      },

      // Bloc 3: Normalization (NORMALIZATION_DONE)
      {
        path: ':caseId/normalization',
        component: Bloc3NormalizationComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['NORMALIZATION_DONE', 'RATIOS_COMPUTED']
        }
      },

      // Bloc 4: Ratios (RATIOS_COMPUTED)
      {
        path: ':caseId/ratios',
        component: Bloc4RatiosComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['RATIOS_COMPUTED', 'SCORING_DONE']
        }
      },

      // Bloc 5-8: Scoring (Liquidité, Solvabilité, Rentabilité, Capacité)
      {
        path: ':caseId/scoring',
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED']
        },
        children: [
          { path: 'liquidite', component: Bloc5LiquiditeComponent },
          { path: 'solvabilite', component: Bloc6SolvabiliteComponent },
          { path: 'rentabilite', component: Bloc7RentabiliteComponent },
          { path: 'capacite', component: Bloc8CapaciteComponent }
        ]
      },

      // Bloc 9: Expert Review (EXPERT_REVIEWED)
      {
        path: ':caseId/expert',
        component: Bloc9ExpertComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED']
        }
      },

      // Bloc 10: Rapport (CLOSED)
      {
        path: ':caseId/rapport',
        component: Bloc10RapportComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN', 'VIEWER'],
          requiredStatuses: ['CLOSED']
        }
      },

      // Consortium (special, GROUPEMENT type only)
      {
        path: ':caseId/consortium',
        component: Bloc12ConsortiumComponent,
        canActivate: [authGuard, caseStatusGuard],
        data: {
          roles: ['ANALYST', 'ADMIN'],
          requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'],
          caseTypeRequired: 'GROUPEMENT'
        }
      }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['ADMIN', 'ADMIN_ML'] },
    children: [
      {
        path: 'ia',
        component: AdminIaComponent,
        data: { roles: ['ADMIN_ML', 'ADMIN'] }
      },
      {
        path: 'users',
        component: AdminUsersComponent,
        data: { roles: ['ADMIN'] }
      }
    ]
  },

  // Error routes
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  },

  // Fallback
  {
    path: '',
    redirectTo: '/cases',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];
```

### AuthService Methods (to verify exist)

```typescript
// src/app/core/services/auth.service.ts

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Check if user is authenticated (has valid token)
   * Returns Observable<boolean>
   */
  isAuthenticated(): Observable<boolean> {
    // Implementation: check JWT token, validate with backend if needed
  }

  /**
   * Get current user's role
   * Returns string (ANALYST | ADMIN | ADMIN_ML | VIEWER)
   */
  getCurrentRole(): string {
    // Implementation: decode JWT or fetch from user profile
  }

  /**
   * Login user
   */
  login(username: string, password: string): Observable<AuthResponse> {
    // Implementation
  }

  /**
   * Logout user
   */
  logout(): void {
    // Implementation: clear token, invalidate session
  }
}
```

### CaseService.getCaseStatus() Method

```typescript
// src/app/core/services/case.service.ts

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  /**
   * Get case status (lightweight, for guard checks)
   * Returns Observable<{status: string, id: string}>
   */
  getCaseStatus(caseId: string): Observable<{status: string; id: string}> {
    return this.http.get<{status: string; id: string}>(
      `/api/v1/cases/${caseId}/status`
    );
  }

  /**
   * Get full case details
   */
  getCaseById(caseId: string): Observable<CaseDetailDTO> {
    return this.http.get<CaseDetailDTO>(`/api/v1/cases/${caseId}`);
  }
}
```

### NotificationService (Toast Messages)

```typescript
// src/app/core/services/notification.service.ts

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  showSuccess(message: string, duration: number = 5000): void {
    // Implementation: use snackBar.open or toast
  }

  showWarning(message: string, duration: number = 5000): void {
    // Implementation: use snackBar.open with warn style
  }

  showError(message: string, duration: number = 5000): void {
    // Implementation: use snackBar.open with error style
  }
}
```

## CONTRAINTES ANGULAR

**Guard Architecture:**
- Use `CanActivateFn` (functional, Angular 15+) for simplicity and tree-shaking
- Fallback: service-based `CanActivate` if functional guards not available
- Both implementations provided above

**HttpClient & Error Handling:**
- Guards call HttpClient to fetch case status
- HTTP errors (404, 500) caught and handled gracefully
- Redirect logic in catch block

**Navigation:**
- Use `Router.navigate()` for redirects
- Include queryParams for returnUrl on login redirect
- Toast messages via NotificationService for user feedback

**Route Data:**
- Use `route.data['requiredStatuses']` to specify allowed statuses
- Use `route.data['roles']` for role-based access
- Use `route.data['caseTypeRequired']` for case type checks (optional)

**Observable Chains:**
- Use `switchMap` to chain API calls
- Use `catchError` for error handling
- Use `map` to extract relevant data

## BINDING API

### GET Case Status (Lightweight)
```
GET /api/v1/cases/{caseId}/status
Response: {
  id: string,
  status: "DRAFT" | "PENDING_GATE" | ... | "CLOSED"
}
```

### GET Full Case (if needed)
```
GET /api/v1/cases/{caseId}
Response: CaseDetailDTO {...}
```

## CRITÈRES DE VALIDATION

### Guard Functionality
1. ✅ AuthGuard blocks unauthenticated users (redirect to /auth/login)
2. ✅ AuthGuard checks roles (redirect to /access-denied if insufficient)
3. ✅ AuthGuard preserves returnUrl (queryParam on redirect)
4. ✅ CaseStatusGuard allows correct statuses (status in requiredStatuses)
5. ✅ CaseStatusGuard redirects wrong statuses (call resolveRouteFromStatus)
6. ✅ Status-to-route mapping accurate (DRAFT → workspace, PENDING_GATE → gate, etc.)
7. ✅ Toast messages shown on redirect (warning toast with humanized status)
8. ✅ Error handling graceful (404 → alert + redirect to /cases)

### Route Configuration
1. ✅ All case routes have [authGuard, caseStatusGuard]
2. ✅ All admin routes have [authGuard] with roles check
3. ✅ route.data properly configured with roles and requiredStatuses
4. ✅ No unguarded routes except /auth/*, /access-denied, /404
5. ✅ Wildcard route redirects to 404 component (not 500 error)

### User Experience
1. ✅ Toast message clear and localized ("Ce dossier est à l'étape...")
2. ✅ Redirect smooth (no flickering)
3. ✅ returnUrl preserved for post-login redirect
4. ✅ No console errors on guard execution
5. ✅ Loading state during guard async check (optional spinner)

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/app/core/guards/auth.guard.ts**
   - Service-based and functional versions
   - isAuthenticated check, role validation
   - Redirect logic with returnUrl

2. **src/app/core/guards/case-status.guard.ts**
   - Service-based and functional versions
   - resolveRouteFromStatus() helper
   - humanizeStatus() for user messages
   - Error handling (404, 500)

3. **src/app/app.routes.ts (updated)**
   - All routes with proper guard configuration
   - route.data with roles and requiredStatuses
   - Child routes for case detail sections
   - Admin routes with role restrictions

4. **Required Service Methods (verified to exist):**
   - AuthService.isAuthenticated()
   - AuthService.getCurrentRole()
   - CaseService.getCaseStatus(caseId)
   - NotificationService.showWarning()
   - NotificationService.showError()

