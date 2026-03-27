# COMPTE-RENDU — SESSION S7 : Tests & CI

**Auditeur** : Claude Opus 4.6
**Date** : 2026-03-27
**Périmètre** : 9 findings (F-S7-01 → F-S7-09) — `test-setup.ts`, specs score-gauge, risk-badge, convergence-chart, dashboard, theme.service, gate

---

## Bilan synthétique

| Métrique | Valeur |
|:--|:--|
| Findings vérifiés | 9 / 9 |
| ✅ Confirmés | 6 |
| ⚠️ Confirmés avec nuances | 2 |
| ❌ Faux positifs | 1 |

---

### F-S7-01 — `test-setup.ts` : Mocks globaux manquants

**Verdict : ✅ CONFIRMÉ**

Le fichier `src/test-setup.ts` fait 14 lignes et ne contient QUE l'initialisation du `TestBed` Angular :

```typescript
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
```

**Aucun mock global** : pas de `requestAnimationFrame`, `cancelAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, `canvas.getContext`, `URL.createObjectURL`, ni `localStorage`/`sessionStorage`. Chaque spec doit recréer ses propres mocks localement, ce qui est fragile et dupliqué.

---

### F-S7-02 — `finaces-score-gauge.component.spec.ts` : `requestAnimationFrame` non mocké globalement

**Verdict : ✅ CONFIRMÉ**

Ligne 58 : `vi.useFakeTimers()` utilisé localement dans un seul test :

```typescript
it('should cancel pending rAF on destroy to prevent memory leak', () => {
    vi.useFakeTimers();
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');
    fixture.componentRef.setInput('animated', true);
    fixture.componentRef.setInput('score', 3.5);
    fixture.detectChanges();
    fixture.destroy();
    expect(cancelSpy).toHaveBeenCalled();
});
```

Le test fonctionne mais les fake timers Vitest ne contrôlent pas rAF de façon fiable dans jsdom. Un mock global dans `test-setup.ts` (F-S7-01) serait plus robuste.

---

### F-S7-03 — `finaces-score-gauge.component.spec.ts` : Mutation directe de propriétés

**Verdict : ✅ CONFIRMÉ**

Lignes 70-79 :

```typescript
it('should generate a valid SVG arc path for score 2.5/5', () => {
    component.displayScore = 2.5;   // mutation directe
    component.maxScore = 5;          // mutation directe
    const path = component.getProgressPath();
    expect(path).toBeTruthy();
    expect(path).toContain('M');
    expect(path).toContain('A');
});
```

Bypasse la réactivité Signal. Devrait utiliser `fixture.componentRef.setInput('score', 2.5)` + `TestBed.flushEffects()`.

---

### F-S7-04 — `finaces-score-gauge.component.spec.ts` : `afterEach(vi.useRealTimers)` orphelin

**Verdict : ✅ CONFIRMÉ**

Lignes 20-22 : `afterEach(() => vi.useRealTimers())` est déclaré au niveau `describe`, mais `vi.useFakeTimers()` n'est appelé que dans UN SEUL test (ligne 58). Les autres tests passent par `useRealTimers()` sans avoir activé `useFakeTimers()` — cleanup orphelin.

---

### F-S7-05 — `finaces-risk-badge.component.spec.ts` : Double `detectChanges()` instable

**Verdict : ✅ CONFIRMÉ**

Pattern répété dans **7 cas de test**. Exemples :

- `beforeEach` (lignes 16-17) : `fixture.detectChanges(); fixture.detectChanges();`
- Test `'should display LOW risk label'` (lignes 27-28) : double `detectChanges()`
- Test `'should include badge-sm class'` (lignes 46-47) : double `detectChanges()`

**`TestBed.flushEffects()` n'est JAMAIS utilisé** dans le fichier. Le double `detectChanges()` est un workaround pour stabiliser les Signals `input()` + `OnPush`, qui devrait être remplacé par `flushEffects()` + un seul `detectChanges()`.

---

### F-S7-06 — `convergence-chart.component.spec.ts` : Canvas mock insuffisant

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

L'audit affirme "Canvas non mocké → TypeError en CI". En réalité, le spec **MOCKE** `canvas.getContext` localement (ligne 20) :

```typescript
beforeEach(async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn() as any;
    globalThis.ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
```

**Nuance** : le mock existe MAIS est insuffisant — `vi.fn()` retourne `undefined` par défaut. Chart.js a besoin d'un objet CanvasRenderingContext2D complet (`fillRect`, `beginPath`, `arc`, etc.). Le mock global proposé dans F-S7-01 résoudrait ce problème avec un contexte complet.

L'anomalie est réelle (le mock ne suffit pas pour Chart.js) mais la formulation "Canvas non mocké" est imprécise — il faudrait dire "Canvas mock incomplet".

---

### F-S7-07 — `dashboard.component.spec.ts` : Services HTTP non mockés

**Verdict : ❌ FAUX POSITIF**

Le `CaseService` **EST correctement mocké** avec `vi.fn().mockReturnValue(of())` (lignes 33-38) :

```typescript
mockCaseService = {
    getDashboardStats: vi.fn().mockReturnValue(of({})),
    getRecentCases: vi.fn().mockReturnValue(of([])),
    getConvergenceChart: vi.fn().mockReturnValue(of(mockConvergenceData)),
    getActiveTensionCases: vi.fn().mockReturnValue(of([]))
};
```

Et injecté via `{ provide: CaseService, useValue: mockCaseService }` (lignes 42-46). **Aucun appel HTTP réel** n'est tenté.

**Action** : Retirer du plan d'exécution.

---

### F-S7-08 — `theme.service.spec.ts` : Zéro test comportemental

**Verdict : ✅ CONFIRMÉ**

Le fichier (32 lignes) contient un unique test trivial (lignes 29-31) :

```typescript
it('should be created', () => {
    expect(service).toBeTruthy();
});
```

Aucun test pour :
- `toggleTheme()` → basculement dark/light
- `isDarkMode()` → lecture de l'état
- Persistance localStorage
- Attribut `data-theme` sur `document.documentElement`

Le `beforeAll` (lignes 7-20) configure un mock `window.matchMedia` pour éviter le crash jsdom, mais aucun comportement du service n'est validé.

---

### F-S7-09 — `gate.component.spec.ts` : Mock `ActivatedRoute` sans `parent`

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

Ligne 47 :
```typescript
{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
```

Le mock fournit uniquement `snapshot.paramMap`. **Pas de propriété `parent`**. Si le composant accède à `this.route.parent?.snapshot.paramMap.get('id')` (pattern identifié dans F-S4-03/14), le test ne couvre pas ce chemin.

**Nuance** : le composant `gate.component.ts` résout son `caseId` via `this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id')`. Le fallback `this.route.snapshot.paramMap.get('id')` fonctionne avec le mock actuel (retourne `'1'`). Le test **passe** mais ne valide pas le chemin nominal (via parent).

---

## Résumé des actions S7

| Finding | Sévérité | Verdict | Fichier |
|:--|:--|:--|:--|
| F-S7-01 | 🔴 CRITIQUE | ✅ Confirmé | test-setup.ts |
| F-S7-02 | 🔴 CRITIQUE | ✅ Confirmé | score-gauge.spec.ts |
| F-S7-03 | 🔴 CRITIQUE | ✅ Confirmé | score-gauge.spec.ts |
| F-S7-04 | 🟠 MAJEUR | ✅ Confirmé | score-gauge.spec.ts |
| F-S7-05 | 🟠 MAJEUR | ✅ Confirmé (7 instances) | risk-badge.spec.ts |
| F-S7-06 | 🟠 MAJEUR | ⚠️ Mock existe mais insuffisant | convergence-chart.spec.ts |
| F-S7-07 | 🟠 MAJEUR | ❌ FAUX POSITIF — mock en place | dashboard.spec.ts |
| F-S7-08 | 🟠 MAJEUR | ✅ Confirmé | theme.service.spec.ts |
| F-S7-09 | 🟡 MINEUR | ⚠️ Confirmé (fallback fonctionne) | gate.spec.ts |

**Bilan : 6/9 confirmés exactement, 2 avec nuances, 1 faux positif (F-S7-07). 0 finding manqué.**

---

## BILAN GLOBAL — Sessions S0 à S7

| Session | Findings | ✅ Confirmés | ⚠️ Nuances | ❌ Faux positifs |
|:--|:--|:--|:--|:--|
| **S0** | 10 | 10 | 0 | 0 |
| **S1** | 19 | 18 | 0 | 1 (F-S1-02) |
| **S2** | 11 | 10 | 0 | 1 (F-S2-05) |
| **S3** | 10 | 8 | 2 | 0 |
| **S4** | 43 | 39 | 3 | 1 (F-S4-18) |
| **S5** | 19 | 17 | 2 | 0 |
| **S6** | 5 | 4 | 1 | 0 |
| **S7** | 9 | 6 | 2 | 1 (F-S7-07) |
| **TOTAL** | **126** | **112** | **10** | **4** |

**Taux de confirmation global : 96.8%** (122/126 confirmés ou nuancés, 4 faux positifs à retirer du plan d'exécution).

### Faux positifs identifiés (à retirer du plan)

1. **F-S1-02** : `--color-content-inverse` existe déjà dans `_variables.scss`
2. **F-S2-05** : `window.scrollTo()` inexistant dans `gate.component.ts`
3. **F-S4-18** : `MatTabsModule` utilisé dans `financials.component.html`
4. **F-S7-07** : `CaseService` correctement mocké dans `dashboard.component.spec.ts`
