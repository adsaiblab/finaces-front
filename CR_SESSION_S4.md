# COMPTE-RENDU — SESSION S4 : Features Métier Bloc par Bloc

**Auditeur** : Claude Opus 4.6
**Date** : 2026-03-27
**Périmètre** : 43 findings (F-S4-01 → F-S4-43) — Blocs 0→12, app-layout, shared atoms, routing

---

## Bilan synthétique

| Métrique | Valeur |
|:--|:--|
| Findings vérifiés | 43 / 43 |
| ✅ Confirmés | 39 |
| ⚠️ Confirmés avec nuances | 3 |
| ❌ Faux positifs | 1 |

---

## BLOC 0 — Dashboard (F-S4-01 → F-S4-13)

---

### F-S4-01 — `dashboard.component.ts` : 4 Observables sans `catchError`

**Verdict : ✅ CONFIRMÉ**

Lignes 37-40 : les 4 Observables (`stats$`, `recentCases$`, `tensions$`, `chartData$`) sont déclarées sans aucun opérateur `catchError`.

```typescript
readonly stats$: Observable<DashboardStatsOut> = this.caseService.getDashboardStats();
readonly recentCases$: Observable<EvaluationCaseDetailOut[]> = this.caseService.getRecentCases(5);
readonly tensions$: Observable<TensionAlertOut[]> = this.caseService.getActiveTensionCases();
readonly chartData$: Observable<ConvergenceChartOut> = this.caseService.getConvergenceChart(30);
```

**Note** : Ce finding est lié à F-S3-01a (async pipe). L'ajout de `catchError` est la priorité ici, pas `takeUntilDestroyed` (async pipe gère le cleanup).

---

### F-S4-02 — `dashboard.component.html` : `stats$ | async` sans skeleton

**Verdict : ✅ CONFIRMÉ**

Ligne 16 : `stats$ | async` passé directement sans `@if` ni skeleton :
```html
<app-kpi-row [stats]="stats$ | async" />
```

`chartData$ | async` (ligne 28) est aussi sans fallback. Les autres (`recentCases$`, `tensions$`) ont un fallback `|| []`.

---

### F-S4-03 — `case-workspace.component.ts` : Pas de résolution centralisée du `:id`

**Verdict : ✅ CONFIRMÉ**

Le composant `CaseWorkspaceComponent` est vide (13 lignes, aucune logique). Chaque bloc enfant résout indépendamment :
```typescript
const resolvedId = this.route.parent?.snapshot.paramMap.get('id') ||
                  this.route.snapshot.paramMap.get('id') || '';
```

Pattern répété dans financials (ligne 59), expert (ligne 48), rapport (ligne 37), consortium (ligne 52), etc.

---

### F-S4-04 — `dashboard.component.html` : `mat-raised-button`

**Verdict : ✅ CONFIRMÉ**

Ligne 9 : `mat-raised-button` utilisé avec `box-shadow` incompatible dark mode :
```html
<button mat-raised-button color="primary" routerLink="/cases/new" class="btn-new-case">
```

---

### F-S4-05 — `dashboard.component.scss` : `margin: 0 auto`

**Verdict : ✅ CONFIRMÉ**

Ligne 5 : `margin: 0 auto` dans `.dashboard-container`.

---

### F-S4-06 — `kpi-row.component.scss` : `rgba()` hardcodés

**Verdict : ✅ CONFIRMÉ**

Ligne 11 : `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)` dans `&:hover`.

---

### F-S4-07 — `convergence-chart.component.scss` : `rgba()` hardcodé

**Verdict : ✅ CONFIRMÉ**

Ligne 7 : `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)` dans `.chart-container`.

---

### F-S4-08 — `convergence-chart.component.ts` : HEX hardcodés en fallback

**Verdict : ✅ CONFIRMÉ**

Lignes 47-51 : 5 fallbacks HEX hardcodés :
```typescript
const mccColor   = getCssVar('--color-success', '#2B8A5A');
const iaColor    = getCssVar('--color-info',    '#4A7A9E');
const alertColor = getCssVar('--color-error',   '#BC3B3B');
const textColor  = getCssVar('--color-content-secondary', '#5C6773');
const gridColor  = getCssVar('--color-border-default',    '#E5E0D8');
```

---

### F-S4-09 — `convergence-chart.component.ts` : `chart.js/auto` import massif

**Verdict : ✅ CONFIRMÉ**

Ligne 5 : `import Chart from 'chart.js/auto'` — importe ~90KB du bundle complet alors que seul `'line'` est utilisé.

---

### F-S4-10 — `convergence-chart.component.ts` : `@Inject(PLATFORM_ID)` legacy

**Verdict : ✅ CONFIRMÉ**

Ligne 22 : `constructor(@Inject(PLATFORM_ID) platformId: Object)` — pattern decorator legacy au lieu de `inject(PLATFORM_ID)`.

---

### F-S4-11 — `convergence-chart.component.ts` : `'fr-FR'` hardcodé

**Verdict : ✅ CONFIRMÉ**

Ligne 55 : `d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })`.

---

### F-S4-12 — `dashboard.component.html` : Textes UI hardcodés

**Verdict : ✅ CONFIRMÉ**

Lignes 5-12 du template : `"FinaCES — Dashboard"`, `"Global overview..."`, `"New Case"`. Labels également hardcodés dans `kpi-row.component.html` : `"Active Cases"`, `"Pending Validation"`, `"Tension Alerts"`, `"AI Convergence"`.

---

### F-S4-13 — `kpi-row.component.ts` : `CommonModule` + `MatCardModule`

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

`MatCardModule` est bien importé (ligne 3) et dans `imports[]` (ligne 12). **Cependant**, `<mat-card>` est effectivement utilisé dans le template (lignes 4, 17, 30, 44 de `kpi-row.component.html`).

L'audit affirme que l'import est "mort" car le SCSS custom `.kpi-card` remplace le style Material. C'est une **recommandation de design** valide (remplacer `<mat-card>` par `<div class="kpi-card">` pour éliminer la dépendance), mais la formulation "import mort" est **imprécise** — l'import EST activement utilisé dans le template actuel.

**Action** : Valide comme refactoring, pas comme bug.

---

## BLOC 1b — Gate (F-S4-14 → F-S4-16)

---

### F-S4-14 — `gate.component.ts` : `caseId!: string` non-null assertion

**Verdict : ✅ CONFIRMÉ**

Ligne 50 : `caseId!: string;`.

---

### F-S4-15 — `gate.component.scss` : `color-mix()` sans fallback

**Verdict : ✅ CONFIRMÉ**

Lignes 47, 53 : `color-mix(in srgb, ...)` sans `@supports` :
```scss
background-color: color-mix(in srgb, var(--color-warning) 10%, transparent);
background-color: color-mix(in srgb, var(--color-success) 10%, transparent);
```

---

### F-S4-16 — `gate.component.ts` : `onDownloadDocument()` stub

**Verdict : ✅ CONFIRMÉ**

Lignes 160-163 : méthode stub avec snackbar `"Téléchargement démarré..."` et commentaire explicite `"Dans un vrai projet, on gèrerait le blob."`.

---

## BLOC 2 — Financials (F-S4-17 → F-S4-18)

---

### F-S4-17 — `financials.component.ts` : `data: any` dans les event handlers

**Verdict : ✅ CONFIRMÉ**

4 méthodes avec `any` :
- Ligne 68 : `onAssetsUpdate(event: { total: number, data: any })`
- Ligne 72 : `onLiabilitiesUpdate(event: { total: number, data: any })`
- Ligne 76 : `onPnlUpdate(event: { netIncome: number, ebitda: number, data: any })`
- Ligne 80 : `onCashFlowUpdate(event: { netCashFlow: number, data: any })`

L'audit ne mentionnait qu'une seule méthode ; il y en a en réalité **4**.

---

### F-S4-18 — `financials.component.ts` : `MatTabsModule` importé inutilement

**Verdict : ❌ FAUX POSITIF**

`MatTabsModule` est importé (ligne 7) ET **utilisé dans le template** : `financials.component.html` contient `<mat-tab-group>` et `<mat-tab>` (lignes 27-72). L'import n'est PAS mort.

**Action** : Retirer du plan d'exécution.

---

## BLOC 4 — Ratios (F-S4-19)

---

### F-S4-19 — `bloc4-ratios/` : Doublon de fichiers

**Verdict : ✅ CONFIRMÉ**

Deux composants coexistent :
- `bloc4-ratios.component.ts` (7 202 bytes, 163 lignes, implémentation complète)
- `ratios.component.ts` (372 bytes, 12 lignes, stub vide)

---

## BLOC 6 — IA (F-S4-20 → F-S4-21)

---

### F-S4-20 — `ia.component.ts` : `console.warn()` en production

**Verdict : ✅ CONFIRMÉ**

Ligne 73 : `console.warn('Backend IA unavailable, injecting Enterprise-Grade Mock')` dans le callback `error`.

---

### F-S4-21 — `ia.component.ts` : Paramètre `err` non utilisé

**Verdict : ✅ CONFIRMÉ**

Ligne 72 : `error: (err) => { ... }` — `err` déclaré mais non référencé dans le corps.

---

## BLOC 7 — Tension (F-S4-22)

---

### F-S4-22 — `tension.component.ts` : Routage post-décision hardcodé

**Verdict : ✅ CONFIRMÉ**

Ligne 115 : `this.router.navigate(['/cases', this.caseId(), 'stress'])` — navigue toujours vers bloc8/stress quel que soit `payload.decision`.

---

## BLOC 8 — Stress (F-S4-23)

---

### F-S4-23 — `stress.component.ts` : `any` dans les subscribes

**Verdict : ✅ CONFIRMÉ**

Ligne 57 : `data` sans typage, castée ensuite `as unknown as StressTestResponse`. Ligne 138 : `(s: any)` dans le mapping des scenarios mock.

---

## BLOC 9 — Expert (F-S4-24 → F-S4-26)

---

### F-S4-24 — `expert.component.ts` : `caseId` résolu en propriété directe

**Verdict : ✅ CONFIRMÉ**

Ligne 48 : `caseId = this.route.parent?.snapshot.paramMap.get('id') || ...` — résolution à la construction, pas dans `ngOnInit()`.

---

### F-S4-25 — `expert.component.ts` : `conclusionPayload` dead code

**Verdict : ✅ CONFIRMÉ**

Lignes 120-124 : `conclusionPayload` construit. Ligne 147 : commentaire `"Appel de this.expertService.submitConclusion(...) ici dans le futur"`. Payload jamais envoyé.

---

### F-S4-26 — `expert.component.ts` : `override_recommendation: ['NONE']` hardcodé

**Verdict : ✅ CONFIRMÉ**

Ligne 68 : `override_recommendation: ['NONE']` — string sentinelle sans enum.

---

## BLOC 10 — Rapport (F-S4-27 → F-S4-28)

---

### F-S4-27 — `rapport.component.ts` : `FinacesScoreGaugeComponent` absent des `imports[]`

**Verdict : ✅ CONFIRMÉ**

Ligne 12 : import TypeScript présent. Lignes 17-23 : `imports[]` ne contient PAS `FinacesScoreGaugeComponent`. Le composant ne sera pas résolu dans le template standalone.

---

### F-S4-28 — `rapport.component.ts` : `caseId` résolu hors `ngOnInit()`

**Verdict : ✅ CONFIRMÉ**

Ligne 37 : résolution directe en propriété de classe. Même pattern que F-S4-24.

---

## BLOC 12 — Consortium (F-S4-29, F-S4-40)

---

### F-S4-29 — `consortium.component.ts` : `caseId` résolu hors `ngOnInit()`

**Verdict : ✅ CONFIRMÉ**

Ligne 52 : résolution directe en propriété de classe.

---

### F-S4-40 — `consortium.component.ts` : `MatTabsModule` potentiellement inutile

**Verdict : ✅ CONFIRMÉ**

Ligne 10 : `MatTabsModule` importé. Ligne 33 : dans `imports[]`. Template vérifié : **aucun `<mat-tab-group>` ni `<mat-tab>`**. Le composant utilise des divs et accordéons custom. Import mort.

---

## Admin-IA (F-S4-30 → F-S4-31)

---

### F-S4-30 — `admin-ia.component.ts` : `MatSnackBarModule` absent

**Verdict : ✅ CONFIRMÉ**

Ligne 4 : `MatSnackBar` importé. Ligne 33 : injecté via `inject()`. Lignes 18-25 : `imports[]` ne contient PAS `MatSnackBarModule`.

---

### F-S4-31 — `admin-ia.component.ts` : `ModelConfigDialogComponent` absent des `imports[]`

**Verdict : ✅ CONFIRMÉ**

Ligne 12 : import TypeScript présent. Ligne 62 : `this.dialog.open(ModelConfigDialogComponent, {...})`. Lignes 18-25 : absent de `imports[]`.

---

## Pattern systémique (F-S4-32)

---

### F-S4-32 — `MatSnackBarModule` absent dans bloc9, bloc10, bloc12

**Verdict : ✅ CONFIRMÉ**

Vérifié dans les 3 composants :
- `expert.component.ts` : `MatSnackBar` injecté (ligne 46), absent de `imports[]` (lignes 24-35)
- `rapport.component.ts` : `MatSnackBar` injecté (ligne 34), absent de `imports[]` (lignes 17-23)
- `consortium.component.ts` : `MatSnackBar` injecté (ligne 48), absent de `imports[]` (lignes 26-37)

---

## App-Layout (F-S4-33 → F-S4-37)

---

### F-S4-33 — `app-layout.component.html` : `shadow-sm` sur header

**Verdict : ✅ CONFIRMÉ**

Ligne 57 : `class="... shadow-sm z-10"` sur `<header>`.

---

### F-S4-34 — `app-layout.component.html` : `p-6` sur `<main>`

**Verdict : ✅ CONFIRMÉ**

Ligne 75 : `class="flex-1 overflow-y-auto p-6 ..."` sur `<main>`.

---

### F-S4-35 — `app-layout.component.html` : SVGs inline dupliqués

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

L'audit annonce **7 SVGs inline**. Le code réel en contient **6** :
- Ligne 12 : Menu toggle
- Ligne 24 : Dashboard icon
- Ligne 35 : Strategic Assistant icon
- Ligne 46 : AI Assistant icon
- Ligne 60 : Sun (light mode) icon
- Ligne 66 : Moon (dark mode) icon

Décompte ajusté à 6, sans impact sur le verdict.

---

### F-S4-36 — `app-layout.component.html` : Labels hardcodés

**Verdict : ✅ CONFIRMÉ**

Ligne 9 : `"FinaCES"`. Ligne 40 : `"Strategic Assistant"`.

---

### F-S4-37 — `app-layout.component.html` : Wrapper `<div>` autour de `<router-outlet>`

**Verdict : ✅ CONFIRMÉ**

Lignes 76-78 :
```html
<div class="w-full min-h-full">
    <router-outlet></router-outlet>
</div>
```

---

## Dashboard SCSS / Chart SCSS (F-S4-38 → F-S4-39)

---

### F-S4-38 — `dashboard.component.scss` : `!important` dans `.btn-new-case`

**Verdict : ✅ CONFIRMÉ**

Lignes 68-71 :
```scss
.btn-new-case {
    border-radius: 0.5rem !important;
    padding: 0.5rem 1.5rem !important;
}
```

---

### F-S4-39 — `convergence-chart.component.scss` : `height: 16rem` fixe

**Verdict : ✅ CONFIRMÉ**

Lignes 27-32 : `.canvas-wrapper { height: 16rem; }` — non adaptatif.

---

## Shared Atoms (F-S4-41 → F-S4-42)

---

### F-S4-41 — `finaces-risk-badge.component.ts` : `metadataMap` sans `as const`

**Verdict : ✅ CONFIRMÉ**

Lignes 35-40 : `metadataMap` déclaré avec annotation de type `Record<RiskClass, RiskMetadata>` mais sans `as const`.

---

### F-S4-42 — `finaces-score-gauge.component.spec.ts` : Mutation directe dans les tests

**Verdict : ✅ CONFIRMÉ**

Lignes 72-73 :
```typescript
component.displayScore = 2.5;   // mutation directe
component.maxScore = 5;          // mutation directe
```

Au lieu de `fixture.componentRef.setInput('score', 2.5)` utilisé ailleurs dans le même fichier (ligne 16).

---

## Routing (F-S4-43)

---

### F-S4-43 — `app.routes.ts` : `cases/:id` sans guard UUID

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

Le code place correctement `cases/new` AVANT `cases/:id` (ligne 28 avant ligne 43), ce qui empêche `'new'` d'être interprété comme un UUID par le routeur. La mitigation par **ordre des routes** fonctionne.

Cependant, aucun `CanActivateFn` ne valide le format UUID du paramètre `:id`. La protection repose sur l'ordre des routes — fragile en cas de refactoring.

**Action** : Le guard UUID reste une recommandation de robustesse valide, mais le risque actuel est **moyen** (pas critique).

---

## Résumé des actions S4

| Finding | Sévérité | Verdict | Bloc |
|:--|:--|:--|:--|
| F-S4-01 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-02 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-03 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-04 | 🟡 MINEUR | ✅ Confirmé | Dashboard |
| F-S4-05 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-06 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-07 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-08 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-09 | 🟠 MAJEUR | ✅ Confirmé | Dashboard |
| F-S4-10 | 🔴 CRITIQUE | ✅ Confirmé | Dashboard |
| F-S4-11 | 🟡 MINEUR | ✅ Confirmé | Dashboard |
| F-S4-12 | 🟠 MAJEUR | ✅ Confirmé | Dashboard |
| F-S4-13 | 🟠 MAJEUR | ⚠️ Nuance — import utilisé, refactoring valide | Dashboard |
| F-S4-14 | 🟠 MAJEUR | ✅ Confirmé | Gate |
| F-S4-15 | 🟠 MAJEUR | ✅ Confirmé | Gate |
| F-S4-16 | 🟡 MINEUR | ✅ Confirmé | Gate |
| F-S4-17 | 🟠 MAJEUR | ✅ Confirmé (4 méthodes, pas 1) | Financials |
| F-S4-18 | 🟡 MINEUR | ❌ FAUX POSITIF — MatTabsModule utilisé | Financials |
| F-S4-19 | 🟡 MINEUR | ✅ Confirmé | Ratios |
| F-S4-20 | 🟠 MAJEUR | ✅ Confirmé | IA |
| F-S4-21 | 🟡 MINEUR | ✅ Confirmé | IA |
| F-S4-22 | 🟡 MINEUR | ✅ Confirmé | Tension |
| F-S4-23 | 🟠 MAJEUR | ✅ Confirmé | Stress |
| F-S4-24 | 🔴 CRITIQUE | ✅ Confirmé | Expert |
| F-S4-25 | 🔴 CRITIQUE | ✅ Confirmé | Expert |
| F-S4-26 | 🟡 MINEUR | ✅ Confirmé | Expert |
| F-S4-27 | 🔴 CRITIQUE | ✅ Confirmé | Rapport |
| F-S4-28 | 🔴 CRITIQUE | ✅ Confirmé | Rapport |
| F-S4-29 | 🔴 CRITIQUE | ✅ Confirmé | Consortium |
| F-S4-30 | 🔴 CRITIQUE | ✅ Confirmé | Admin-IA |
| F-S4-31 | 🟠 MAJEUR | ✅ Confirmé | Admin-IA |
| F-S4-32 | 🟠 MAJEUR | ✅ Confirmé (3 composants) | Systémique |
| F-S4-33 | 🟠 MAJEUR | ✅ Confirmé | Layout |
| F-S4-34 | 🟠 MAJEUR | ✅ Confirmé | Layout |
| F-S4-35 | 🟡 MINEUR | ⚠️ Confirmé (6 SVGs, pas 7) | Layout |
| F-S4-36 | 🟡 MINEUR | ✅ Confirmé | Layout |
| F-S4-37 | 🟠 MAJEUR | ✅ Confirmé | Layout |
| F-S4-38 | 🟡 MINEUR | ✅ Confirmé | Dashboard SCSS |
| F-S4-39 | 🟠 MAJEUR | ✅ Confirmé | Chart SCSS |
| F-S4-40 | 🟡 MINEUR | ✅ Confirmé | Consortium |
| F-S4-41 | 🟡 MINEUR | ✅ Confirmé | Risk Badge |
| F-S4-42 | 🔴 CRITIQUE | ✅ Confirmé | Score Gauge Spec |
| F-S4-43 | 🔴 CRITIQUE | ⚠️ Confirmé (mitigation par ordre, guard recommandé) | Routing |

**Bilan : 39/43 confirmés exactement, 3 avec nuances mineures, 1 faux positif (F-S4-18).**
