# 🚨 RAPPORT D'AUDIT TECHNIQUE — PROJET FINACES FRONTEND

**Date :** 26 Mars 2026
**Auditeur :** Architecte Frontend Senior (Enterprise-Grade)
**Référentiel :** Manifeste FinaCES v1.0
**Périmètre :** `/src/app/**` — 80+ composants, 15+ services, styles globaux, tests Vitest

---

## AXE 1 — Architecture Angular 17+ & Performances

| Sévérité | Fichier / Composant | Finding (Anomalie) | Action Requise |
| :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `core/layout/app-layout/app-layout.component.ts` | **Absence de `ChangeDetectionStrategy.OnPush`** — Ce composant racine (shell) utilise la stratégie `Default`. Chaque tick Angular déclenche un cycle complet sur tout l'arbre enfant. | Ajouter `changeDetection: ChangeDetectionStrategy.OnPush` dans le décorateur `@Component`. |
| 🔴 CRITIQUE | `features/reporting/reporting.component.ts` | **Absence de `OnPush`** — Composant de reporting sans stratégie de détection. | Ajouter `changeDetection: ChangeDetectionStrategy.OnPush`. |
| 🔴 CRITIQUE | `features/consortium/consortium.component.ts` | **Absence de `OnPush`** — Composant Consortium (dossier `features/consortium/`, distinct de `bloc12-consortium`). | Ajouter `changeDetection: ChangeDetectionStrategy.OnPush`. |
| 🔴 CRITIQUE | `features/bloc7-tension/components/analyst-decision/analyst-decision.component.ts` | **Fuite mémoire** — `this.decisionForm.valueChanges.subscribe(...)` dans le constructeur sans aucun mécanisme de cleanup. Le composant n'implémente pas `OnDestroy`. | Ajouter `private destroyRef = inject(DestroyRef)` et piper `takeUntilDestroyed(this.destroyRef)` sur le subscribe. |
| 🔴 CRITIQUE | `features/bloc2-financials/components/tab-income-statement/tab-income-statement.component.ts` | **Fuite mémoire** — `this.pnlForm.valueChanges.subscribe(...)` dans `ngOnInit` sans cleanup. Pas de `OnDestroy`. | Idem : `takeUntilDestroyed()` ou `Subject` + `takeUntil` dans `ngOnDestroy`. |
| 🔴 CRITIQUE | `features/bloc2-financials/components/tab-balance-sheet-assets/tab-balance-sheet-assets.component.ts` | **Fuite mémoire** — Même pattern : `valueChanges.subscribe()` sans destruction. | Idem : ajouter `takeUntilDestroyed()` sur l'abonnement. |
| 🟠 MAJEUR | `features/bloc1b-gate/components/documents-column/documents-column.component.ts` | **Mutation d'Input via setter** — `@Input() set documents(data) { this.dataSource.data = data; }` mute directement un objet interne depuis le setter d'un `@Input`. Viole le principe d'immutabilité des Inputs en `OnPush`. | Remplacer par un `@Output()` event ou utiliser un `computed()` Signal pour dériver `dataSource.data`. |

---

## AXE 2 — Prototypage UI (Mocks & Flux)

| Sévérité | Fichier / Composant | Finding (Anomalie) | Action Requise |
| :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `core/interceptors/jwt.interceptor.ts` | **Anti-pattern "Control Flow via Exceptions"** — Le `catchError` sur le 401 déclenche `this.router.navigate(['/auth/login'])`. La navigation de contrôle est déclenchée depuis une clause d'erreur HTTP. | Supprimer la navigation de l'intercepteur. Implémenter un `AuthGuard` (CanActivate) qui vérifie le token et redirige si invalide. L'intercepteur ne doit que `throwError`. |
| 🔴 CRITIQUE | `features/bloc9-expert/expert.component.ts` | **Faux succès via `catchError`** — `submitExpertReview()` intercepte l'erreur HTTP et retourne `of({ id: 'mock-review-id' })`, déclenchant le handler `next()` qui affiche "mock-submitted successfully". L'utilisateur croit que la soumission a réussi alors que le backend a échoué. | Bypasser totalement l'appel HTTP via `of(mockResponse).pipe(delay(1500))` AVANT le `subscribe`. Ne jamais faire transiter un mock par `catchError`. |
| 🔴 CRITIQUE | `features/bloc1b-gate/gate.component.ts` | **Fallback silencieux mock via `catchError`** — `getCaseDetail()` et `getGateDocuments()` retournent des données mock complètes dans le `catchError` sans notification utilisateur. En production, une erreur réseau afficherait silencieusement des données fictives. | Séparer clairement : si `environment.useMocks === true`, utiliser `of(MOCK).pipe(delay(800))`. Sinon, propager l'erreur avec `throwError()` et un snackbar d'erreur. |
| 🔴 CRITIQUE | `features/bloc12-consortium/consortium.component.ts` | **Fallback mock dans `catchError`** — `getConsortium()` retourne `of(MOCK_CONSORTIUM)` dans le catch. Même anti-pattern que ci-dessus. | Même fix : conditionner le mock via `environment.useMocks`, ne jamais le placer dans un `catchError`. |
| 🟠 MAJEUR | `features/bloc4-ratios/bloc4-ratios.component.ts` | **`setTimeout()` au lieu de RxJS** — `loadMockData()` utilise `setTimeout(() => {...}, 1200)` pour simuler la latence. Casse le flux réactif, non testable avec `fakeAsync`. | Remplacer par `of(MOCK_DATA).pipe(delay(1200)).subscribe(...)`. |
| 🟠 MAJEUR | `features/bloc7-tension/tension.component.ts` | **`setTimeout()` au lieu de RxJS** — Même pattern : `setTimeout(() => {...}, 800)` dans `loadMockTension()`. | Remplacer par `of(MOCK_DATA).pipe(delay(800)).subscribe(...)`. |
| 🟠 MAJEUR | `core/services/case.service.ts` | **Absence totale de gestion d'erreur** — Aucun `catchError`, aucun `console.error`, aucun `throwError` sur les appels HTTP. Les erreurs propagent silencieusement vers les composants. | Ajouter un `pipe(catchError(err => { console.error(...); return throwError(() => new Error(...)); }))` sur chaque méthode HTTP, comme dans `stress.service.ts`. |

---

## AXE 3 — Design System & "Silent Hardcoding"

| Sévérité | Fichier / Composant | Finding (Anomalie) | Action Requise |
| :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `shared/components/molecules/finaces-pillar-row/finaces-pillar-row.component.scss:115` | **Couleur HEX hardcodée** — `background-color: #F97316;` dans `.bg-orange`. | Remplacer par `background-color: var(--mcc-high);` ou créer un token `var(--color-warning-strong)`. |
| 🔴 CRITIQUE | `shared/components/molecules/finaces-pillar-row/finaces-pillar-row.component.scss:199` | **RGBA hardcodé** — `background-color: rgba(59, 130, 246, 0.05);` dans `.signal-item`. | Remplacer par `background-color: color-mix(in srgb, var(--color-info) 5%, transparent);`. |
| 🔴 CRITIQUE | `shared/components/molecules/finaces-pillar-row/finaces-pillar-row.component.scss:60` | **Fail-Fast CSS violé** — `color: var(--color-primary, #6366F1);` contient une couleur de backup statique. | Retirer le fallback : `color: var(--color-primary);` ou utiliser `transparent` si un fallback est nécessaire. |
| 🔴 CRITIQUE | `features/bloc4-ratios/bloc4-ratios.component.scss:8` | **`color: white` hardcodé** — `.finaces-primary-btn { color: white; }`. Casse le contraste en dark mode. | Remplacer par `color: var(--color-content-inverse);`. |
| 🔴 CRITIQUE | `features/bloc8-stress/stress.component.scss:8` | **`color: white` hardcodé** — Même `.finaces-primary-btn`. | Idem : `color: var(--color-content-inverse);`. |
| 🔴 CRITIQUE | `features/bloc6-ia/ia.component.scss:8` | **`color: white` hardcodé** — Même `.finaces-primary-btn`. | Idem : `color: var(--color-content-inverse);`. |
| 🔴 CRITIQUE | `features/bloc3-normalization/normalization.component.scss:8` | **`color: white` hardcodé** — Même `.finaces-primary-btn`. | Idem : `color: var(--color-content-inverse);`. |
| 🔴 CRITIQUE | `features/bloc5-scoring-mcc/components/override-zone/override-zone.component.scss:15` | **`color: #fff` hardcodé** — `.finaces-warn-btn { color: #fff; }`. | Remplacer par `color: var(--color-content-inverse);`. |
| 🔴 CRITIQUE | `features/cases/case-create/case-create.component.scss:76` | **`color: #ffffff` hardcodé** — Stepper selected icon : `color: #ffffff;`. | Remplacer par `color: var(--color-content-inverse);`. |
| 🟠 MAJEUR | `features/cases/cases-list/cases-list.component.html:19-22` | **`text-white` Tailwind hardcodé** — Boutons filtre actifs utilisent `text-white` au lieu de `text-inverse`. | Remplacer `text-white` par `text-inverse` dans les bindings `[class]`. |
| 🟠 MAJEUR | `features/bloc7-tension/components/tension-comparison/tension-comparison.component.html:6` | **`text-white` Tailwind hardcodé** — Bannière "Official Decision Source". | Remplacer `text-white` par `text-inverse`. |
| 🟠 MAJEUR | `features/bloc7-tension/components/tension-banner/tension-banner.component.html:16` | **`bg-white` Tailwind hardcodé** — Badge overlay semi-transparent. Invisible en dark mode. | Remplacer `bg-white bg-opacity-50` par `bg-surface-card bg-opacity-75`. |
| 🟠 MAJEUR | `features/admin-ia/components/model-config-dialog/model-config-dialog.component.html:3` | **`bg-gray-900 text-green-400` hardcodé** — Bloc code terminal non thématisé. | Remplacer par `bg-surface-default border border-border-default text-content-secondary`. |
| 🟠 MAJEUR | `features/bloc10-rapport/rapport.component.html:105` | **`text-white` sur score badge** — Rond score avec `text-white` hardcodé. | Remplacer par `text-inverse`. |
| 🟠 MAJEUR | `features/bloc10-rapport/rapport.component.html:1,23-26` | **Print colors hardcodés** — `print:bg-white`, `print:text-black`, `print:bg-gray-100`, `print:text-gray-600`. | Remplacer par tokens sémantiques : `print:bg-surface-card`, `print:text-content-primary`. |
| 🟠 MAJEUR | 6 fichiers `.ts` (bloc4-ratios, bloc2-financials, bloc3-normalization, bloc5-scoring, bloc7-tension) | **`panelClass: ['text-white']` dans SnackBar** — Hardcode blanc dans les notifications MatSnackBar. | Remplacer `'text-white'` par `'text-inverse'` dans tous les appels `this.snackBar.open()`. |

---

## AXE 4 — Layouts Structuraux (SaaS Design)

| Sévérité | Fichier / Composant | Finding (Anomalie) | Action Requise |
| :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `features/bloc0-dashboard/dashboard.component.scss:2-4` | **Espace mort** — `.dashboard-container { max-width: 1600px; margin: 0 auto; }` bride le dashboard. | Supprimer `max-width` et `margin: 0 auto`. Utiliser `width: 100%;`. |
| 🔴 CRITIQUE | `features/cases/case-create/case-create.component.scss:2-4` | **Espace mort** — `.case-create-container { max-width: 1600px; margin: 0 auto; }`. | Idem : supprimer les contraintes, utiliser `width: 100%;`. |
| 🔴 CRITIQUE | `features/bloc10-rapport/rapport.component.html:21` | **Espace mort** — `class="max-w-5xl mx-auto"` sur le conteneur principal du rapport. | Remplacer par `class="w-full"`. |
| 🟠 MAJEUR | `features/bloc2-financials/components/tab-cash-flow/tab-cash-flow.component.html:1` | **Formulaire bridé** — `class="... max-w-3xl"` sur le `<form>`. | Remplacer `max-w-3xl` par `w-full`. |
| 🟠 MAJEUR | `features/bloc2-financials/components/tab-income-statement/tab-income-statement.component.html:1` | **Formulaire bridé** — `class="... max-w-3xl"` sur le `<form>`. | Idem : `w-full`. |
| 🟠 MAJEUR | `features/bloc2-financials/components/tab-others/tab-others.component.html:1` | **Formulaire bridé** — `class="... max-w-3xl"` sur le `<form>`. | Idem : `w-full`. |
| 🟡 MINEUR | `features/cases/case-create/steps/step4-confirmation/step4-confirmation.component.scss:25` | **max-width sur paragraphe** — `p { max-width: 500px; }` contraint le texte de confirmation. | Supprimer `max-width: 500px;`. Laisser le parent gérer la largeur. |
| 🟡 MINEUR | `features/bloc10-rapport/rapport.component.html:145,157` | **`max-w-2xl` et `max-w-sm` sur contenu texte** — Contraintes de largeur sur des éléments de contenu. | Supprimer ces classes, laisser le contenu fluer naturellement. |

---

## AXE 5 — Tests Vitest Infaillibles

| Sévérité | Fichier / Composant | Finding (Anomalie) | Action Requise |
| :--- | :--- | :--- | :--- |
| 🔴 CRITIQUE | `shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component.spec.ts:71-81` | **Affectation directe sur composant OnPush** — `component.displayScore = 2.5; component.maxScore = 5;` au lieu de `setInput()`. Le binding OnPush ne détectera pas le changement, le test passe par chance. | Remplacer par `fixture.componentRef.setInput('displayScore', 2.5); fixture.componentRef.setInput('maxScore', 5); fixture.detectChanges();`. |
| 🔴 CRITIQUE | `features/bloc1b-gate/components/documents-column/documents-column.component.spec.ts:33` | **Affectation directe sur composant OnPush** — `component.documents = mockDocs;`. | Remplacer par `fixture.componentRef.setInput('documents', mockDocs); fixture.detectChanges();`. |
| 🔴 CRITIQUE | `features/bloc1b-gate/components/checklist-column/checklist-column.component.spec.ts:44-46` | **Affectation directe sur composant OnPush** — `component.documents = mockDocs; component.fiscalYears = [2023, 2022, 2021];` puis appel manuel de `ngOnChanges`. | Remplacer par `fixture.componentRef.setInput('documents', mockDocs); fixture.componentRef.setInput('fiscalYears', [2023, 2022, 2021]); fixture.detectChanges();`. Supprimer l'appel manuel à `ngOnChanges`. |
| 🟠 MAJEUR | `shared/components/organisms/finaces-stress-chart/finaces-stress-chart.component.spec.ts:15-23` | **Mock Canvas manquant pour Chart.js** — `ResizeObserver` et `requestAnimationFrame` sont mockés, mais `HTMLCanvasElement.getContext` ne l'est pas. Chart.js échouera silencieusement en JSDOM. | Ajouter dans le `beforeAll()` : `HTMLCanvasElement.prototype.getContext = vi.fn() as any;`. |

---

## 🛠️ PLAN DE FRAPPE (ACTION PLAN)

### Phase 1 — Fuites Mémoire & Sécurité (CRITIQUE)
1. **Patcher les 3 fuites mémoire** : `analyst-decision`, `tab-income-statement`, `tab-balance-sheet-assets` — Ajouter `takeUntilDestroyed()` sur chaque `valueChanges.subscribe()`.
2. **Ajouter `OnPush`** aux 3 composants manquants : `AppLayoutComponent`, `ReportingComponent`, `ConsortiumComponent`.

### Phase 2 — Purge des Anti-patterns Mock (CRITIQUE)
3. **Supprimer la navigation du JWT interceptor** → Créer un `AuthGuard` dédié.
4. **Refactorer les 3 faux-succès `catchError`** (expert, gate, consortium) → Conditionner via `environment.useMocks` et utiliser `of(MOCK).pipe(delay())`.
5. **Remplacer les 2 `setTimeout`** (ratios, tension) par `of().pipe(delay())`.
6. **Ajouter le error handling** dans `case.service.ts`.

### Phase 3 — Purge du Hardcoding Couleurs (CRITIQUE)
7. **Éradiquer les 3 couleurs HEX/RGBA** dans `finaces-pillar-row.component.scss`.
8. **Remplacer les 7 `color: white/#fff/#ffffff`** dans les SCSS par `var(--color-content-inverse)`.
9. **Remplacer les 6 `panelClass: ['text-white']`** SnackBar par `'text-inverse'`.
10. **Remplacer les ~8 `text-white`/`bg-white`** Tailwind dans les templates HTML par `text-inverse`/`bg-surface-card`.
11. **Thématiser les print colors** dans `rapport.component.html`.
12. **Thématiser le bloc terminal** dans `model-config-dialog.component.html`.

### Phase 4 — Layouts Full-Width (MAJEUR)
13. **Supprimer `max-width: 1600px`** dans `dashboard.component.scss` et `case-create.component.scss`.
14. **Supprimer `max-w-5xl mx-auto`** dans `rapport.component.html`.
15. **Supprimer `max-w-3xl`** dans les 3 formulaires financiers (cash-flow, income-statement, others).

### Phase 5 — Tests Vitest (CRITIQUE)
16. **Corriger les 3 affectations directes** dans les spec files (score-gauge, documents-column, checklist-column) → `fixture.componentRef.setInput()`.
17. **Ajouter le mock Canvas** dans `finaces-stress-chart.component.spec.ts`.

### Phase 6 — Vérification Finale
18. **Lancer `ng build --configuration=production`** pour vérifier la compilation.
19. **Lancer `npx vitest run`** pour valider les tests corrigés.
20. **Vérifier visuellement le dark mode** sur les composants impactés.

---

## MÉTRIQUES DE L'AUDIT

| Métrique | Valeur |
| :--- | :--- |
| Anomalies 🔴 CRITIQUES | **22** |
| Anomalies 🟠 MAJEURES | **14** |
| Anomalies 🟡 MINEURES | **3** |
| **TOTAL** | **39** |
| Fichiers impactés | **~35** |
| Phases du Plan de Frappe | **6** |
| Étapes d'action | **20** |

---

*En attente de votre "GO" pour démarrer la Phase 1.*
