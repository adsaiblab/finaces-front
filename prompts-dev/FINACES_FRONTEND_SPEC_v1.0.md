
***

```markdown
# FINACES_FRONTEND_SPEC_v1.0.md
# Spécification Complète Frontend — FinaCES Double Rail
**Version :** 1.0 — Référence de développement FROM SCRATCH  
**Date :** 2026-03-16  
**Statut :** DOCUMENT DE RÉFÉRENCE OFFICIEL  
**Sources consolidées :** finaces-api (GitHub) + Swagger OAS 3.1 + Double_Rail_FinaCES.md + PROMPT_maquette.md

---

## TABLE DES MATIÈRES

1. [Contexte Métier & Vision Système](#1-contexte-métier--vision-système)
2. [Machine à États — case_status](#2-machine-à-états--case_status)
3. [Design System Complet](#3-design-system-complet)
4. [Architecture Angular — Routing Complet](#4-architecture-angular--routing-complet)
5. [Composants Atomiques & Moléculaires](#5-composants-atomiques--moléculaires)
6. [BLOC 0 — Dashboard Unifié Double Rail](#6-bloc-0--dashboard-unifié-double-rail)
7. [BLOC 1A — Recevabilité & Création de Dossier](#7-bloc-1a--recevabilité--création-de-dossier)
8. [BLOC 1B — Gate Documentaire](#8-bloc-1b--gate-documentaire)
9. [BLOC 2 — États Financiers](#9-bloc-2--états-financiers)
10. [BLOC 3 — Normalisation IFRS](#10-bloc-3--normalisation-ifrs)
11. [BLOC 4 — Ratios Financiers](#11-bloc-4--ratios-financiers)
12. [BLOC 5 — Scoring MCC (Rail 1)](#12-bloc-5--scoring-mcc-rail-1)
13. [BLOC 6 — Prédiction IA + SHAP (Rail 2)](#13-bloc-6--prédiction-ia--shap-rail-2)
14. [BLOC 7 — Analyse de Tension MCC ↔ IA](#14-bloc-7--analyse-de-tension-mcc--ia)
15. [BLOC 8 — Stress Test Contractuel](#15-bloc-8--stress-test-contractuel)
16. [BLOC 9 — Expert Review & Conclusion](#16-bloc-9--expert-review--conclusion)
17. [BLOC 10 — Rapport Final & Export](#17-bloc-10--rapport-final--export)
18. [BLOC CONSORTIUM — Cas Groupement](#18-bloc-consortium--cas-groupement)
19. [BLOC ADMIN IA — Gestion Modèles](#19-bloc-admin-ia--gestion-modèles)
20. [États d'Exception & Empty States](#20-états-dexception--empty-states)
21. [Responsive Tablet](#21-responsive-tablet)
22. [Custom Components — Spec @Input/@Output](#22-custom-components--spec-inputoutput)
23. [Mapping API Complet — Écran → Endpoint → Schema](#23-mapping-api-complet--écran--endpoint--schema)
24. [Design Tokens JSON / SCSS](#24-design-tokens-json--scss)
25. [Guards Angular & Règles de Navigation](#25-guards-angular--règles-de-navigation)

---

## 1. Contexte Métier & Vision Système

### 1.1 Définition

FinaCES (Financial Capacity Evaluation System) est une plateforme d'évaluation de la **capacité financière des soumissionnaires à des marchés publics/privés MCC**. Elle opère selon deux rails parallèles et indépendants qui convergent en un rapport de décision finale.

### 1.2 Les Deux Rails — Principe Fondamental

```

┌──────────────────────────────────────────────────────────┐
│                    FLUX GLOBAL FINACES                    │
│                                                          │
│  BLOC 0 ─── Dashboard Unifié (vue macro)                 │
│      │                                                   │
│  BLOC 1A ── Recevabilité + Création Dossier              │
│      │                                                   │
│  BLOC 1B ── Gate Documentaire                            │
│      │                                                   │
│  BLOC 2 ─── Saisie États Financiers (3 exercices)        │
│      │                                                   │
│  BLOC 3 ─── Normalisation IFRS                           │
│      │                                                   │
│  BLOC 4 ─── Calcul des Ratios                            │
│      │                                                   │
│   ┌──┴──────────────────────┐                            │
│   │                         │                            │
│ BLOC 5               BLOC 6                              │
│ Scoring MCC          Prédiction IA                       │
│ (Rail 1 Officiel)    (Rail 2 Challenge)                  │
│   │                         │                            │
│   └──────────┬──────────────┘                            │
│              │                                           │
│          BLOC 7 ── Analyse Tension MCC ↔ IA              │
│              │                                           │
│          BLOC 8 ── Stress Test Contractuel               │
│              │                                           │
│          BLOC 9 ── Expert Review & Conclusion            │
│              │                                           │
│          BLOC 10 ── Rapport Final + Export               │
└──────────────────────────────────────────────────────────┘

```

### 1.3 Règles Métier Absolues

| Règle | Description |
|---|---|
| **MCC-R1** | Le score MCC est la SEULE source décisionnelle fiduciaire officielle |
| **MCC-R2** | L'IA ne peut jamais remplacer ni altérer le score MCC |
| **MCC-R3** | Chaque écran montrant un score IA DOIT afficher le disclaimer "Outil de challenge — non décisionnel" |
| **MCC-R4** | Hiérarchie visuelle : MCC > IA (taille, position, couleur) |
| **MCC-R5** | Tension MODERATE ou SEVERE → commentaire analyste OBLIGATOIRE avant clôture |
| **MCC-R6** | Le Gate Documentaire doit être passé (is_passed = true) avant toute saisie financière |
| **MCC-R7** | Les ratios doivent être calculés sur données normalisées uniquement |

### 1.4 Types de Dossiers (case_type)

| case_type | Description | Blocs spécifiques |
|---|---|---|
| `SINGLE` | Soumissionnaire unique | Flux standard |
| `GROUPEMENT` | Consortium / JV | + BLOC CONSORTIUM |
| `LOTS` | Marché à lots multiples | Flux standard × N lots |

---

## 2. Machine à États — case_status

### 2.1 Diagramme de Transitions

```

DRAFT ──────────────────────────────────────────────────────────┐
  │  POST /api/v1/cases                                         │
  ▼                                                             │
PENDING_GATE ────── PATCH /api/v1/cases/{id}/status ──────────► CANCELLED
  │  POST /api/v1/cases/{id}/gate/evaluate (is_passed=true)    │
  ▼                                                             │
FINANCIAL_INPUT ── POST /api/v1/cases/{id}/financials          │
  │  POST /api/v1/cases/{id}/normalize                         │
  ▼                                                             │
NORMALIZATION_DONE                                              │
  │  POST /api/v1/cases/{id}/ratios/compute                    │
  ▼                                                             │
RATIOS_COMPUTED                                                 │
  │  POST /api/v1/cases/{id}/score  [Rail 1]                   │
  │  POST /api/v1/cases/{id}/ia/predict  [Rail 2]              │
  ▼                                                             │
SCORING_DONE                                                    │
  │  POST /api/v1/cases/{id}/stress/run                        │
  ▼                                                             │
STRESS_DONE                                                     │
  │  POST /api/v1/cases/{id}/experts/review                    │
  ▼                                                             │
EXPERT_REVIEWED                                                 │
  │  PATCH /api/v1/cases/{id}/conclusion                       │
  ▼                                                             │
CLOSED ◄────────────────────────────────────────────────────────┘

```

### 2.2 Mapping status → Stepper Angular

| status backend | Étape active Angular | Blocs accessibles |
|---|---|---|
| `DRAFT` | Étape 1 | BLOC 1A uniquement |
| `PENDING_GATE` | Étape 2 | BLOC 1B (Gate) |
| `FINANCIAL_INPUT` | Étape 3 | BLOC 2 (États financiers) |
| `NORMALIZATION_DONE` | Étape 4 | BLOC 3 (lire résultat norm.) |
| `RATIOS_COMPUTED` | Étape 5 | BLOC 4 (lire ratios) |
| `SCORING_DONE` | Étapes 6+7 | BLOC 5 (MCC) + BLOC 6 (IA) + BLOC 7 (Tension) |
| `STRESS_DONE` | Étape 8 | BLOC 8 (Stress) |
| `EXPERT_REVIEWED` | Étape 9 | BLOC 9 (Expert) |
| `CLOSED` | Étape 10 | BLOC 10 (Rapport final) |
| `CANCELLED` | — | Vue en lecture seule + badge ANNULÉ |

### 2.3 Guards Angular à implémenter

```typescript
// Règle : on ne peut accéder à un bloc que si le status minimum est atteint
const BLOC_STATUS_GUARD: Record<string, string[]> = {
  'bloc1b-gate':        ['PENDING_GATE', 'FINANCIAL_INPUT', ...],
  'bloc2-financials':   ['FINANCIAL_INPUT', 'NORMALIZATION_DONE', ...],
  'bloc3-normalization':['NORMALIZATION_DONE', 'RATIOS_COMPUTED', ...],
  'bloc4-ratios':       ['RATIOS_COMPUTED', 'SCORING_DONE', ...],
  'bloc5-scoring':      ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'],
  'bloc6-ia':           ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'],
  'bloc7-tension':      ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'],
  'bloc8-stress':       ['STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'],
  'bloc9-expert':       ['EXPERT_REVIEWED', 'CLOSED'],
  'bloc10-rapport':     ['CLOSED'],
};
```

---

## 3. Design System Complet

### 3.1 Grille et Layout

```
Desktop  : 1440px — 12 colonnes — gutters 24px — margins 32px
Tablet   : 1024px — 8 colonnes  — gutters 16px — margins 24px
Mobile   : 375px  — 4 colonnes  — gutters 8px  — margins 16px

Layout principal :
┌─────────────────────────────────────────────────────┐
│  Topbar fixe — 64px                                  │
├────────────┬────────────────────────────────────────┤
│  Sidebar   │  Main Content (fluid)                  │
│  fixe 240px│  max-width: 1160px, centré             │
│            │  padding: 32px                         │
└────────────┴────────────────────────────────────────┘
```

### 3.2 Tokens de Couleur — Spécification Complète

```scss
// ═══════════════════════════════
// RAIL MCC (Officiel — vert→rouge)
// ═══════════════════════════════
--mcc-low:          #22C55E;   // FAIBLE
--mcc-moderate:     #F59E0B;   // MODÉRÉ
--mcc-high:         #F97316;   // ÉLEVÉ
--mcc-critical:     #EF4444;   // CRITIQUE
--mcc-surface:      #F8FAFC;   // Fond section MCC
--mcc-border:       #E2E8F0;   // Bordure section MCC
--mcc-surface-low:  #F0FDF4;   // Fond card FAIBLE
--mcc-surface-mod:  #FFFBEB;   // Fond card MODÉRÉ
--mcc-surface-high: #FFF7ED;   // Fond card ÉLEVÉ
--mcc-surface-crit: #FEF2F2;   // Fond card CRITIQUE

// ═══════════════════════════════
// RAIL IA (Challenge — bleu→violet)
// ═══════════════════════════════
--ia-low:           #3B82F6;   // IA_LOW
--ia-moderate:      #6366F1;   // IA_MODERATE
--ia-high:          #8B5CF6;   // IA_HIGH
--ia-critical:      #A855F7;   // IA_CRITICAL
--ia-surface:       #F0F4FF;   // Fond section IA
--ia-border:        #C7D2FE;   // Bordure section IA

// ═══════════════════════════════
// TENSION
// ═══════════════════════════════
--tension-none:     #22C55E;
--tension-mild:     #3B82F6;
--tension-moderate: #F59E0B;
--tension-severe:   #EF4444;
--tension-severe-bg:#FEF2F2;
--tension-severe-border: #FECACA;

// ═══════════════════════════════
// NEUTRES & GLOBAL
// ═══════════════════════════════
--primary:          #1E3A5F;   // Brand — bleu marine
--primary-light:    #2D5B8E;
--secondary:        #64748B;
--bg-default:       #F8FAFC;
--bg-card:          #FFFFFF;
--bg-sidebar:       #0F172A;
--sidebar-text:     #94A3B8;
--sidebar-active:   #FFFFFF;
--sidebar-active-bg:#1E3A5F;
--text-primary:     #0F172A;
--text-secondary:   #475569;
--text-disabled:    #94A3B8;
--border:           #E2E8F0;
--border-strong:    #CBD5E1;
--success:          #22C55E;
--warning:          #F59E0B;
--error:            #EF4444;
--info:             #3B82F6;

// ═══════════════════════════════
// OMBRES
// ═══════════════════════════════
--shadow-sm:  0 1px 3px rgba(0,0,0,0.08);
--shadow-md:  0 4px 12px rgba(0,0,0,0.10);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.12);
--shadow-card: 0 2px 8px rgba(0,0,0,0.06);
```

### 3.3 Typographie

```scss
// Font stack
--font-primary:  'Inter', -apple-system, sans-serif;
--font-mono:     'JetBrains Mono', 'Fira Code', monospace;

// Échelle typographique
// H1  : 28px / Bold (700)    / --text-primary / lh 1.3
// H2  : 22px / SemiBold (600)/ --text-primary / lh 1.3
// H3  : 18px / SemiBold (600)/ --text-primary / lh 1.4
// H4  : 14px / SemiBold (600)/ --text-secondary / lh 1.5 / uppercase / ls 0.05em
// Body: 14px / Regular (400) / --text-primary / lh 1.6
// Body Small: 12px / Regular / --text-secondary / lh 1.5
// Label: 12px / Medium (500) / --text-secondary / uppercase / ls 0.04em
// Code: 13px / --font-mono   / --text-primary
// Score Large: 40px / Bold   / contextuel (MCC ou IA)
// Score Medium: 28px / Bold  / contextuel
```

### 3.4 Espacements (8pt grid)

```
4px   — micro (séparateurs internes)
8px   — xs    (padding inputs, gaps internes)
12px  — sm    (gaps composants compacts)
16px  — md    (padding cards, gaps standards)
24px  — lg    (sections, gutters)
32px  — xl    (padding page, sections majeures)
48px  — 2xl   (espacement entre blocs)
64px  — 3xl   (topbar height, grands espacements)
```

---

## 4. Architecture Angular — Routing Complet

### 4.1 Structure des Modules

```
src/
├── app/
│   ├── app.component.ts          (shell avec <router-outlet>)
│   ├── app.routes.ts             (routing principal)
│   ├── core/
│   │   ├── services/
│   │   │   ├── case.service.ts
│   │   │   ├── financial.service.ts
│   │   │   ├── ia.service.ts
│   │   │   ├── auth.service.ts
│   │   │   └── audit.service.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── case-status.guard.ts
│   │   ├── interceptors/
│   │   │   └── jwt.interceptor.ts
│   │   └── models/
│   │       ├── case.model.ts
│   │       ├── financial.model.ts
│   │       ├── scoring.model.ts
│   │       └── ia.model.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── finaces-risk-badge/
│   │   │   ├── finaces-tension-badge/
│   │   │   ├── finaces-score-gauge/
│   │   │   ├── finaces-shap-chart/
│   │   │   ├── finaces-pillar-row/
│   │   │   ├── finaces-ia-disclaimer/
│   │   │   └── finaces-stress-chart/
│   │   └── pipes/
│   │       ├── currency-format.pipe.ts
│   │       └── risk-class-label.pipe.ts
│   ├── layout/
│   │   ├── app-shell/
│   │   │   ├── app-shell.component.ts
│   │   │   ├── sidebar/
│   │   │   └── topbar/
│   ├── features/
│   │   ├── bloc0-dashboard/
│   │   ├── bloc1a-recevabilite/
│   │   ├── bloc1b-gate/
│   │   ├── bloc2-financials/
│   │   ├── bloc3-normalization/
│   │   ├── bloc4-ratios/
│   │   ├── bloc5-scoring-mcc/
│   │   ├── bloc6-ia/
│   │   ├── bloc7-tension/
│   │   ├── bloc8-stress/
│   │   ├── bloc9-expert/
│   │   ├── bloc10-rapport/
│   │   ├── consortium/
│   │   └── admin-ia/
```

### 4.2 app.routes.ts Complet

```typescript
export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/bloc0-dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        title: 'FinaCES — Tableau de Bord'
      },
      {
        path: 'cases',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/cases-list/cases-list.component')
              .then(m => m.CasesListComponent),
            title: 'Dossiers d\'évaluation'
          },
          {
            path: 'new',
            loadComponent: () => import('./features/bloc1a-recevabilite/recevabilite.component')
              .then(m => m.RecevabiliteComponent),
            title: 'Nouveau Dossier'
          },
          {
            path: ':caseId',
            children: [
              {
                path: '',
                redirectTo: 'workspace',
                pathMatch: 'full'
              },
              {
                path: 'workspace',
                loadComponent: () => import('./features/case-workspace/case-workspace.component')
                  .then(m => m.CaseWorkspaceComponent)
              },
              {
                path: 'gate',
                loadComponent: () => import('./features/bloc1b-gate/gate.component')
                  .then(m => m.GateComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['PENDING_GATE', 'FINANCIAL_INPUT', 'NORMALIZATION_DONE', 'RATIOS_COMPUTED', 'SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'financials',
                loadComponent: () => import('./features/bloc2-financials/financials.component')
                  .then(m => m.FinancialsComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['FINANCIAL_INPUT', 'NORMALIZATION_DONE', 'RATIOS_COMPUTED', 'SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'normalization',
                loadComponent: () => import('./features/bloc3-normalization/normalization.component')
                  .then(m => m.NormalizationComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['NORMALIZATION_DONE', 'RATIOS_COMPUTED', 'SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'ratios',
                loadComponent: () => import('./features/bloc4-ratios/ratios.component')
                  .then(m => m.RatiosComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['RATIOS_COMPUTED', 'SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'scoring',
                loadComponent: () => import('./features/bloc5-scoring-mcc/scoring.component')
                  .then(m => m.ScoringComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'ia',
                loadComponent: () => import('./features/bloc6-ia/ia.component')
                  .then(m => m.IaComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'tension',
                loadComponent: () => import('./features/bloc7-tension/tension.component')
                  .then(m => m.TensionComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'stress',
                loadComponent: () => import('./features/bloc8-stress/stress.component')
                  .then(m => m.StressComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'expert',
                loadComponent: () => import('./features/bloc9-expert/expert.component')
                  .then(m => m.ExpertComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['EXPERT_REVIEWED', 'CLOSED'] }
              },
              {
                path: 'rapport',
                loadComponent: () => import('./features/bloc10-rapport/rapport.component')
                  .then(m => m.RapportComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['CLOSED'] }
              },
              {
                path: 'consortium',
                loadComponent: () => import('./features/consortium/consortium.component')
                  .then(m => m.ConsortiumComponent),
                canActivate: [CaseStatusGuard],
                data: { requiredStatuses: ['SCORING_DONE', 'STRESS_DONE', 'EXPERT_REVIEWED', 'CLOSED'], caseType: 'GROUPEMENT' }
              }
            ]
          }
        ]
      },
      {
        path: 'admin/ia',
        loadComponent: () => import('./features/admin-ia/admin-ia.component')
          .then(m => m.AdminIaComponent),
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN_ML', 'ADMIN'] }
      },
      {
        path: 'reporting',
        loadComponent: () => import('./features/reporting/reporting.component')
          .then(m => m.ReportingComponent)
      }
    ]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
```

---

## 5. Composants Atomiques & Moléculaires

### 5.1 `<finaces-risk-badge>`

**Usage :** Affichage de la classe de risque MCC ou IA.

```typescript
@Input() riskClass: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
@Input() rail: 'MCC' | 'IA' = 'MCC';
@Input() size: 'sm' | 'md' = 'md';
@Input() showLabel: boolean = true;
```

**Rendu visuel :**

```
MCC rail  → fond coloré opaque, texte blanc, radius 6px
  sm (20px height): [FAIBLE] [MODÉRÉ] [ÉLEVÉ] [CRITIQUE]
  md (24px height): même + icône

IA rail   → fond coloré 15% opacité, texte coloré, radius 6px, préfixe "IA "
  → [IA LOW] [IA MODERATE] [IA HIGH] [IA CRITICAL]
  → couleurs : bleu → violet (JAMAIS spectre vert→rouge)
```

**Couleurs :**

```scss
&.mcc {
  &.low      { background: var(--mcc-low);      color: #fff; }
  &.moderate { background: var(--mcc-moderate); color: #fff; }
  &.high     { background: var(--mcc-high);     color: #fff; }
  &.critical { background: var(--mcc-critical); color: #fff; }
}
&.ia {
  &.low      { background: rgba(59,130,246,.15);  color: var(--ia-low);      border: 1px solid var(--ia-low); }
  &.moderate { background: rgba(99,102,241,.15);  color: var(--ia-moderate); border: 1px solid var(--ia-moderate); }
  &.high     { background: rgba(139,92,246,.15);  color: var(--ia-high);     border: 1px solid var(--ia-high); }
  &.critical { background: rgba(168,85,247,.15);  color: var(--ia-critical); border: 1px solid var(--ia-critical); }
}
```

---

### 5.2 `<finaces-tension-badge>`

```typescript
@Input() level: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
@Input() direction?: 'UP' | 'DOWN';   // UP = IA plus pessimiste
@Input() delta?: number;               // ex: 2 (niveaux d'écart)
@Input() size: 'sm' | 'md' = 'md';
```

**Rendu visuel :**

```
NONE     → chip vert  ✓ — texte "Convergence"
MILD     → chip bleu  ℹ — texte "Tension légère" + direction
MODERATE → chip orange ⚠ — texte "Tension modérée" + delta
SEVERE   → chip rouge 🔴 — fond rouge 10%, border rouge — texte "TENSION MAJEURE"
           + direction (↑ UP ou ↓ DOWN)
```

---

### 5.3 `<finaces-score-gauge>`

**Jauge circulaire SVG D3.**

```typescript
@Input() score: number;          // 0 à 5
@Input() maxScore: number = 5;
@Input() rail: 'MCC' | 'IA' = 'MCC';
@Input() riskClass: string;      // pour couleur contextuelle
@Input() size: 80 | 120 | 160 = 120;
@Input() animated: boolean = true; // animation 0→valeur en 800ms
@Input() showLabel: boolean = true;
@Output() rendered = new EventEmitter<void>();
```

**Rendu :**

```
- Arc SVG 270° (de -135° à +135°)
- Couleur de remplissage selon riskClass (MCC: vert→rouge / IA: bleu→violet)
- Fond arc : gris clair (#E2E8F0)
- Texte central : valeur (ex: "3.2") en Score Large / "/ 5" en Body Small
- Animation : requestAnimationFrame 0 → score en 800ms
```

---

### 5.4 `<finaces-pillar-row>`

```typescript
@Input() pillarId: string;         // ex: 'liquidity'
@Input() pillarName: string;       // ex: 'Liquidité'
@Input() pillarIcon: string;       // Material icon name
@Input() score: number;            // score /5
@Input() weight: number;           // poids en %
@Input() trend: string[];          // signaux du backend
@Input() signals: string[];        // alertes du backend
@Input() detailText: string;       // texte détail du backend
@Input() isExpanded: boolean = false;
@Output() toggleExpand = new EventEmitter<string>();
```

---

### 5.5 `<finaces-shap-chart>`

**Graphique barres bicolores horizontal pour SHAP values.**

```typescript
@Input() features: ShapFeature[];  // { name, value, shapValue, direction }
@Input() maxFeatures: number = 10;
@Input() showValues: boolean = true;
```

```typescript
interface ShapFeature {
  name: string;           // ex: 'debt_to_equity'
  rawValue: number;       // valeur brute du ratio
  shapValue: number;      // valeur SHAP (+/-)
  direction: 'UP' | 'DOWN'; // UP = augmente le risque
  label?: string;         // libellé humain optionnel
}
```

**Rendu :**

```
Barre positive (risque ↑) : rouge dégradé, vers la droite
Barre négative (risque ↓) : vert dégradé, vers la gauche
Axe central vertical : zéro
Chaque ligne : [nom_feature (valeur_brute)] [barre] [+0.32 🔴 Risque ↑]
```

---

### 5.6 `<finaces-ia-disclaimer>`

```typescript
@Input() variant: 'banner' | 'inline' | 'chip' = 'banner';
@Input() dismissible: boolean = false;
@Input() pilotMode: boolean = false;
```

**Rendu `banner` (obligatoire en haut de toute page IA) :**

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️  Ce scoring IA est un outil de challenge             │
│     NON DÉCISIONNEL. Il ne remplace pas le score MCC.  │
└─────────────────────────────────────────────────────────┘
fond: --ia-surface | border-left: 3px --ia-moderate
```

---

### 5.7 `<finaces-stress-chart>`

```typescript
@Input() monthlyFlows: ScenarioFlowSchema[]; // du backend
@Input() stress60dResult: string;
@Input() stress90dResult: string;
@Input() criticalMonth?: number;
```

**Rendu :** Line chart mensuel (D3/Chart.js) montrant le cash disponible mois par mois, avec ligne critique (0), marquage du mois de rupture si applicable.

---

### 5.8 Angular Material — Mapping Composants

| Élément UI | Composant Angular Material |
|---|---|
| Sidebar | `<mat-sidenav>` + `<mat-nav-list>` |
| Topbar | `<mat-toolbar>` |
| Onglets | `<mat-tab-group [mat-align-tabs]="'start'">` |
| Stepper | `<mat-stepper [linear]="true">` horizontal |
| Accordion pilier | `<mat-expansion-panel>` |
| Tableau | `<mat-table>` + `<mat-paginator>` + `<mat-sort>` |
| Card | `<mat-card>` + `<mat-card-header>` |
| Bouton primaire | `<button mat-raised-button color="primary">` |
| Bouton secondaire | `<button mat-stroked-button>` |
| Bouton fantôme | `<button mat-button>` |
| Bouton danger | `<button mat-raised-button color="warn">` |
| Input | `<mat-form-field>` + `<input matInput>` |
| Select | `<mat-select>` |
| Toggle | `<mat-slide-toggle>` |
| Checkbox | `<mat-checkbox>` |
| Radio | `<mat-radio-group>` + `<mat-radio-button>` |
| Date | `<mat-datepicker>` |
| Spinner | `<mat-spinner>` |
| Chip | `<mat-chip-set>` + `<mat-chip>` |
| Dialog | `<mat-dialog>` |
| Snackbar | `MatSnackBar.open()` |
| Tooltip | `matTooltip` directive |
| Progress bar | `<mat-progress-bar>` |
| Badge compteur | `matBadge` directive |

---

## 6. BLOC 0 — Dashboard Unifié Double Rail

**Route :** `/dashboard`  
**Titre :** "FinaCES — Tableau de Bord"  
**API :** `GET /api/v1/cases` + `GET /api/v1/dashboard` (stats)

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR: Logo FinaCES | Search global | 🔔(badge) | Avatar    │
├──────────────┬───────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT                                  │
│  240px fixe  │                                               │
│              │  ┌─── KPI ROW (4 cards) ──────────────────┐  │
│  🏠 Dashboard│  │ En cours | En attente | Tensions | Conv │  │
│  📂 Dossiers │  └────────────────────────────────────────┘  │
│  🤖 IA       │                                               │
│  📊 Reporting│  ┌─── COL GAUCHE ──┐  ┌─── COL DROITE ───┐  │
│  ⚙️ Admin    │  │ Dossiers récents│  │ Tensions actives  │  │
│              │  │                 │  │                   │  │
│              │  └─────────────────┘  └───────────────────┘  │
│              │                                               │
│              │  ┌─── GRAPHIQUE MCC vs IA (30j) ──────────┐  │
│              │  └────────────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────────────┘
```

### 6.2 Zone A — KPI Row

```html
<!-- 4 mat-card en flex row -->
<div class="kpi-row">

  <!-- KPI 1 -->
  <mat-card class="kpi-card">
    <mat-card-header>
      <mat-icon>folder_open</mat-icon>
      <span class="kpi-label">Dossiers en cours</span>
    </mat-card-header>
    <mat-card-content>
      <span class="kpi-value">{{ stats.inProgress }}</span>
      <span class="kpi-sublabel">Cette semaine</span>
    </mat-card-content>
  </mat-card>

  <!-- KPI 2 -->
  <mat-card class="kpi-card">
    <mat-card-header>
      <mat-icon>pending_actions</mat-icon>
      <span class="kpi-label">En attente validation</span>
    </mat-card-header>
    <mat-card-content>
      <span class="kpi-value">{{ stats.pendingValidation }}</span>
      <span class="kpi-sublabel">Délai max: 48h</span>
    </mat-card-content>
  </mat-card>

  <!-- KPI 3 — Tensions (badge rouge si > 0) -->
  <mat-card class="kpi-card kpi-card--alert">
    <mat-card-header>
      <mat-icon color="warn">warning</mat-icon>
      <span class="kpi-label">Alertes Tensions</span>
      <span matBadge="{{ stats.tensionAlerts }}" matBadgeColor="warn"></span>
    </mat-card-header>
    <mat-card-content>
      <span class="kpi-value text-error">{{ stats.tensionAlerts }}</span>
      <span class="kpi-sublabel">MODERATE ou SEVERE</span>
    </mat-card-content>
  </mat-card>

  <!-- KPI 4 — Convergence IA -->
  <mat-card class="kpi-card">
    <mat-card-header>
      <mat-icon>smart_toy</mat-icon>
      <span class="kpi-label">Convergence IA</span>
    </mat-card-header>
    <mat-card-content>
      <span class="kpi-value ia-value">{{ stats.convergenceRate }}%</span>
      <span class="kpi-sublabel">7 derniers jours</span>
    </mat-card-content>
  </mat-card>

</div>
```

### 6.3 Zone B — Deux colonnes

**Colonne gauche — Dossiers récents :**

```
mat-table compact (5 derniers dossiers) :
Colonnes : Ref | Soumissionnaire (avatar 2L + nom + flag pays) | Montant | Statut | Classe MCC | Actions [👁️ 📝]
Bouton [+ Nouveau dossier] → /cases/new
```

**Colonne droite — Tensions actives :**

```
Liste de finaces-tension-cards :
Chaque card :
  ┌─────────────────────────────────────────┐
  │ [Ref] Nom Entreprise              [SEVERE]│
  │ [Badge MCC MODÉRÉ] → [Badge IA HIGH]     │
  │ Δ 2 niveaux · UP                  [Analyser →]│
  └─────────────────────────────────────────┘
→ click [Analyser] : navigate to /cases/{id}/tension
```

### 6.4 Zone C — Graphique comparatif

```
Line chart double (Recharts ou Chart.js Angular wrapper) :
- X : 30 derniers jours
- Y : Score /5 (0 à 5)
- Série MCC  : trait plein, couleur --mcc-moderate
- Série IA   : trait pointillé, couleur --ia-moderate
- Tooltip    : date + score MCC + score IA
- Annotation : point rouge si divergence > 1 niveau
- Légende    : "Score MCC moyen" | "Score IA moyen"
Stats en bas : Corrélation: 0.82 | Divergences: 22% | Convergence: 60%
```

---

## 7. BLOC 1A — Recevabilité & Création de Dossier

**Route :** `/cases/new`  
**API :** `POST /api/v1/cases` → `CaseCreate` → retourne `case_id`

### 7.1 Layout — Stepper Angular

```
<mat-stepper [linear]="true" orientation="horizontal">
  Step 1: Informations Marché    [●]────[○]────[○]────[○]────[○]
  Step 2: Soumissionnaire
  Step 3: Récapitulatif
  Step 4: Confirmation
```

### 7.2 Étape 1 — Informations Marché

```
┌─ INFORMATIONS MARCHÉ ──────────────────────────────────┐
│                                                        │
│  Type de marché:                                       │
│  (●) Marché simple   (○) Groupement   (○) Lots        │
│  → Si Groupement: afficher section membres (BLOC CONSORTIUM)│
│                                                        │
│  Référence marché *:    [_________________________]    │
│  → Binding: CaseCreate.market_reference                │
│                                                        │
│  Objet du marché *:     [_________________________]    │
│  → Binding: CaseCreate.market_label                    │
│                                                        │
│  Montant contrat:       [____________] [USD ▼]         │
│  → Binding: contract_value / contract_currency         │
│                                                        │
│  Durée (mois):          [____]                         │
│  → Binding: contract_duration_months                   │
│                                                        │
│  Type de client:        [Public ▼]                     │
│  Pays projet:           [Maroc ▼]                      │
│  → Binding: country                                    │
│                                                        │
│  Secteur d'activité:    [Construction ▼]               │
│  → Binding: sector                                     │
│                                                        │
│  Marché sensible:       [Toggle OFF]                   │
│                                                        │
│  Notes:                 [_________________________]    │
│  → Binding: notes                                      │
│                                                        │
└────────────────────────────────────────────────────────┘
[Annuler]  [Enregistrer brouillon]  [Suivant: Soumissionnaire →]
→ Enregistrer brouillon : POST /api/v1/cases avec status=DRAFT
```

### 7.3 Étape 2 — Soumissionnaire

```
┌─ SOUMISSIONNAIRE ──────────────────────────────────────┐
│                                                        │
│  Rechercher une entreprise existante:                  │
│  [_________________________________] [🔎]              │
│  → GET /api/v1/cases/bidders?search=xxx                │
│                                                        │
│  Résultat autocomplete (mat-autocomplete) :            │
│  ┌──────────────────────────────────────────────┐     │
│  │ [BM] BTP MAROC SA                            │     │
│  │      SARL · Construction · Maroc             │     │
│  │      Dernière éval : 2025-11-05 · FAIBLE    │     │
│  │                              [Sélectionner] │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ─── ou ──────────────────────────────────────────    │
│                                                        │
│  [+ Saisir un nouveau soumissionnaire]                 │
│  → Afficher formulaire inline :                        │
│    Raison sociale *: [___________]                     │
│    Forme juridique : [SARL ▼]                          │
│    Numéro RC:        [___________]                     │
│    Email contact:    [___________]                     │
│    → Binding: bidder_name / legal_form / registration_number│
│                                                        │
└────────────────────────────────────────────────────────┘
[← Précédent]  [Enregistrer brouillon]  [Suivant →]
```

### 7.4 Étape 3 — Récapitulatif

```
Affichage en lecture seule de toutes les données saisies.
Bouton [Modifier] sur chaque section → retour step correspondant.
Validation visuelle : toutes les * obligatoires vertes ✓
```

### 7.5 Étape 4 — Confirmation

```
POST /api/v1/cases → status: PENDING_GATE
→ Afficher :
  ✅ "Dossier créé avec succès — Référence: {market_reference}"
  "Étape suivante : Gate Documentaire"
  [→ Aller au Gate Documentaire]  [Retour Dashboard]
```

---

## 8. BLOC 1B — Gate Documentaire

**Route :** `/cases/:caseId/gate`  
**APIs :**

- `POST /api/v1/cases/{case_id}/documents` — Upload document
- `GET /api/v1/cases/{case_id}/documents` — Liste documents
- `GET /api/v1/cases/{case_id}/documents/{doc_id}/integrity` — Vérification
- `PATCH /api/v1/cases/documents/{doc_id}/status` — Mise à jour statut
- `POST /api/v1/cases/{case_id}/gate/evaluate` — Évaluation Gate → `GateDecisionSchema`

### 8.1 Layout — 3 colonnes

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR CONTEXTUELLE: "Gate Documentaire — BTP MAROC SA"         │
│ Breadcrumb: Dossiers > M001 > Gate                              │
│ Statut: 🔴 EN ATTENTE / 🟡 INCOMPLET / 🟢 VALIDÉ               │
├─────────────────┬──────────────────────────┬────────────────────┤
│ COL 1 (4/12)    │ COL 2 (5/12)             │ COL 3 (3/12)       │
│ Checklist       │ Documents uploadés        │ Décision Gate      │
│ Obligatoires    │ + Zone upload             │ + Audit log        │
└─────────────────┴──────────────────────────┴────────────────────┘
```

### 8.2 Colonne 1 — Checklist Documents

```
┌─ DOCUMENTS OBLIGATOIRES ──────────────────┐
│ Exercice fiscal: [2023 ▼] [2022 ▼] [2021 ▼]│
│                                           │
│  ☐ Bilan comptable 2023          REQUIS   │
│  ☐ Compte de Résultat 2023       REQUIS   │
│  ☐ Flux de Trésorerie 2023       REQUIS   │
│  ☑ Bilan comptable 2022    ✓ CHARGÉ       │
│  ☑ Rapport commissaire     ✓ CHARGÉ       │
│  ☐ Attestation fiscale           REQUIS   │
│  ☐ Statuts de société            REQUIS   │
│                                           │
│ Progrès: ████████░░░░ 5/9                 │
│                                           │
│ DOCUMENTS OPTIONNELS (3)                  │
│  ☐ Rapport d'audit externe               │
│  ☐ Tableau de financement                │
│  ☐ Attestation bancaire                  │
└───────────────────────────────────────────┘
```

### 8.3 Colonne 2 — Documents & Upload

```
┌─ DOCUMENTS CHARGÉS ─────────────────── [+ Upload] ─┐
│ [Rechercher...] [Tous ▼] [Toutes années ▼]         │
│                                                     │
│ mat-table :                                         │
│ Doc | Exercice | Taille | Fiabilité | Statut | Actions│
│                                                     │
│ Bilan 2022.pdf | 2022 | 245KB | ⭐⭐⭐⭐ | ✅ | 👁️ 🗑️│
│ CPC 2022.pdf   | 2022 | 198KB | ⭐⭐⭐  | ✅ | 👁️ 🗑️│
│                                                     │
│ RED FLAGS détectés (DocumentOut.red_flags) :        │
│ ┌─────────────────────────────────────────────┐    │
│ │ ⚠️ Incohérence bilan 2022 (écart >5%)       │    │
│ │ ⚠️ Signature manquante page 3               │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ ─── ZONE UPLOAD ──────────────────────────────     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │   📎 Glisser-déposer vos fichiers ici        │   │
│  │   ou [Choisir fichier]                       │   │
│  │   Formats: PDF, Excel | Max: 10MB            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Après sélection fichier :                          │
│  Type document : [Bilan ▼]                          │
│  Exercice :      [2023 ▼]                           │
│  Niveau fiabilité: [Audité ▼]                       │
│  Nom auditeur:   [___________]                      │
│  Notes:          [___________]                      │
│  [Uploader →]                                       │
└─────────────────────────────────────────────────────┘
```

### 8.4 Colonne 3 — Décision Gate

```
┌─ ÉVALUATION GATE ──────────────────────────┐
│                                            │
│  [🔍 Lancer l'évaluation Gate]             │
│  → POST /api/v1/cases/{id}/gate/evaluate  │
│                                            │
│  Résultat (GateDecisionSchema) :           │
│  ┌──────────────────────────────────────┐ │
│  │ Verdict:  🟢 PASSÉ / 🔴 BLOQUÉ       │ │
│  │ Score fiabilité: 0.82                │ │
│  │ Niveau: AUDITÉ                       │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Manquants obligatoires:                  │
│  🔴 Bilan 2023                            │
│  🔴 CPC 2023                              │
│                                            │
│  Motifs de blocage:                       │
│  ⛔ Documents manquants (exercice 2023)   │
│                                            │
│  Réserves:                                │
│  ⚠️ Fiabilité partielle — 2 docs non audités│
│                                            │
│  ─────────────────────────────────────── │
│  AUDIT LOG                                │
│  2026-03-11 14:35 — Upload Bilan 2022     │
│  2026-03-11 14:38 — Gate évalué: INCOMPLET│
│  2026-03-11 15:02 — Upload CPC 2022       │
│                                            │
│  ─────────────────────────────────────── │
│  [🔒 Sceller le Gate]                     │
│  → *ngIf: gateResult?.is_passed === true  │
│  → PATCH /api/v1/cases/{id}/status        │
│     body: { new_status: "FINANCIAL_INPUT"}│
└────────────────────────────────────────────┘
```

---

## 9. BLOC 2 — États Financiers

**Route :** `/cases/:caseId/financials`  
**APIs :**

- `GET /api/v1/cases/{case_id}/financials` → liste des exercices
- `POST /api/v1/cases/{case_id}/financials` → `FinancialStatementCreate`
- `DELETE /api/v1/cases/{case_id}/financials/{statement_id}` → supprimer

### 9.1 Layout

```
┌─ HEADER ─────────────────────────────────────────────────────┐
│ "États Financiers — BTP MAROC SA"                            │
│ Pills d'exercice :   [2023 ✓ actif]             │
│ Mode saisie : (●) Manuelle  (○) Upload Excel  (○) API        │
│ [+ Ajouter exercice]         [Upload Excel global →]         │
└──────────────────────────────────────────────────────────────┘

┌─ TABS (mat-tab-group) ─────────────────────────────────────┐
│  [Bilan Actif] [Bilan Passif] [Compte de Résultat] [TFT]   │
└────────────────────────────────────────────────────────────┘
```

### 9.2 Tab Bilan Actif

**Binding :** `FinancialStatementCreate` (POST body)

```
┌─ ACTIF COURANT ──────────────────────────── [▼ Déplier] ──┐
│  Actif liquide (trésorerie)       [____________] USD        │
│  → liquid_assets                                           │
│  Créances clients                 [____________] USD        │
│  → accounts_receivable                                     │
│  Stocks                           [____________] USD        │
│  → inventory                                               │
│  Autres actifs courants           [____________] USD        │
│  → other_current_assets                                    │
│  ─────────────────────────────────────────────────────    │
│  Total Actif Courant (calculé)    [5 200 000   ] USD  🔒   │
│  → current_assets = somme auto                             │
└────────────────────────────────────────────────────────────┘

┌─ ACTIF NON COURANT ──────────────────────── [▼ Déplier] ──┐
│  Immobilisations corporelles      [____________] USD        │
│  → tangible_assets                                         │
│  Immobilisations incorporelles    [____________] USD        │
│  → intangible_assets                                       │
│  Actifs financiers LT             [____________] USD        │
│  → financial_assets                                        │
│  Autres actifs non courants       [____________] USD        │
│  ─────────────────────────────────────────────────────    │
│  Total Actif Non Courant (calculé)[____________] USD  🔒   │
│  → non_current_assets = somme auto                         │
└────────────────────────────────────────────────────────────┘

┌─ ACTIF TOTAL ──────────────────────────────────────────────┐
│  TOTAL ACTIF = [5 200 000] USD    (calculé automatiquement) │
│  → total_assets = current + non_current                     │
└────────────────────────────────────────────────────────────┘

┌─ BARRE DE COHÉRENCE ───────────────────────────────────────┐
│  Équilibre bilan :                                         │
│  ✅ ACTIF = PASSIF = 5 200 000 USD  ████████████████ 100% │
│  Tolérance ±1 000 USD                                      │
│  ⚠️ Si déséquilibre: message "Écart: +5 000 USD — vérifier"│
└────────────────────────────────────────────────────────────┘
```

### 9.3 Tab Bilan Passif

```
Capitaux Propres    → equity / share_capital / reserves /
                      retained_earnings_prior / current_year_earnings
Passif Courant      → current_liabilities / short_term_debt /
                      accounts_payable / tax_and_social_liabilities /
                      other_current_liabilities
Passif Non Courant  → non_current_liabilities / long_term_debt /
                      long_term_provisions
TOTAL PASSIF        → total_liabilities_and_equity (calculé)
```

### 9.4 Tab Compte de Résultat

```
Produits d'exploitation → revenue / sold_production / other_operating_revenue
Charges d'exploitation  → cost_of_goods_sold / external_expenses /
                          personnel_expenses / taxes_and_duties /
                          depreciation_and_amortization / other_operating_expenses
Résultat d'exploitation → operating_income (calculé)
Résultat financier      → financial_revenue / financial_expenses / financial_income
Résultat avant impôt    → income_before_tax (calculé)
Résultat exceptionnel   → extraordinary_income
Impôts                  → income_tax
Résultat net            → net_income (calculé + editable si consolidé)
EBITDA                  → ebitda (calculé)
```

### 9.5 Tab Trésorerie (TFT)

```
Flux opérationnels  → operating_cash_flow
Flux d'investissement→ investing_cash_flow
Flux de financement → financing_cash_flow
Variation de tréso  → change_in_cash (calculé)
Tréso début période → beginning_cash
Tréso fin période   → ending_cash (calculé)

Infos complémentaires:
  Effectif (headcount)     [______]
  Backlog (backlog_value)  [______]
  CAPEX                    [______]
  Dividendes distribués    [______]
```

### 9.6 Actions

```
[← Précédent : Gate]
[Enregistrer exercice]   → POST /api/v1/cases/{id}/financials
[▶ Lancer Normalisation] → POST /api/v1/cases/{id}/normalize
                         → puis PATCH status: NORMALIZATION_DONE
```

---

## 10. BLOC 3 — Normalisation IFRS

**Route :** `/cases/:caseId/normalization`  
**API :** `POST /api/v1/cases/{case_id}/normalize` → `FinancialStatementNormalizedSchema`

### 10.1 Comportement

Ce bloc est principalement **en lecture seule** — la normalisation est calculée par le backend Python. L'interface montre le résultat et les ajustements appliqués.

### 10.2 Layout

```
┌─ HEADER ─────────────────────────────────────────────────────┐
│ "Normalisation IFRS — BTP MAROC SA"                          │
│ Badge: 🟢 NORMALISÉ | Exercice: 2023 | Ajustements: 4       │
│ [▶ Recalculer] (si données financières modifiées)            │
└──────────────────────────────────────────────────────────────┘

┌─ TABLEAU COMPARATIF (mat-table) ──────────────────────────────┐
│ Colonne : Poste | Valeur Brute | Valeur Normalisée | Δ | Note │
│                                                               │
│ Total Actif      5 200 000 $ → 5 200 000 $   =    Conforme  │
│ Capitaux propres   820 000 $ →   820 000 $   =    Conforme  │
│ EBITDA             440 000 $ →   412 000 $  -6% Retraitement│
│ Résultat net       120 000 $ →   118 500 $  -1% Ajustement  │
│                                                               │
│ Colonne Δ colorée: vert si = , orange si Δ<10%, rouge si Δ>10%│
└───────────────────────────────────────────────────────────────┘

┌─ AJUSTEMENTS APPLIQUÉS (adjustments_count = 4) ───────────────┐
│  1. Retraitement EBITDA — consolidation hors éléments except. │
│  2. Conversion devise MAD → USD (taux: 0.099)                │
│  3. Actualisation créances douteuses (-15K$)                 │
│  4. Reclassification immob. en leasing → passif              │
└───────────────────────────────────────────────────────────────┘

┌─ RÉFÉRENTIEL COMPTABLE ───────────────────────────────────────┐
│  Référentiel détecté : MAROC CNC                              │
│  Norme appliquée     : IFRS                                   │
│  Taux de change      : 1 MAD = 0.099 USD                     │
└───────────────────────────────────────────────────────────────┘

[▶ Lancer Calcul des Ratios] → POST /api/v1/cases/{id}/ratios/compute
```

---

## 11. BLOC 4 — Ratios Financiers

**Route :** `/cases/:caseId/ratios`  
**API :** `POST /api/v1/cases/{case_id}/ratios/compute` → `RatioSetSchema`

### 11.1 Groupes de Ratios (selon RatioSetSchema)

```
┌─ LIQUIDITÉ ─────────────────────────────────────────────────────┐
│  Ratio liquidité générale   current_ratio      1.85  🟢         │
│  Ratio liquidité réduite    quick_ratio         1.12  🟡        │
│  Cash Ratio                 cash_ratio          0.67  🟡        │
│  Fonds de Roulement         working_capital   850K$  🟢         │
│  BFR                        wcr               320K$  🟡         │
│  BFR / CA                   wcr_pct_revenue   6.2%   🟢         │
│  Délai recouvrement (DSO)   dso_days          92j    🟠         │
│  Délai paiement (DPO)       dpo_days          45j    🟢         │
│  Rotation stocks (DIO)      dio_days          38j    🟢         │
│  Cycle conversion cash      cash_conversion   85j    🟡         │
└─────────────────────────────────────────────────────────────────┘

┌─ SOLVABILITÉ ───────────────────────────────────────────────────┐
│  Ratio endettement          debt_to_equity      2.1   🟡        │
│  Autonomie financière       financial_autonomy  32%   🟠        │
│  Gearing                    gearing             0.68  🟡        │
│  Couverture intérêts        interest_coverage   3.2   🟢        │
│  Années remboursement       debt_repayment_years 4.2  🟡        │
│  Capitaux propres négatifs  negative_equity      0    🟢        │
└─────────────────────────────────────────────────────────────────┘

┌─ RENTABILITÉ ───────────────────────────────────────────────────┐
│  Marge nette                net_margin         2.3%  🟡         │
│  Marge EBITDA               ebitda_margin      8.4%  🟢         │
│  Marge opérationnelle       operating_margin   5.1%  🟡         │
│  ROA                        roa                1.8%  🟠         │
│  ROE                        roe                7.2%  🟡         │
└─────────────────────────────────────────────────────────────────┘

┌─ CAPACITÉ ──────────────────────────────────────────────────────┐
│  Capacité autofinancement   cash_flow_capacity  380K$  🟡       │
│  CAF / CA                   cf_capacity_margin  7.3%   🟡       │
│  Cash flow opérationnel     operating_cash_flow 290K$  🟡       │
└─────────────────────────────────────────────────────────────────┘

┌─ SCORE ALTMAN (Z-Score) ────────────────────────────────────────┐
│  Z-Score d'Altman :  z_score_altman   2.45                      │
│  Zone : z_score_zone  🟡 GRISE (1.81 < Z < 2.99)              │
│  Interprétation : "Entreprise en zone de vigilance"             │
└─────────────────────────────────────────────────────────────────┘

┌─ ALERTES DE COHÉRENCE (coherence_alerts_json) ─────────────────┐
│  ⚠️ DSO > 90 jours — risque trésorerie potentiel               │
│  ℹ️ Gearing en hausse sur 3 exercices                           │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Couleur des valeurs

```
Chaque valeur de ratio est colorée selon seuils configurés en backend (settings) :
🟢 vert   : ratio dans la zone saine
🟡 jaune  : zone de vigilance
🟠 orange : zone dégradée
🔴 rouge  : zone critique
```

### 11.3 Actions

```
[▶ Lancer Scoring MCC]   → POST /api/v1/cases/{id}/score
[▶ Lancer Prédiction IA] → POST /api/v1/ia/cases/{id}/predict (route ia.py)
Les deux lancés en parallèle → Promise.all()
```

---

## 12. BLOC 5 — Scoring MCC (Rail 1)

**Route :** `/cases/:caseId/scoring`  
**API :** `POST /api/v1/cases/{case_id}/score` → `ScorecardOutputSchema`

### 12.1 Layout Header

```
┌─ SCORING MCC — BTP MAROC SA ──────────────────────────────────┐
│  Badge: [EN ANALYSE] [SCORING_DONE]                            │
│  Politique: MCC v2.4 - Construction Maroc                      │
│  Analyste: Jean Dupont | Date: 2026-03-11                      │
│  [▶ Calculer le score]                                         │
└────────────────────────────────────────────────────────────────┘
```

### 12.2 Synthèse Score Global

```
┌─ SCORE GLOBAL MCC ───── border-left 4px var(--mcc-moderate) ──┐
│                                                               │
│  ┌─────────────────────────┐   ┌──────────────────────────┐  │
│  │  <finaces-score-gauge>  │   │  3.2 / 5.0               │  │
│  │  size=160 rail="MCC"    │   │  <finaces-risk-badge      │  │
│  │  score=3.2              │   │    rail="MCC"             │  │
│  │                         │   │    riskClass="MODERATE"   │  │
│  └─────────────────────────┘   │    size="md" />           │  │
│                                │                           │  │
│                                │  Score officiel MCC       │  │
│                                │  Calculé le: 2026-03-11   │  │
│                                └──────────────────────────┘  │
│                                                               │
│  system_calculated_score: 3.2  |  global_score: 3.2          │
│  base_risk_class: MODERATE     |  final_risk_class: MODERATE  │
│  is_overridden: false                                         │
└───────────────────────────────────────────────────────────────┘
```

### 12.3 Accordion — 5 Piliers

**Source :** `ScorecardOutputSchema.pillars[]` → `PillarDetailSchema`

```
Pour chaque pilier (mat-expansion-panel) :
┌─ PILIER LIQUIDITÉ ─────── score: 3.5/5 [████████░░] [🟢 BON] [▼] ─┐
│                                                                     │
│  mat-table: Indicateur | Valeur calculée | Note /5 | Poids | Contrib│
│  ─────────────────────────────────────────────────────────────     │
│  Ratio liquidité générale  1.85            4/5    25%      1.00     │
│  Ratio liquidité réduite   1.12            3/5    25%      0.75     │
│  Fonds de roulement        850K$           4/5    30%      1.20     │
│  Cash ratio                0.67            3/5    20%      0.60     │
│  ─────────────────────────────────────────────────────────────     │
│  Score pilier: ████████████░░░░ 3.55/5                              │
│                                                                     │
│  Signaux (signals[]) :                                              │
│  ℹ️ DSO > 90j — surveiller le recouvrement                         │
│                                                                     │
│  Tendance (trend[]) :                                               │
│  📈 Amélioration liquidité générale +12% vs exercice N-1           │
│                                                                     │
│  Commentaire analyste (optionnel — mat-textarea) :                  │
│  [_____________________________________________] 0/500              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Icônes piliers :**

- Liquidité : `water_drop`
- Solvabilité : `shield`
- Rentabilité : `trending_up`
- Capacité contractuelle : `bolt`
- Qualité : `star`

### 12.4 Zone Override (mat-expansion-panel)

```
┌─ AJUSTEMENTS MANUELS ─────────────────────────────────────────┐
│  ⚠️ ATTENTION: Un override modifie le score officiel.          │
│  Chaque override doit être documenté et validé.               │
│                                                               │
│  [mat-slide-toggle] Activer un ajustement manuel              │
│  *ngIf: overrideEnabled                                       │
│                                                               │
│  Score override:    [3.0 ▼ → 3.5]                            │
│  → override_rationale: [Justification obligatoire___________] │
│  → ScorecardOutputSchema.is_overridden = true                 │
│  → ScorecardOutputSchema.override_rationale                   │
└───────────────────────────────────────────────────────────────┘
```

### 12.5 Smart Recommendations

```
┌─ RECOMMANDATIONS SYSTÈME ──────────────────────────────────────┐
│  (ScorecardOutputSchema.smart_recommendations[])               │
│  -  Surveiller le ratio d'endettement (seuil: 70%)             │
│  -  Demander prévisions trésorerie Q3/Q4                       │
│  -  Exiger caution bancaire ≥ 10% montant marché               │
└────────────────────────────────────────────────────────────────┘
```

### 12.6 Cross Analysis Alerts

```
┌─ ALERTES CROISÉES ─────────────────────────────────────────────┐
│  (ScorecardOutputSchema.cross_analysis_alerts[])               │
│  🔴 Divergence Rentabilité/Capacité — Vérifier cohérence      │
│  ⚠️ Z-Score zone grise détecté                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 13. BLOC 6 — Prédiction IA + SHAP (Rail 2)

**Route :** `/cases/:caseId/ia`  
**API :** Route `ia.py` (endpoint à confirmer selon ia.py backend)  
**Note :** Utiliser `GET /api/v1/ia/cases/{case_id}/prediction` (à mapper selon ia.py réel)

### 13.1 Disclaimer Banner (OBLIGATOIRE — toujours en haut)

```html
<finaces-ia-disclaimer variant="banner" [dismissible]="false" />
```

```
┌─────────────────────────────────────────────────────────────────┐
│  ℹ️  Ce scoring IA est un outil de CHALLENGE NON DÉCISIONNEL.   │
│      Il ne remplace pas le score officiel MCC.                  │
│      Outil indicatif uniquement — déc

Voici la suite et fin complète du document  : [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_76c6b749-33ac-4fa8-98f3-d29936329c7f/51400da1-7328-46a4-b1b8-670db9b280ab/FinaCES-API-MCC-Swagger-UI.pdf)

***

```markdown
---

### 13.2 Configuration Prédiction

```

┌─ CONFIGURATION PRÉDICTION ─────────────────────────────────────┐
│  Source features:                                              │
│  (●) Cache disponible (2026-03-10)                             │
│  (○) Recalculer depuis données brutes                          │
│                                                                │
│  Modèle actif: XGBoost v3.2.1 [prod]                          │
│  Features disponibles: 42/42 ✅                                │
│                                                                │
│  Options:                                                      │
│  [✓] Générer explications SHAP                                │
│  [✓] Calculer intervalles de confiance                        │
│  [ ] Mode debug (features détaillées)                          │
│                                                                │
│  [▶ Lancer Prédiction IA]                                      │
│  → Skeleton loader pendant calcul (mat-spinner)               │
└────────────────────────────────────────────────────────────────┘

```

### 13.3 Résultat Prédiction

```

┌─ RÉSULTAT PRÉDICTION IA ────────── fond: --ia-surface ─────────┐
│  border-left: 4px var(--ia-high)                               │
│                                                                │
│  ┌──────────────────────┐   ┌───────────────────────────────┐ │
│  │ <finaces-score-gauge  │   │ Probabilité de défaut         │ │
│  │   size=160            │   │ 44%  [intervalle: 39–49%]     │ │
│  │   rail="IA"           │   │ ████████████████░░ 44%        │ │
│  │   score=2.8 />        │   │                               │ │
│  └──────────────────────┘   │ <finaces-risk-badge            │ │
│                              │   rail="IA"                   │ │
│                              │   riskClass="HIGH" />         │ │
│                              │                               │ │
│                              │ Confiance modèle: 85%         │ │
│                              │ ████████████████░░ 85%        │ │
│                              │                               │ │
│                              │ Temps calcul: 1.3s            │ │
│                              │ Features: 42/42 validées      │ │
│                              └───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

```

### 13.4 Explications SHAP

```

┌─ TOP 10 FEATURES INFLUENTES (SHAP) ───────────────────────────┐
│  <finaces-shap-chart [features]="shapFeatures" [maxFeatures]=10│
│                                                                │
│  debt_to_equity    (2.85)  ████████████ +0.32  🔴 Risque ↑   │
│  current_ratio     (0.95)  ██████████   +0.28  🔴 Risque ↑   │
│  net_margin        (-2.3%) ████████     +0.21  🔴 Risque ↑   │
│  cash_flow_cap     (320K$) ██████       +0.15  🔴 Risque ↑   │
│  revenue_growth    (-8%)   █████        +0.12  🔴 Risque ↑   │
│  z_score_altman    (1.2)   ████         +0.09  🟡 Vigilance  │
│  working_capital   (-150K) ███          +0.07  🔴 Risque ↑   │
│  financial_auto    (32%)   ██           +0.05  🟡 Vigilance  │
│  roa               (1.8%)  █            +0.04  🟡 Vigilance  │
│  headcount         (120)   ▌            -0.02  🟢 Risque ↓   │
│                                                                │
│  [Voir graphique SHAP complet →]                               │
└────────────────────────────────────────────────────────────────┘

```

### 13.5 Analyse de Sensibilité — What-If

```

┌─ ANALYSE DE SENSIBILITÉ (What-If) ─── [▼ Déplier] ────────────┐
│  ⚠️ Simulations indicatives — non décisionnelles               │
│                                                                │
│  Simulation 1: Si debt_to_equity passe de 2.85 → 2.0          │
│  → Risque estimé: MODÉRÉ · Score: 3.25 (+0.40)                │
│  → bar: ██████████████░░ +0.40                                 │
│                                                                │
│  Simulation 2: Si current_ratio passe de 0.95 → 1.5           │
│  → Risque estimé: MODÉRÉ · Score: 3.55 (+0.70)                │
│                                                                │
│  Simulation 3: Si net_margin passe de -2.3% → 5%              │
│  → Risque estimé: ACCEPTABLE · Score: 3.85 (+1.05)            │
│                                                                │
│  [+ Ajouter simulation]                                        │
└────────────────────────────────────────────────────────────────┘

[Enregistrer prédiction]  [Notifier analyste MCC]
[→ Analyser Tension MCC ↔ IA]

```

### 13.6 État IA Indisponible

```html
<!-- *ngIf="!iaResult && iaError" -->
<mat-card class="ia-unavailable">
  <mat-icon>smart_toy</mat-icon>
  <h3>Scoring IA non disponible</h3>
  <p>Données insuffisantes ou modèle indisponible pour ce dossier.</p>
  <button mat-stroked-button (click)="retryIa()">
    <mat-icon>refresh</mat-icon> Réessayer
  </button>
</mat-card>
<!-- Bloc Tension devient "Non applicable — IA indisponible" -->
```

---

## 14. BLOC 7 — Analyse de Tension MCC ↔ IA

**Route :** `/cases/:caseId/tension`  
**API :** Calcul local frontend (delta = niveau_IA - niveau_MCC) alimenté par :

- `ScorecardOutputSchema` (MCC)
- Résultat prédiction IA

### 14.1 Échelle des Niveaux (ordinal 1–4)

```
1 → FAIBLE/LOW     (MCC) / IA_LOW
2 → MODÉRÉ/MODERATE
3 → ÉLEVÉ/HIGH
4 → CRITIQUE/CRITICAL

delta = niveau_IA_ordinal - niveau_MCC_ordinal

NONE     : delta = 0     → convergence
MILD     : |delta| = 1   → légère divergence
MODERATE : |delta| = 2   → divergence significative
SEVERE   : |delta| ≥ 3   → tension majeure

direction :
  UP   : delta > 0 → IA plus pessimiste que MCC
  DOWN : delta < 0 → IA plus optimiste que MCC
```

### 14.2 Banner de Tension (conditionnel)

```html
<!-- *ngIf="tension === 'SEVERE'" -->
<div class="tension-banner tension-banner--severe">
  <mat-icon>error</mat-icon>
  <strong>TENSION MAJEURE DÉTECTÉE</strong>
  Divergence de {{ delta }} niveaux · Direction: {{ direction }}
  Revue senior OBLIGATOIRE avant toute décision.
</div>

<!-- *ngIf="tension === 'MODERATE'" -->
<div class="tension-banner tension-banner--moderate">
  <mat-icon>warning</mat-icon>
  <strong>TENSION MODÉRÉE</strong>
  Commentaire analyste obligatoire.
</div>

<!-- *ngIf="tension === 'MILD'" -->
<div class="tension-banner tension-banner--mild">
  <mat-icon>info</mat-icon>
  Tension légère détectée. Revue recommandée.
</div>
```

### 14.3 Comparaison Côte à Côte

```
┌─ COMPARAISON DOUBLE RAIL ──────────────────────────────────────┐
│                                                                │
│  ┌─── SCORING MCC OFFICIEL ────┐  ┌─── PRÉDICTION IA ────────┐│
│  │  fond: --mcc-surface         │  │  fond: --ia-surface       ││
│  │                              │  │                          ││
│  │  Score: 3.55 / 5             │  │  Score IA: 2.85 / 5      ││
│  │  [Badge MCC MODÉRÉ 🟡]       │  │  [Badge IA HIGH 🟣]      ││
│  │                              │  │                          ││
│  │  Probabilité: ~30%           │  │  PDIA: 44%               ││
│  │  (estimation MCC)            │  │  [39–49%]                ││
│  │                              │  │                          ││
│  │  ⭐ SOURCE DÉCISIONNELLE ⭐  │  │  ⚠️ Non décisionnel      ││
│  └──────────────────────────────┘  └──────────────────────────┘│
│                                                                │
│              ⬆ TENSION UP           Δ = 2 niveaux             │
│              [Badge SEVERE 🔴]                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 14.4 Analyse par Pilier

```
mat-table :
┌─────────────────────────────────────────────────────────────────┐
│ Pilier       │ Score MCC │ Score IA │  Δ   │ Statut              │
├─────────────────────────────────────────────────────────────────┤
│ Liquidité    │   3.5     │   3.2    │ -0.3 │ 🟢 Aligné          │
│ Solvabilité  │   3.5     │   2.2    │ -1.3 │ 🔴 DIVERGENT       │
│ Rentabilité  │   3.0     │   1.5    │ -1.5 │ 🔴 FORT ÉCART      │
│ Capacité     │   4.0     │   2.5    │ -1.5 │ 🔴 FORT ÉCART      │
│ Qualité      │   4.0     │   3.8    │ -0.2 │ 🟢 Aligné          │
└─────────────────────────────────────────────────────────────────┘

Row couleur :
  Δ < 0.5  → fond vert léger
  Δ 0.5–1  → fond jaune léger
  Δ > 1    → fond rouge léger

Ligne expandable (*ngIf row expanded) :
  → Explication IA pour ce pilier
  → "IA détecte : baisse CA -15% / MCC : -8%"
  → "Suggestion : vérifier passifs hors bilan"
```

### 14.5 Recommandations Système

```
┌─ RECOMMANDATIONS SYSTÈME ──────────────────────────────────────┐
│  Actions immédiates (ordonnées) :                              │
│  1. 🔴 Revue manuelle senior OBLIGATOIRE                       │
│  2. 📋 Vérifier états financiers 2023 vs 2024                  │
│  3. 💬 Demander clarifications sur l'endettement               │
│  4. 🔍 Analyser passifs hors bilan (leasing, engagements)      │
│  5. 📊 Obtenir prévisions trésorerie 12 mois                   │
└────────────────────────────────────────────────────────────────┘
```

### 14.6 Zone Analyste (obligatoire si MODERATE ou SEVERE)

```html
<!-- class="error" si tension MODERATE|SEVERE et champ vide -->
<mat-form-field appearance="outline" class="full-width"
  [class.mat-form-field-invalid]="tensionLevel !== 'NONE' && !analystComment">
  <mat-label>
    Commentaire analyste
    <span *ngIf="tensionLevel === 'MODERATE' || tensionLevel === 'SEVERE'"
      class="required-label">— OBLIGATOIRE</span>
  </mat-label>
  <textarea matInput [(ngModel)]="analystComment"
    placeholder="Expliquer pourquoi la décision suit MCC malgré la divergence IA…"
    maxlength="500" rows="4">
  </textarea>
  <mat-hint align="end">{{ analystComment.length }}/500</mat-hint>
  <mat-error>Commentaire obligatoire pour tension MODERATE ou SEVERE</mat-error>
</mat-form-field>

<!-- Décision finale -->
<mat-radio-group [(ngModel)]="finalDecision">
  <mat-radio-button value="FOLLOW_MCC">Suivre MCC (officiel)</mat-radio-button>
  <mat-radio-button value="FOLLOW_IA">Suivre IA (exception documentée)</mat-radio-button>
  <mat-radio-button value="INVESTIGATE">Investigation supplémentaire requise</mat-radio-button>
</mat-radio-group>

<div class="tension-actions">
  <button mat-stroked-button color="warn">
    <mat-icon>escalator_warning</mat-icon> Escalader au manager
  </button>
  <button mat-raised-button color="primary"
    [disabled]="!canSaveTension()">
    Enregistrer
  </button>
  <button mat-raised-button color="accent"
    [disabled]="!canCloseTension()">
    Clôturer tension → Stress Test
  </button>
</div>
```

---

## 15. BLOC 8 — Stress Test Contractuel

**Route :** `/cases/:caseId/stress`  
**API :** `POST /api/v1/cases/{case_id}/stress/run`  
**Input :** `StressScenarioInputSchema`  
**Output :** `StressResultSchema`

> ⚠️ Ce bloc est distinct de l'analyse de sensibilité SHAP IA.  
> Le Stress Test MCC évalue la **capacité financière contractuelle réelle** (flux mensuels, jalons de paiement, exposition).

### 15.1 Layout — Formulaire + Résultats

```
┌─ PARAMÈTRES DU STRESS TEST ────────────────────────────────────┐
│                                                                │
│  Valeur contrat (contract_value):    [5 200 000] USD          │
│  → pré-rempli depuis CaseCreate                                │
│                                                                │
│  Durée (contract_months):             mois                 │
│  CA annuel moyen (annual_ca_avg):    [8 400 000] USD           │
│  CAF annuelle générée (annual_caf):  [440 000] USD             │
│  Trésorerie disponible (cash):       [820 000] USD             │
│  Avance de démarrage % (adv_pct):     %                    │ [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_76c6b749-33ac-4fa8-98f3-d29936329c7f/e99be04d-77ba-4b10-8791-62526f51ac4a/bloc1-recevabilite.component.html.md)
│  Lignes de crédit (credit_lines):    [500 000] USD             │
│  Backlog actuel (backlog_value):     [3 200 000] USD           │
│                                                                │
│  Garantie bancaire: [Toggle ON]                                │
│  Montant garantie:  [260 000] USD                              │
│  BFR sectoriel %:   [6.5] %                                    │
│                                                                │
│  ─── JALONS DE PAIEMENT (PaymentMilestoneSchema[]) ─────────  │
│  [+ Ajouter jalon]                                             │
│  Jalon 1: [Démarrage     ] Jour [  0]  %                  │ [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_76c6b749-33ac-4fa8-98f3-d29936329c7f/e99be04d-77ba-4b10-8791-62526f51ac4a/bloc1-recevabilite.component.html.md)
│  Jalon 2: [Livraison 25% ] Jour [ 90]  %                  │
│  Jalon 3: [Livraison 50% ] Jour   %                  │
│  Jalon 4: [Livraison 75% ] Jour   %                  │
│  Jalon 5: [Réception déf.] Jour   %                  │ [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_76c6b749-33ac-4fa8-98f3-d29936329c7f/e99be04d-77ba-4b10-8791-62526f51ac4a/bloc1-recevabilite.component.html.md)
│  Total : ████████████████████ 100% ✅                          │
│                                                                │
│  [▶ Lancer Simulation]                                         │
└────────────────────────────────────────────────────────────────┘
```

### 15.2 Résultats du Stress Test

```
┌─ RÉSULTATS STRESS TEST ────────────────────────────────────────┐
│                                                                │
│  ── MÉTRIQUES GLOBALES ──────────────────────────────────── │
│  Exposition / CA:    22% ── StressResultSchema.exposition_pct │
│  Score capacité:     3.5 ── score_capacity                    │
│  Conclusion:         "Capacité contractuelle: SOLIDE"         │
│                      capacity_conclusion                       │
│                                                                │
│  ── TESTS DE STRESS ─────────────────────────────────────── │
│  Stress 60 jours de retard paiement:                          │
│  Résultat:  🟢 RÉSISTE ── stress_60d_result                   │
│  Position cash restante: +85 000 $                            │
│                                                                │
│  Stress 90 jours de retard paiement:                          │
│  Résultat:  🟡 LIMITE ── stress_90d_result                    │
│  Position cash restante: -12 000 $  ⚠️                        │
│  Mois critique: Mois 7 ── critical_month                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ FLUX MENSUELS (monthly_flows) ────────────────────────────────┐
│  <finaces-stress-chart                                         │
│    [monthlyFlows]="stressResult.monthly_flows"                 │
│    [criticalMonth]="stressResult.critical_month"               │
│    [stress60dResult]="stressResult.stress_60d_result"          │
│    [stress90dResult]="stressResult.stress_90d_result" />       │
│                                                                │
│  Line chart :                                                  │
│  - X : mois 1 à N                                             │
│  - Y : cash disponible en $                                    │
│  - Ligne rouge pointillée : seuil zéro                        │
│  - Marqueur 🔴 au mois critique (si applicable)               │
│  - Zone grisée : période de retard simulée                    │
└────────────────────────────────────────────────────────────────┘

┌─ SCÉNARIOS (scenarios_results) ────────────────────────────────┐
│  mat-table : Scénario | Statut | Cash restant | Mois critique  │
│  Scénario baseline   🟢 SOLIDE  +320K$    —                   │
│  Retard 60j          🟢 RÉSISTE  +85K$    —                   │
│  Retard 90j          🟡 LIMITE   -12K$    Mois 7              │
│  Choc CA -20%        🔴 RUPTURE -155K$    Mois 5              │
└────────────────────────────────────────────────────────────────┘

┌─ ALERTES DONNÉES (data_alerts) ────────────────────────────────┐
│  ⚠️ BFR estimé supérieur à la trésorerie disponible           │
│  ℹ️ Garantie bancaire insuffisante pour scénario 90j           │
└────────────────────────────────────────────────────────────────┘

[→ Passer à l'Expert Review]
→ PATCH /api/v1/cases/{id}/status → STRESS_DONE
```

---

## 16. BLOC 9 — Expert Review & Conclusion

**Route :** `/cases/:caseId/expert`  
**APIs :**

- `POST /api/v1/cases/{case_id}/experts/review` → `ExpertReviewInputSchema` → `ExpertReviewOutputSchema`
- `POST /api/v1/cases/{case_id}/recommendation` → `RecommendationUpdate`
- `PATCH /api/v1/cases/{case_id}/conclusion` → `ConclusionUpdate`

### 16.1 Layout

```
┌─ EXPERT REVIEW — BTP MAROC SA ─────────────────────────────────┐
│  Badge: [REVUE EXPERTE] | Analyste ID: [jean.dupont@mcc.ma]    │
└────────────────────────────────────────────────────────────────┘

┌─ RÉCAPITULATIF DÉCISIONNEL ────────────────────────────────────┐
│                                                                │
│  Score MCC final:      3.25 / 5   [Badge MODÉRÉ 🟡]           │
│  Classe de risque:     MODÉRÉ                                  │
│  Tension détectée:     [Badge MODERATE 🟡]                     │
│  Stress 60j:           🟢 RÉSISTE                             │
│  Stress 90j:           🟡 LIMITE                              │
│  Override actif:       NON                                     │
│                                                                │
│  Points d'attention système :                                  │
│  -  Rentabilité en baisse sur 2 ans (-15%)                     │
│  -  Ratio endettement proche seuil (68%)                       │
│  -  DSO > 90j — risque trésorerie                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ NOTES QUALITATIVES ──────────────────────────────────────────┐
│  (ExpertReviewInputSchema.qualitative_notes)                   │
│                                                                │
│  <mat-form-field class="full-width">                           │
│    <mat-label>Analyse qualitative de l'expert *</mat-label>   │
│    <textarea matInput rows="6"                                 │
│      placeholder="Justification complète de la décision…">    │
│    </textarea>                                                 │
│  </mat-form-field>                                             │
└────────────────────────────────────────────────────────────────┘

┌─ OVERRIDE MANUEL ─────────────────────────────────────────────┐
│  Ajustement classe de risque par l'expert :                    │
│  [mat-select] → manual_risk_override                           │
│  Options: — (aucun) / FAIBLE / MODÉRÉ / ÉLEVÉ / CRITIQUE      │
│  ⚠️ Tout override doit être justifié dans les notes.           │
└────────────────────────────────────────────────────────────────┘

┌─ DÉCISION FINALE ─────────────────────────────────────────────┐
│  (ExpertReviewInputSchema.final_decision)                      │
│                                                                │
│  <mat-radio-group [(ngModel)]="finalDecision">                 │
│    <mat-radio-button value="VALIDATED">                        │
│      ✅ VALIDÉ — Capacité financière suffisante               │
│    </mat-radio-button>                                         │
│    <mat-radio-button value="VALIDATED_WITH_RESERVES">          │
│      🟡 VALIDÉ AVEC RÉSERVES — Conditions requises            │
│    </mat-radio-button>                                         │
│    <mat-radio-button value="REJECTED">                         │
│      🔴 REJETÉ — Capacité insuffisante                        │
│    </mat-radio-button>                                         │
│    <mat-radio-button value="PENDING_INVESTIGATION">            │
│      🔵 EN INVESTIGATION — Informations complémentaires        │
│    </mat-radio-button>                                         │
│  </mat-radio-group>                                            │
└────────────────────────────────────────────────────────────────┘

┌─ RECOMMANDATION MCC ──────────────────────────────────────────┐
│  (POST /api/v1/cases/{id}/recommendation)                      │
│  → RecommendationUpdate.recommendation                         │
│                                                                │
│  Conditions recommandées (si VALIDÉ AVEC RÉSERVES) :          │
│  [+ Ajouter condition]                                         │
│  -  Caution bancaire exigée : 10% du montant marché            │
│  -  Reporting financier trimestriel obligatoire                │
│  -  Plafond engagement max : 5.5M USD                          │
└────────────────────────────────────────────────────────────────┘

┌─ CONCLUSION FINALE ───────────────────────────────────────────┐
│  (PATCH /api/v1/cases/{id}/conclusion)                         │
│  → ConclusionUpdate.conclusion                                 │
│                                                                │
│  <mat-form-field class="full-width">                           │
│    <mat-label>Conclusion officielle *</mat-label>              │
│    <textarea matInput rows="4"                                 │
│      placeholder="L'analyse qualitative approfondie confirme…">│
│    </textarea>                                                 │
│  </mat-form-field>                                             │
└────────────────────────────────────────────────────────────────┘

<div class="expert-actions">
  <button mat-stroked-button>Modifier</button>
  <button mat-raised-button color="primary"
    (click)="submitExpertReview()">
    Soumettre la revue expert
  </button>
  <button mat-raised-button
    [disabled]="!expertReviewSubmitted"
    (click)="closeCase()">
    Clôturer le dossier → Rapport Final
    <!-- → PATCH /api/v1/cases/{id}/status: CLOSED -->
  </button>
</div>
```

---

## 17. BLOC 10 — Rapport Final & Export

**Route :** `/cases/:caseId/rapport`  
**APIs :** Lecture seule — `GET /api/v1/cases/{case_id}` (agrégat complet)

### 17.1 Topbar Actions

```html
<mat-toolbar class="rapport-toolbar">
  <span>Rapport d'Évaluation — {{ case.market_label }}</span>
  <span class="spacer"></span>
  <button mat-icon-button matTooltip="Imprimer" (click)="print()">
    <mat-icon>print</mat-icon>
  </button>
  <button mat-icon-button matTooltip="Envoyer par email" (click)="email()">
    <mat-icon>email</mat-icon>
  </button>
  <button mat-stroked-button (click)="exportPDF()">
    <mat-icon>picture_as_pdf</mat-icon> Export PDF
  </button>
  <button mat-stroked-button (click)="exportExcel()">
    <mat-icon>table_chart</mat-icon> Export Excel
  </button>
</mat-toolbar>
```

### 17.2 Section 1 — Synthèse Exécutive

```
┌─ SYNTHÈSE EXÉCUTIVE ───────────────────────────────────────────┐
│                                                                │
│  GAUCHE (infos dossier)        │  DROITE (résultat décision)  │
│  ─────────────────────         │  ─────────────────────────   │
│  Soumissionnaire: BTP MAROC SA │  Score MCC: 3.25 / 5         │
│  Marché: Autoroute A7 – Lot 3  │  [Gauge MCC 120px]           │
│  Montant: 5 200 000 USD        │  [Badge MODÉRÉ 🟡]           │
│  Analyste: Jean Dupont         │                              │
│  Date évaluation: 2026-03-11   │  Recommandation:             │
│  Politique: MCC v2.4           │  [VALIDÉ AVEC RÉSERVES]      │
│  Statut: CLÔTURÉ               │  (fond vert + icon check)    │
│                                │                              │
└────────────────────────────────────────────────────────────────┘
```

### 17.3 Section 2 — Scores par Pilier

```
5 <finaces-pillar-row> en lecture seule :
Liquidité    3.55  [████████████░░░] [Badge BON 🟢]
Solvabilité  3.05  [███████████░░░░] [Badge ACCEPTABLE 🟡]
Rentabilité  2.05  [███████░░░░░░░░] [Badge FAIBLE 🟠]
Capacité     3.55  [████████████░░░] [Badge BON 🟢]
Qualité      4.05  [████████████████] [Badge EXCELLENT 🟢]
```

### 17.4 Section 3 — Scoring IA de Challenge

```
┌─ SCORING IA (NON DÉCISIONNEL) ────── fond: --ia-surface ───────┐
│  <finaces-ia-disclaimer variant="inline" />                    │
│                                                                │
│  Score IA: 2.85   PDIA: 44%   [Badge IA HIGH 🟣]              │
│  Modèle: XGBoost v3.2.1   Confiance: 85%                      │
│  [Badge Tension MODERATE 🟡]   IA plus pessimiste              │
│                                                                │
│  Commentaire analyste sur la divergence :                      │
│  "L'analyse qualitative approfondie confirme la solidité       │
│   opérationnelle de BTP Maroc SA malgré les signaux IA…"       │
└────────────────────────────────────────────────────────────────┘
```

### 17.5 Section 4 — Stress Test

```
┌─ CAPACITÉ CONTRACTUELLE (STRESS TEST) ─────────────────────────┐
│  Exposition / CA: 22%   Score capacité: 3.5                   │
│  Stress 60j: 🟢 RÉSISTE (+85K$)                               │
│  Stress 90j: 🟡 LIMITE (-12K$ au mois 7)                      │
│  Conclusion: "Capacité contractuelle: SOLIDE avec vigilance"  │
└────────────────────────────────────────────────────────────────┘
```

### 17.6 Section 5 — Points d'Attention

```
Liste avec icônes (smart_recommendations + points manuels) :
⚠️  Rentabilité en baisse sur 2 ans (-15%) — Surveillance recommandée
⚠️  Ratio endettement proche seuil 68% — Limiter nouveaux emprunts
ℹ️  DSO > 90j — Risque trésorerie potentiel
ℹ️  Z-Score zone grise (2.45) — Vigilance maintenue
```

### 17.7 Section 6 — Conditions & Recommandations

```
┌─ CONDITIONS DE VALIDATION ─────────── fond: vert léger ────────┐
│  ✅ Validation conditionnelle avec garanties renforcées         │
│  1. Caution bancaire exigée : 10% du montant marché           │
│  2. Reporting financier trimestriel obligatoire               │
│  3. Plafond engagement maximum : 5.5M USD                     │
│  4. Clause de révision si endettement > 70%                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 18. BLOC CONSORTIUM — Cas Groupement

**Route :** `/cases/:caseId/consortium`  
**API :** `POST /api/v1/cases/{case_id}/consortium/calculate` → `ConsortiumScorecardOutput`  
**Activation :** Uniquement si `case_type = 'GROUPEMENT'`

### 18.1 Membres du Consortium

```
┌─ MEMBRES DU GROUPEMENT ──────────────────── [+ Ajouter membre] ─┐
│ mat-table :                                                      │
│ Membre         | Rôle      | Part %  | Dossier lié | Statut     │
│ BTP MAROC SA   | MANDATAIRE| 60%     | M001        | ✅ Scoré   │
│ Delta Const.   | COTRAITANT| 25%     | M002        | ✅ Scoré   │
│ Alpha Build    | COTRAITANT| 15%     | M003        | ⏳ En cours│
│                                                                  │
│ ConsortiumMemberCreate :                                         │
│   case_id / bidder_id / role / participation_pct                │
└──────────────────────────────────────────────────────────────────┘
```

### 18.2 Résultats Consortium

```
┌─ SCORECARD CONSORTIUM ─────────────────────────────────────────┐
│  ConsortiumScorecardOutput :                                    │
│                                                                │
│  Type JV:              GROUPEMENT CONJOINT                     │
│  Méthode agrégation:   PONDÉRÉE (weighted)                     │
│                                                                │
│  Score pondéré:        [Gauge 160px]  weighted_score           │
│  Synergy Index:        +0.12          synergy_index            │
│  Synergy Bonus:        +0.08          synergy_bonus            │
│                                                                │
│  ─── ALERTES SPÉCIFIQUES CONSORTIUM ─────────────────────── │
│  weak_link_triggered:  OUI 🔴                                  │
│  weak_link_member:     "Alpha Build" (score: 2.1)              │
│  leader_blocking:      NON 🟢                                  │
│  leader_override:      NON                                     │
│                                                                │
│  ─── CLASSES DE RISQUE ────────────────────────────────────  │
│  Classe de base:       MODÉRÉ                                  │
│  Classe finale:        ÉLEVÉ  (dégradé par weak link)         │
│  [Badge MCC ÉLEVÉ 🟠]                                          │
│                                                                │
│  ─── MEMBRES DÉTAILLÉS ─────────────────────────────────────  │
│  accordion par membre :                                        │
│  [BTP MAROC SA — 60%] Score: 3.25 · Contribution: +0.52      │
│  [Delta Const. — 25%] Score: 3.05 · Contribution: +0.18      │
│  [Alpha Build  — 15%] Score: 2.10 · Contribution: +0.08 ⚠️   │
│                                                                │
│  aggregated_stress:    "MOYEN"                                 │
│                                                                │
│  ─── MITIGATIONS SUGGÉRÉES ─────────────────────────────────  │
│  -  Exiger renforcement de Alpha Build (caution ou remplacement)│
│  -  Audit financier de l'exercice 2024 pour Alpha Build        │
└────────────────────────────────────────────────────────────────┘
```

---

## 19. BLOC ADMIN IA — Gestion Modèles

**Route :** `/admin/ia`  
**Accès :** Rôle `ADMIN_ML` ou `ADMIN` uniquement

### 19.1 KPI Cards (3)

```
[Modèle actif: XGBoost v3.2.1]  [ROC-AUC: 0.89]  [Prédictions today: 47]
```

### 19.2 Tableau des Modèles

```
mat-table :
ID  | Nom           | Version | ROC-AUC | F1    | Statut   | Trained at | Actions
001 | XGBoost       | v3.2.1  | 0.89    | 0.84  | [ACTIF 🟢]| 2026-02-15 | [Métriques][Config]
002 | XGBoost       | v3.1.5  | 0.87    | 0.82  | [ARCHIVÉ] | 2025-11-01 | [Activer][Suppr.]
003 | LightGBM      | v2.5.0  | 0.86    | 0.81  | [TEST 🔵] | 2026-03-01 | [Déployer][Suppr.]
004 | RandomForest  | v1.8.2  | 0.82    | 0.79  | [ARCHIVÉ] | 2025-07-10 | [Activer][Suppr.]
```

### 19.3 Performance Modèle Actif

```
mat-table :
Métrique   | Train | Validation | Test
ROC-AUC    | 0.92  |   0.89    | 0.89
Precision  | 0.85  |   0.82    | 0.82
Recall     | 0.88  |   0.86    | 0.86
F1-Score   | 0.87  |   0.84    | 0.84
Log Loss   | 0.28  |   0.32    | 0.33
```

### 19.4 Feature Importance Chart

```
bar chart horizontal (D3 ou Recharts) — Top 20 features :
debt_to_equity      ████████████████ 0.082
current_ratio       ██████████████   0.075
z_score_altman      ████████████     0.068
net_margin          ██████████       0.062
cash_flow_capacity  ████████         0.058
…

Couleurs par groupe :
  Liquidité    : --ia-low   (bleu)
  Solvabilité  : --ia-high  (violet)
  Rentabilité  : orange (#F97316)
  Capacité     : vert  (#22C55E)
  Qualité      : teal  (#14B8A6)
```

### 19.5 Monitoring & Alertes

```
┌─ MONITORING PRODUCTION ────────────────────────────────────────┐
│  7 derniers jours :                                            │
│  Prédictions: 328   Temps moyen: 1.2s   Taux erreur: 2.1%    │
│                                                                │
│  [ALERTE] 🔴 Drift détecté — 5 false positives depuis 15j     │
│           Recommandation: Réentraînement avec données 2025-26 │
│                                                                │
│  [OK] 🟢 Aucune anomalie performance détectée                  │
│  [OK] 🟢 Latence stable — p95: 1.8s                           │
└────────────────────────────────────────────────────────────────┘

Actions admin :
[Export config JSON]  [Réentraîner]  [Déployer nouveau modèle]
[Voir courbes ROC]    [Matrice de confusion]
```

---

## 20. États d'Exception & Empty States

### 20.1 IA Indisponible (Écran complet)

```html
<!-- Composant réutilisable dans toute zone IA -->
<div class="ia-unavailable-block">
  <mat-icon class="icon-xl text-disabled">smart_toy</mat-icon>
  <h3>Scoring IA non disponible</h3>
  <p>Données insuffisantes ou modèle indisponible pour ce dossier.</p>
  <button mat-stroked-button (click)="retryIA()">
    <mat-icon>refresh</mat-icon> Réessayer
  </button>
  <p class="ia-note">Le scoring MCC reste l'unique source décisionnelle.</p>
</div>
<!-- Bloc Tension : afficher "Non applicable — IA indisponible" -->
```

### 20.2 Mode Pilote

```html
<!-- Bannière discrète 40px — toujours visible si pilotMode=true -->
<div class="pilot-banner" *ngIf="pilotMode">
  <mat-icon>science</mat-icon>
  Module IA en phase pilote — Scores indicatifs uniquement.
  <a href="/admin/ia/pilot-info">En savoir plus</a>
</div>
```

### 20.3 Empty States — 5 variantes

```
(a) Aucun dossier
    🗂️  illustration vide
    "Aucun dossier trouvé"
    [+ Nouveau dossier]

(b) Aucune tension
    ✅  illustration check vert
    "Aucune tension détectée — Convergence parfaite"
    → Pas de CTA

(c) IA non calculée
    🤖  illustration robot
    "Prédiction IA non lancée pour ce dossier"
    [▶ Lancer la prédiction IA]

(d) Aucun résultat de recherche
    🔍  illustration vide
    "Aucun résultat pour « {query} »"
    [Réinitialiser les filtres]

(e) Dossier annulé
    🚫  illustration
    "Ce dossier a été annulé"
    [← Retour à la liste]
```

### 20.4 États de Chargement — Skeleton Loaders

```html
<!-- Skeleton pour bloc score -->
<ngx-skeleton-loader count="1"
  [theme]="{ height: '160px', width: '160px', 'border-radius': '50%' }">
</ngx-skeleton-loader>

<!-- Skeleton pour tableau -->
<ngx-skeleton-loader count="5"
  [theme]="{ height: '48px', 'margin-bottom': '8px' }">
</ngx-skeleton-loader>

<!-- Skeleton pour SHAP chart -->
<ngx-skeleton-loader count="10"
  [theme]="{ height: '24px', 'margin-bottom': '4px' }">
</ngx-skeleton-loader>
```

### 20.5 États d'Erreur Inline

```html
<!-- Erreur API inline dans chaque section -->
<div class="error-inline" *ngIf="error">
  <mat-icon color="warn">error_outline</mat-icon>
  <span>{{ error.message }}</span>
  <button mat-button color="primary" (click)="retry()">Réessayer</button>
</div>
```

---

## 21. Responsive Tablet (1024px)

### 21.1 Règles de Layout

```scss
@media (max-width: 1024px) {
  // Sidebar : repliée par défaut → icônes seules (40px)
  // Main content : pleine largeur
  // Grille : 8 colonnes → collapse en single-column

  .kpi-row      { flex-wrap: wrap; gap: 16px; }
  .kpi-card     { min-width: calc(50% - 8px); }

  .two-columns  { flex-direction: column; }

  .rapport-grid { grid-template-columns: 1fr; }

  // Score gauge : réduire de 160px → 120px
  finaces-score-gauge { --gauge-size: 120px; }

  // Tableau ratios : colonnes masquées
  .ratio-table .col-detail { display: none; }

  // Gate : 3 colonnes → single column scrollable
  .gate-layout  { grid-template-columns: 1fr; }

  // Stepper : horizontal → vertical
  mat-stepper   { --mat-stepper-orientation: vertical; }
}
```

### 21.2 Navigation Tablet

```
Sidebar repliée → icônes seules
Topbar : bouton hamburger → mat-drawer toggle
Bottom navigation optionnelle (mat-tab-nav-bar) pour les blocs principaux
```

---

## 22. Custom Components — Spec @Input/@Output

### 22.1 `finaces-risk-badge`

```typescript
@Component({
  selector: 'finaces-risk-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesRiskBadgeComponent {
  @Input({ required: true }) riskClass: 'LOW'|'MODERATE'|'HIGH'|'CRITICAL';
  @Input() rail: 'MCC'|'IA' = 'MCC';
  @Input() size: 'sm'|'md' = 'md';
  @Input() showLabel: boolean = true;
  @Input() showIcon: boolean = false;
}
```

### 22.2 `finaces-tension-badge`

```typescript
@Component({ selector: 'finaces-tension-badge', standalone: true })
export class FinacesTensionBadgeComponent {
  @Input({ required: true }) level: 'NONE'|'MILD'|'MODERATE'|'SEVERE';
  @Input() direction?: 'UP'|'DOWN';
  @Input() delta?: number;
  @Input() size: 'sm'|'md' = 'md';
}
```

### 22.3 `finaces-score-gauge`

```typescript
@Component({ selector: 'finaces-score-gauge', standalone: true })
export class FinacesScoreGaugeComponent implements OnChanges {
  @Input({ required: true }) score: number;
  @Input() maxScore: number = 5;
  @Input() rail: 'MCC'|'IA' = 'MCC';
  @Input() riskClass?: string;
  @Input() size: 80|120|160 = 120;
  @Input() animated: boolean = true;
  @Input() showLabel: boolean = true;
  @Output() rendered = new EventEmitter<void>();
  // D3.js arc — animation via requestAnimationFrame 800ms
}
```

### 22.4 `finaces-shap-chart`

```typescript
@Component({ selector: 'finaces-shap-chart', standalone: true })
export class FinacesShapChartComponent {
  @Input({ required: true }) features: ShapFeature[];
  @Input() maxFeatures: number = 10;
  @Input() showValues: boolean = true;
  @Input() height: number = 300;
  @Output() featureClick = new EventEmitter<ShapFeature>();
}

interface ShapFeature {
  name: string;
  label?: string;
  rawValue: number;
  shapValue: number;
  direction: 'UP'|'DOWN';
  group?: 'liquidity'|'solvency'|'profitability'|'capacity'|'quality';
}
```

### 22.5 `finaces-pillar-row`

```typescript
@Component({ selector: 'finaces-pillar-row', standalone: true })
export class FinacesPillarRowComponent {
  @Input({ required: true }) pillar: PillarDetailSchema; // depuis backend
  @Input() isExpanded: boolean = false;
  @Input() readonly: boolean = false;
  @Output() toggleExpand = new EventEmitter<string>();  // pillarId
  @Output() commentChange = new EventEmitter<string>(); // texte analyste
}
```

### 22.6 `finaces-ia-disclaimer`

```typescript
@Component({ selector: 'finaces-ia-disclaimer', standalone: true })
export class FinacesIaDisclaimerComponent {
  @Input() variant: 'banner'|'inline'|'chip' = 'banner';
  @Input() dismissible: boolean = false;
  @Input() pilotMode: boolean = false;
  @Output() dismissed = new EventEmitter<void>();
}
```

### 22.7 `finaces-stress-chart`

```typescript
@Component({ selector: 'finaces-stress-chart', standalone: true })
export class FinacesStressChartComponent {
  @Input({ required: true }) monthlyFlows: ScenarioFlowSchema[];
  @Input() stress60dResult?: string;
  @Input() stress90dResult?: string;
  @Input() criticalMonth?: number;
  @Input() height: number = 250;
}
```

---

## 23. Mapping API Complet — Écran → Endpoint → Schema

| Bloc | Action | Méthode + Endpoint | Schema entrée | Schema sortie |
|------|--------|-------------------|---------------|---------------|
| BLOC 0 | Charger dossiers | `GET /api/v1/cases` | — | `EvaluationCaseOut[]` |
| BLOC 0 | Lister soumissionnaires | `GET /api/v1/cases/bidders` | — | — |
| BLOC 1A | Créer dossier | `POST /api/v1/cases` | `CaseCreate` | `EvaluationCaseDetailOut` |
| BLOC 1A | Voir dossier | `GET /api/v1/cases/{id}` | — | `EvaluationCaseDetailOut` |
| BLOC 1A | Voir statut | `GET /api/v1/cases/{id}/status` | — | `CaseStatusResponse` |
| BLOC 1A | Transitionner statut | `PATCH /api/v1/cases/{id}/status` | `StatusTransition` | `CaseStatusResponse` |
| BLOC 1B | Uploader document | `POST /api/v1/cases/{id}/documents` | `Body_upload_document` | `DocumentOut` |
| BLOC 1B | Lister documents | `GET /api/v1/cases/{id}/documents` | — | `DocumentOut[]` |
| BLOC 1B | Vérifier intégrité | `GET /api/v1/cases/{id}/documents/{doc_id}/integrity` | — | — |
| BLOC 1B | Statut document | `PATCH /api/v1/cases/documents/{doc_id}/status` | `DocumentStatusUpdate` | — |
| BLOC 1B | Évaluer Gate | `POST /api/v1/cases/{id}/gate/evaluate` | — | `GateDecisionSchema` |
| BLOC 2 | Créer état financier | `POST /api/v1/cases/{id}/financials` | `FinancialStatementCreate` | `FinancialStatementRawOut` |
| BLOC 2 | Lire états financiers | `GET /api/v1/cases/{id}/financials` | — | `FinancialStatementRawOut[]` |
| BLOC 2 | Supprimer exercice | `DELETE /api/v1/cases/{id}/financials/{stmt_id}` | — | — |
| BLOC 3 | Lancer normalisation | `POST /api/v1/cases/{id}/normalize` | — | `FinancialStatementNormalizedSchema` |
| BLOC 4 | Calculer ratios | `POST /api/v1/cases/{id}/ratios/compute` | — | `RatioSetSchema` |
| BLOC 5 | Calculer score MCC | `POST /api/v1/cases/{id}/score` | — | `ScorecardOutputSchema` |
| BLOC 5 | Mettre à jour recommandation | `POST /api/v1/cases/{id}/recommendation` | `RecommendationUpdate` | — |
| BLOC 6 | Prédiction IA | Route `ia.py` (à confirmer) | features payload | prediction + SHAP |
| BLOC 8 | Lancer stress test | `POST /api/v1/cases/{id}/stress/run` | `StressScenarioInputSchema` | `StressResultSchema` |
| BLOC 9 | Soumettre expert review | `POST /api/v1/cases/{id}/experts/review` | `ExpertReviewInputSchema` | `ExpertReviewOutputSchema` |
| BLOC 9 | Sauvegarder conclusion | `PATCH /api/v1/cases/{id}/conclusion` | `ConclusionUpdate` | — |
| CONSORTIUM | Calculer consortium | `POST /api/v1/cases/{id}/consortium/calculate` | — | `ConsortiumScorecardOutput` |
| SYSTÈME | Health check | `GET /health` | — | — |

---

## 24. Design Tokens JSON / SCSS

### 24.1 tokens.json (export Angular/SCSS)

```json
{
  "color": {
    "mcc": {
      "low":          { "value": "#22C55E", "type": "color" },
      "moderate":     { "value": "#F59E0B", "type": "color" },
      "high":         { "value": "#F97316", "type": "color" },
      "critical":     { "value": "#EF4444", "type": "color" },
      "surface":      { "value": "#F8FAFC", "type": "color" },
      "border":       { "value": "#E2E8F0", "type": "color" }
    },
    "ia": {
      "low":          { "value": "#3B82F6", "type": "color" },
      "moderate":     { "value": "#6366F1", "type": "color" },
      "high":         { "value": "#8B5CF6", "type": "color" },
      "critical":     { "value": "#A855F7", "type": "color" },
      "surface":      { "value": "#F0F4FF", "type": "color" },
      "border":       { "value": "#C7D2FE", "type": "color" }
    },
    "tension": {
      "none":         { "value": "#22C55E", "type": "color" },
      "mild":         { "value": "#3B82F6", "type": "color" },
      "moderate":     { "value": "#F59E0B", "type": "color" },
      "severe":       { "value": "#EF4444", "type": "color" }
    },
    "neutral": {
      "primary":      { "value": "#1E3A5F", "type": "color" },
      "secondary":    { "value": "#64748B", "type": "color" },
      "bg-default":   { "value": "#F8FAFC", "type": "color" },
      "bg-card":      { "value": "#FFFFFF", "type": "color" },
      "text-primary": { "value": "#0F172A", "type": "color" },
      "text-secondary":{ "value": "#475569","type": "color" },
      "border":       { "value": "#E2E8F0", "type": "color" }
    }
  },
  "spacing": {
    "xs":  { "value": "4px",  "type": "spacing" },
    "sm":  { "value": "8px",  "type": "spacing" },
    "md":  { "value": "16px", "type": "spacing" },
    "lg":  { "value": "24px", "type": "spacing" },
    "xl":  { "value": "32px", "type": "spacing" },
    "2xl": { "value": "48px", "type": "spacing" },
    "3xl": { "value": "64px", "type": "spacing" }
  },
  "typography": {
    "font-primary": { "value": "Inter, -apple-system, sans-serif" },
    "font-mono":    { "value": "JetBrains Mono, monospace" }
  },
  "shadow": {
    "sm": { "value": "0 1px 3px rgba(0,0,0,0.08)" },
    "md": { "value": "0 4px 12px rgba(0,0,0,0.10)" },
    "lg": { "value": "0 8px 24px rgba(0,0,0,0.12)" }
  }
}
```

### 24.2 _variables.scss

```scss
:root {
  // MCC Rail
  --mcc-low: #22C55E; --mcc-moderate: #F59E0B;
  --mcc-high: #F97316; --mcc-critical: #EF4444;
  --mcc-surface: #F8FAFC; --mcc-border: #E2E8F0;

  // IA Rail
  --ia-low: #3B82F6; --ia-moderate: #6366F1;
  --ia-high: #8B5CF6; --ia-critical: #A855F7;
  --ia-surface: #F0F4FF; --ia-border: #C7D2FE;

  // Tension
  --tension-none: #22C55E; --tension-mild: #3B82F6;
  --tension-moderate: #F59E0B; --tension-severe: #EF4444;

  // Neutrals
  --primary: #1E3A5F; --secondary: #64748B;
  --bg-default: #F8FAFC; --bg-card: #FFFFFF;
  --bg-sidebar: #0F172A;
  --text-primary: #0F172A; --text-secondary: #475569;
  --text-disabled: #94A3B8; --border: #E2E8F0;
  --success: #22C55E; --warning: #F59E0B;
  --error: #EF4444; --info: #3B82F6;

  // Shadows
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);

  // Layout
  --sidebar-width: 240px;
  --topbar-height: 64px;
  --content-max-width: 1160px;
}
```

---

## 25. Guards Angular & Règles de Navigation

### 25.1 CaseStatusGuard

```typescript
@Injectable({ providedIn: 'root' })
export class CaseStatusGuard implements CanActivate {
  constructor(
    private caseService: CaseService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const caseId = route.parent?.params['caseId'];
    const requiredStatuses: string[] = route.data['requiredStatuses'];

    return this.caseService.getCaseStatus(caseId).pipe(
      map(status => {
        if (requiredStatuses.includes(status)) {
          return true;
        }
        // Rediriger vers l'étape courante correspondant au statut réel
        const targetRoute = this.resolveRouteFromStatus(status, caseId);
        return this.router.createUrlTree([targetRoute]);
      })
    );
  }

  private resolveRouteFromStatus(status: string, caseId: string): string {
    const routeMap: Record<string, string> = {
      'DRAFT':              `/cases/${caseId}/workspace`,
      'PENDING_GATE':       `/cases/${caseId}/gate`,
      'FINANCIAL_INPUT':    `/cases/${caseId}/financials`,
      'NORMALIZATION_DONE': `/cases/${caseId}/normalization`,
      'RATIOS_COMPUTED':    `/cases/${caseId}/ratios`,
      'SCORING_DONE':       `/cases/${caseId}/scoring`,
      'STRESS_DONE':        `/cases/${caseId}/stress`,
      'EXPERT_REVIEWED':    `/cases/${caseId}/expert`,
      'CLOSED':             `/cases/${caseId}/rapport`,
    };
    return routeMap[status] ?? '/dashboard';
  }
}
```

### 25.2 Règles de Désactivation dans le Stepper

```html
<!-- app-case-workspace stepper -->
<mat-stepper [linear]="true" [selectedIndex]="currentStepIndex">

  <mat-step label="Recevabilité"
    [completed]="caseStatus !== 'DRAFT'">
  </mat-step>

  <mat-step label="Gate Documentaire"
    [completed]="isStatusAfter('PENDING_GATE')"
    [editable]="isStatusAfter('PENDING_GATE')">
  </mat-step>

  <mat-step label="États Financiers"
    [completed]="isStatusAfter('FINANCIAL_INPUT')"
    [editable]="isStatusAfter('FINANCIAL_INPUT')">
  </mat-step>

  <mat-step label="Normalisation"
    [completed]="isStatusAfter('NORMALIZATION_DONE')"
    [editable]="isStatusAfter('NORMALIZATION_DONE')">
  </mat-step>

  <mat-step label="Ratios"
    [completed]="isStatusAfter('RATIOS_COMPUTED')"
    [editable]="isStatusAfter('RATIOS_COMPUTED')">
  </mat-step>

  <mat-step label="Scoring MCC + IA"
    [completed]="isStatusAfter('SCORING_DONE')"
    [editable]="isStatusAfter('SCORING_DONE')">
  </mat-step>

  <mat-step label="Tension"
    [completed]="isStatusAfter('SCORING_DONE')"
    [editable]="isStatusAfter('SCORING_DONE')">
  </mat-step>

  <mat-step label="Stress Test"
    [completed]="isStatusAfter('STRESS_DONE')"
    [editable]="isStatusAfter('STRESS_DONE')">
  </mat-step>

  <mat-step label="Expert Review"
    [completed]="isStatusAfter('EXPERT_REVIEWED')"
    [editable]="isStatusAfter('EXPERT_REVIEWED')">
  </mat-step>

  <mat-step label="Rapport Final"
    [completed]="caseStatus === 'CLOSED'">
  </mat-step>

</mat-stepper>
```

### 25.3 Animations Angular

```typescript
// animations.ts
export const TENSION_BANNER_ANIMATION = trigger('tensionBanner', [
  transition(':enter', [
    style({ transform: 'translateY(-100%)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);

export const SCORE_GAUGE_ANIMATION = trigger('gaugeAnim', [
  transition(':enter', [
    // géré directement en D3 via requestAnimationFrame — 800ms
  ])
]);

export const EXPANSION_PANEL_ANIMATION =
  // Angular Material natif — aucune surcharge nécessaire
  matExpansionAnimations;

export const FADE_IN = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
```

---

## ANNEXE — Checklist Développeur

Avant de commencer chaque Bloc, vérifier :

- [ ] Le `case_id` est disponible dans les params de route
- [ ] Le `CaseStatusGuard` est attaché à la route
- [ ] Le Skeleton loader est en place pour tous les appels API
- [ ] L'état d'erreur inline est géré
- [ ] Le `<finaces-ia-disclaimer>` est présent si le Bloc affiche de l'IA
- [ ] La hiérarchie visuelle MCC > IA est respectée
- [ ] Les tokens CSS `--mcc-*` et `--ia-*` ne sont JAMAIS mélangés
- [ ] Le Bloc Tension vérifie `tensionLevel` avant d'activer le bouton "Clôturer"
- [ ] Les endpoints API sont ceux du Swagger OAS 3.1 confirmé (localhost:8000)
- [ ] L'endpoint IA est confirmé depuis `ia.py` avant implémentation
- [ ] Le cas `case_type = 'GROUPEMENT'` affiche le lien vers BLOC CONSORTIUM
- [ ] L'export PDF/Excel est déclenché via route `export.py` backend
- [ ] Les guards redirigent vers l'étape courante (jamais d'accès direct hors séquence)

---

*Document généré le 2026-03-16 — Version 1.0*  
*Sources : FinaCES API Swagger OAS 3.1 · Double_Rail_FinaCES.md · PROMPT_maquette.md*  
*À maintenir en cohérence avec le backend Python FastAPI (FinaCES-API-MCC)*

```

***
