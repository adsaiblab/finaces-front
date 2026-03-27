# COMPTE-RENDU — SESSION S3 : RxJS & Memory Leaks

**Auditeur** : Claude Opus 4.6
**Date** : 2026-03-27
**Périmètre** : 10 findings (F-S3-01 → F-S3-10) — `.subscribe()` sans protection, `setTimeout()`, `destroy$` legacy, fuites mémoire rAF, réactivité chart

---

## Bilan synthétique

| Métrique | Valeur |
|:--|:--|
| Findings vérifiés | 10 / 10 |
| ✅ Confirmés | 8 |
| ⚠️ Confirmés avec nuances | 2 |
| ❌ Faux positifs | 0 |

---

## F-S3-01 — Pattern global : `takeUntilDestroyed()` sur tous les `.subscribe()`

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCES**

L'anomalie systémique est réelle : **26 appels `.subscribe()` non protégés** identifiés dans 10 composants. L'audit externe annonce ~25, ce qui est cohérent.

**Nuances importantes :**

### F-S3-01a — `dashboard.component.ts` : IMPRÉCISION

L'audit liste 4 `.subscribe()` sans TUD (`stats$`, `recentCases$`, `tensions$`, `chartData$`). Or, **le code réel contient 0 appels `.subscribe()`**. Ces Observables sont consommés via `| async` dans le template — le `AsyncPipe` gère automatiquement le `unsubscribe()` à la destruction du composant.

**Impact** : Aucune fuite mémoire sur dashboard. Toutefois, l'ajout de `catchError()` sur les déclarations reste pertinent (résilience si le backend est down). La correction proposée dans l'audit est donc **partiellement valide** (catchError oui, takeUntilDestroyed redondant avec async pipe).

### F-S3-01l — `consortium.component.ts` : DÉCOMPTE AJUSTÉ

L'audit annonce 7 `.subscribe()`. Le code réel en contient **6** (lignes 122, 153, 165, 172, 203, 223). Correction mineure de décompte, sans impact sur le verdict.

### F-S3-01f — `scoring-mcc.component.ts` : SOUS-ESTIMATION

L'audit annonce 1 `.subscribe()` (`getScoring`). Le code réel en contient **2** : `getScoring` (ligne 62) ET `overrideScore` (ligne 103), tous deux sans protection.

### Décompte vérifié par composant

| Composant | `.subscribe()` sans protection | Audit dit | Verdict |
|:--|:--|:--|:--|
| `bloc0-dashboard` | **0** (async pipe) | 4 | ⚠️ Imprécision |
| `bloc1b-gate` | 0 (5 avec `takeUntil(this.destroy$)`) | 2 | ✅ Protégé (legacy) |
| `bloc3-normalization` | **3** (lignes 63, 103, 121) | 3 | ✅ Confirmé |
| `bloc4-ratios` | **3** (lignes 64, 131, 145) | 3 | ✅ Confirmé |
| `bloc5-scoring-mcc` | **2** (lignes 62, 103) | 1 | ⚠️ Sous-estimation |
| `bloc6-ia` | **2** (lignes 67, 109) | 2 | ✅ Confirmé |
| `bloc7-tension` | **2** (lignes 68, 100) | 2 | ✅ Confirmé |
| `bloc8-stress` | **2** (lignes 55, 124) | 2 | ✅ Confirmé |
| `bloc9-expert` | **2** (lignes 86, 140) | 2 | ✅ Confirmé |
| `bloc10-rapport` | **3** (lignes 82, 96, 103) | 3 | ✅ Confirmé |
| `bloc12-consortium` | **6** (lignes 122, 153, 165, 172, 203, 223) | 7 | ⚠️ Ajusté à 6 |
| `admin-ia` | **1** (ligne 45) | 1 | ✅ Confirmé |
| **TOTAL** | **26** | ~25 | ✅ Cohérent |

**Action** : Appliquer `takeUntilDestroyed(this.destroyRef)` sur les 26 subscribes non protégés. Pour dashboard, ajouter `catchError()` uniquement (async pipe suffit pour le cleanup).

---

## F-S3-02 — `bloc1b-gate` : Migration `destroy$ Subject` → `takeUntilDestroyed()`

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** : `gate.component.ts` déclare `private destroy$ = new Subject<void>()` (ligne 47) et utilise le pattern `takeUntil(this.destroy$)` sur ses 5 subscribes (lignes 103, 134, 149, 201, 217). Le `ngOnDestroy()` appelle `this.destroy$.next(); this.destroy$.complete()`.

Ce pattern legacy fonctionne mais est verbeux. La migration vers `inject(DestroyRef)` + `takeUntilDestroyed()` est le standard Angular 17+.

**Action** : Supprimer `destroy$`, `ngOnDestroy()`, et remplacer tous les `takeUntil(this.destroy$)` par `takeUntilDestroyed(this.destroyRef)`.

---

## F-S3-03 — `setTimeout()` → `of(null).pipe(delay(), takeUntilDestroyed())`

**Verdict : ⚠️ CONFIRMÉ AVEC CORRECTION DE DÉCOMPTE**

L'audit annonce **10 occurrences**. Le code réel en contient **11** dans les fichiers audités :

| Fichier | Méthode | Ligne | Délai | Audit |
|:--|:--|:--|:--|:--|
| `bloc2-financials` | navigation post-save | 89 | 1500ms | ✅ Listé |
| `bloc3-normalization` | `loadMockData()` | 77 | 800ms | ✅ Listé |
| `bloc3-normalization` | `recalculate()` error | 111 | 1000ms | ✅ Listé |
| `bloc3-normalization` | `computeRatios()` error | 129 | 1500ms | ✅ Listé |
| `bloc5-scoring-mcc` | `loadMockData()` | 75 | 1000ms | ✅ Listé |
| `bloc5-scoring-mcc` | `handleOverride()` error | 111 | 800ms | ✅ Listé |
| `bloc6-ia` | `loadMockData()` | 80 | 1200ms | ✅ Listé |
| `bloc6-ia` | `onSimulate()` error | 120 | 1000ms | ✅ Listé |
| `bloc7-tension` | `handleDecision()` | 109 | 1000ms | ✅ Listé |
| `bloc8-stress` | `loadMockData()` | 67 | 800ms | ✅ Listé |
| `bloc8-stress` | `runSimulation()` error | 132 | 1000ms | ✅ Listé |

Le tableau détaillé de l'audit liste bien 11 lignes mais le titre annonce "10 occurrences" — **erreur de comptage dans le titre**, pas dans le contenu. Le détail est exhaustif et correct.

**Note additionnelle** : `case-create.component.ts` (ligne 110) contient aussi un `setTimeout()` non listé dans S3. Ce fichier relèvera probablement de S4.

**Action** : Migrer les 11 `setTimeout()` vers `of(null).pipe(delay(), takeUntilDestroyed())`.

---

## F-S3-04 — `convergence-chart.component.ts` : `afterNextRender()` non réactif

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** (lignes 25-29) :
```typescript
afterNextRender(() => {
    if (this.isBrowser && this.chartData() && this.canvasRef()) {
        this.renderChart(this.chartData()!, this.canvasRef()!.nativeElement);
    }
});
```

Le chart est initialisé **une seule fois** après le premier rendu. Si `chartData()` change (rechargement, filtre), le graphique ne se met jamais à jour. Aucun `effect()` n'est utilisé pour surveiller les changements du signal d'entrée.

**Action** : Remplacer `afterNextRender()` par un `effect()` qui surveille `this.chartData()` et reconstruit le chart.

---

## F-S3-05 — `convergence-chart.component.ts` : Pas de réactivité au changement de thème

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** : Aucune injection de `ThemeService`, aucune référence à `isDarkMode()`. Les couleurs sont lues via `getComputedStyle(document.documentElement).getPropertyValue(name)` dans `renderChart()` (lignes 38-51), mais cette méthode n'est appelée qu'une fois via `afterNextRender()`.

Si l'utilisateur bascule en dark mode, les variables CSS changent mais le chart n'est jamais re-rendu — les couleurs light restent figées.

**Action** : Intégrer `themeService.isDarkMode()` comme dépendance dans l'`effect()` de F-S3-04 pour déclencher un re-render à chaque changement de thème.

---

## F-S3-06 — `finaces-score-gauge.component.ts` : Fuite mémoire sur `animationId`

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** :
- `animationId: number | null = null` (ligne 51)
- `requestAnimationFrame(animate)` lancé dans `ngZone.runOutsideAngular()` (ligne 142)
- `ngOnDestroy()` appelle bien `cancelAnimationFrame(this.animationId)` (lignes 170-172)
- **MAIS** : aucun flag `destroyed` ni guard dans le callback `animate`. Si le composant est détruit entre deux frames, le callback suivant exécute `this.cdr.markForCheck()` sur un composant détruit (lignes 125-145).

**Action** : Ajouter `private destroyed = false;`, setter à `true` dans `ngOnDestroy()`, et guard `if (this.destroyed) return;` en tête du callback `animate`.

---

## F-S3-07 — `finaces-score-gauge.component.ts` : `markForCheck()` hors zone Angular

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** :
- `ngZone.runOutsideAngular()` lance le rAF (ligne 142)
- `this.cdr.markForCheck()` est appelé directement dans le callback (ligne 132)
- `ngZone.run()` n'est **jamais** utilisé pour re-rentrer dans la zone

`markForCheck()` hors zone Angular ne déclenche pas la détection de changement OnPush. Le score peut ne pas se mettre à jour visuellement pendant l'animation.

**Action** : Envelopper `this.cdr.markForCheck()` dans `this.ngZone.run(() => { ... })`.

---

## F-S3-08 — `bloc4-ratios` : Import `timeout` inutilisé

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** (ligne 8) :
```typescript
import { forkJoin, timeout, catchError, of, delay } from 'rxjs';
```

`timeout` est importé mais **jamais utilisé** dans le fichier. Les autres imports (`forkJoin`, `catchError`, `of`, `delay`) sont utilisés.

**Action** : Supprimer `timeout` de la ligne d'import.

---

## F-S3-09 — `bloc9-expert` : `isSubmitting.set(true)` appelé deux fois

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** (lignes 126-128) :
```typescript
this.isSubmitting.set(true);

this.isSubmitting.set(true);  // Appel dupliqué
```

Deux appels consécutifs identiques. Le deuxième est redondant et indique un copier-coller accidentel.

**Action** : Supprimer le deuxième `this.isSubmitting.set(true)`.

---

## F-S3-10 — `bloc12-consortium` : `saveSharesInline()` synchrone

**Verdict : ✅ CONFIRMÉ**

**Vérifié dans le code** (lignes 188-198) :
```typescript
saveSharesInline(editedShares: Record<string, number>): void {
    if (this.totalParticipation() !== 100) {
        this.snackBar.open('Total shares must be 100%', 'Close');
        return;
    }
    this.isLoading.set(true);     // ligne 193
    this.snackBar.open('Inline share updates saved successfully (simulated endpoint)', 'Close');
    this.isEditingShares.set(false);
    this.isLoading.set(false);    // ligne 197 — synchrone, spinner invisible
}
```

`isLoading` passe de `true` à `false` dans le même tick synchrone — le spinner n'est jamais rendu. Aucun appel HTTP entre les deux.

**Action** : Remplacer par un appel HTTP réel avec `finalize(() => this.isLoading.set(false))` dans le pipe.

---

## Résumé des actions S3

| Finding | Sévérité | Verdict | Action requise |
|:--|:--|:--|:--|
| F-S3-01 | 🔴 CRITIQUE | ⚠️ Confirmé (26 réels, dashboard = async pipe) | `takeUntilDestroyed` sur 26 subscribes |
| F-S3-02 | 🔴 CRITIQUE | ✅ Confirmé | Migrer `destroy$` → `DestroyRef` dans gate |
| F-S3-03 | 🔴 CRITIQUE | ⚠️ Confirmé (11 réels, titre dit 10) | Migrer 11 `setTimeout` → `delay()` |
| F-S3-04 | 🔴 CRITIQUE | ✅ Confirmé | `afterNextRender` → `effect()` |
| F-S3-05 | 🔴 CRITIQUE | ✅ Confirmé | Ajouter `isDarkMode()` dans l'effect |
| F-S3-06 | 🔴 CRITIQUE | ✅ Confirmé | Flag `destroyed` + guard dans rAF |
| F-S3-07 | 🔴 CRITIQUE | ✅ Confirmé | `ngZone.run()` autour de `markForCheck()` |
| F-S3-08 | 🔴 CRITIQUE | ✅ Confirmé | Supprimer import `timeout` inutilisé |
| F-S3-09 | 🔴 CRITIQUE | ✅ Confirmé | Supprimer `isSubmitting.set(true)` dupliqué |
| F-S3-10 | 🟠 MAJEUR | ✅ Confirmé | Implémenter appel HTTP réel |

**Bilan : 10/10 confirmés (8 exact, 2 avec nuances mineures de décompte). 0 faux positif.**
