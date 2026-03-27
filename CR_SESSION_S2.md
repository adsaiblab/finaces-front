# COMPTE-RENDU — SESSION S2 (Architecture Angular Systémique)

**Auditeur :** Architecte Frontend Senior
**Méthode :** Confrontation document d'audit vs. code réel (lecture directe des fichiers)
**Verdict global S2 :** ✅ **VALIDÉ — 10 findings sur 11 confirmés. 1 finding partiellement inexact (F-S2-05).**

---

## Résultat de la vérification code réel

| Finding | Anomalie documentée | Vérifié dans le code | Verdict |
| :--- | :--- | :--- | :--- |
| **F-S2-01** | `CommonModule` importé dans 12+ composants standalone | ✅ Confirmé — Trouvé dans `app-layout`, `consortium`, `dashboard`, `bloc4-ratios`, `ia`, `stress`, et d'autres. | ✅ OK |
| **F-S2-02** | `finaces-score-gauge` : `@Input()` décoratif legacy | ✅ Confirmé — Lignes 34-40 : `@Input()` décoratifs. Ligne 56 : `constructor(private cdr, private ngZone)`. Ligne 33 : `implements OnChanges`. Pattern pré-Angular 17 complet. | ✅ OK |
| **F-S2-03** | `implements OnInit` legacy dans 10+ composants | ✅ Confirmé — Trouvé dans `bloc4-ratios` (ligne 37), `ia` (ligne 39), `stress` (ligne 31), et d'autres. | ⚠️ Précision ci-dessous |
| **F-S2-04** | `constructor()` injection legacy dans 5 fichiers | ✅ Confirmé — `finaces-score-gauge` : `constructor(private cdr, private ngZone)` (ligne 56). Les services (`case.service.ts`, `document.service.ts`) utilisent aussi ce pattern. | ✅ OK |
| **F-S2-05** | `bloc1b-gate` : `window.scrollTo()` accès direct | ⚠️ **NON TROUVÉ** — Aucun appel `window.scrollTo()` dans `gate.component.ts`. | 🟡 Faux positif |
| **F-S2-06** | `bloc1b-gate` & `bloc12-consortium` : `confirm()` natif | ✅ Confirmé — `confirm('Are you sure you want to remove this member?')` trouvé dans `gate.component.ts` (ligne 201) ET `consortium.component.ts` (ligne 201). | ✅ OK |
| **F-S2-07** | `bloc3-normalization` : `document.getElementById()` direct | ✅ Confirmé — Ligne 139 : `const el = document.getElementById('adjustments-section');` | ✅ OK |
| **F-S2-08** | `bloc2-financials` : `::ng-deep` déprécié | ✅ Confirmé — Ligne 59 : `::ng-deep .finaces-horizontal-tabs {` dans `financials.component.scss`. | ✅ OK |
| **F-S2-09** | `app-layout` : `themeService` exposé public | ✅ Confirmé — `themeService = inject(ThemeService)` public, utilisé directement dans le template. | ✅ OK |
| **F-S2-10** | `app-layout` : `*ngIf` legacy | ✅ Confirmé — 6 occurrences de `*ngIf` dans le template (lignes 9, 29, 40, 50, 60, 66). | ✅ OK |
| **F-S2-11** | `bloc12-consortium` : `public router` exposé | ✅ Confirmé — Ligne 44 : `public router = inject(Router);` | ✅ OK |

---

## Précisions et corrections

### F-S2-03 — `implements OnInit` : précision sur le dashboard

Le document liste `bloc0-dashboard` parmi les composants ayant `implements OnInit`. **Or, `dashboard.component.ts` n'a PAS `implements OnInit`** — c'est le seul composant de la liste vérifié qui ne l'a pas. Les autres (`bloc4-ratios`, `ia`, `stress`) le confirment. **Impact mineur** : lors de l'exécution, ne pas tenter de supprimer `implements OnInit` de `dashboard.component.ts` (il n'y est pas). Le reste de la liste est correct.

### F-S2-05 — `window.scrollTo()` : faux positif

Le document affirme que `bloc1b-gate` contient un `window.scrollTo()` dans `onCorrectDocuments()`. **Aucun appel `window.scrollTo()` n'a été trouvé** dans `gate.component.ts` lors de la vérification. Ce finding est un faux positif — il est possible que le code ait évolué entre l'audit original et la version actuelle, ou qu'il s'agisse d'une confusion avec un autre composant.

**Action :** Supprimer F-S2-05 de la liste d'exécution. La correction proposée (migration vers `inject(DOCUMENT)`) reste une bonne pratique à appliquer si un accès `window.*` est introduit ultérieurement.

---

## Conclusion S2

**10 findings sur 11 sont confirmés.** Le finding F-S2-05 (`window.scrollTo()`) est un faux positif à retirer. La précision sur F-S2-03 (dashboard n'a pas `implements OnInit`) est mineure et ne change pas l'exécution — il suffit de ne pas toucher ce fichier pour cette correction spécifique. Le reste du document S2 est utilisable tel quel.
