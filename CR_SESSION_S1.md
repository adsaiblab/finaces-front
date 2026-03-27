# COMPTE-RENDU — SESSION S1 (Design System & Tokens CSS)

**Auditeur :** Architecte Frontend Senior
**Méthode :** Confrontation document d'audit vs. code réel (lecture directe des fichiers `_variables.scss`, `_typography.scss`, `_spacing.scss`, `styles.scss`, `theme.service.ts`, score-gauge SCSS, risk-badge SCSS)
**Verdict global S1 :** ✅ **VALIDÉ — Les 19 findings sont confirmés. 2 précisions ajoutées.**

---

## Résultat de la vérification code réel

| Finding | Anomalie documentée | Vérifié dans le code | Verdict |
| :--- | :--- | :--- | :--- |
| **F-S1-01** | Alias `--color-mcc-*` et `--color-ia-*` manquants | ✅ Confirmé — Seuls les tokens courts `--mcc-low`, `--ia-low`, etc. existent (lignes 37-49, 113-125). Aucun alias `--color-mcc-*` ni `--color-ia-*` dans le bloc alias. | ✅ OK |
| **F-S1-02** | `--color-content-inverse` absent des alias | ⚠️ **PARTIELLEMENT INEXACT** — Le token `--color-content-inverse: var(--text-inverse)` **EXISTE** dans `_variables.scss` (lignes 64 et 138, light et dark). | 🟡 Correction mineure |
| **F-S1-03** | `--color-mcc-surface` et `--color-mcc-border` absents | ✅ Confirmé — Tokens courts `--mcc-surface` et `--mcc-border` existent mais pas d'alias `--color-mcc-surface` / `--color-mcc-border`. | ✅ OK |
| **F-S1-04** | `--shadow-sm` et `--shadow-md` absents | ✅ Confirmé — Aucun token shadow CSS custom property dans `_variables.scss` ni `_spacing.scss`. Seules les classes Tailwind `shadow-sm` / `shadow-md` existent. | ✅ OK |
| **F-S1-05** | `--font-sans` et `--font-mono` absents | ✅ Confirmé — Ces CSS custom properties n'existent pas dans `_variables.scss`. Elles sont uniquement dans `tailwind.config.js` comme mappings de font-family, pas comme `--font-sans` CSS var. | ✅ OK |
| **F-S1-06** | `_typography.scss` utilise tokens courts au lieu de `--color-content-*` | ✅ Confirmé — Lignes 11, 20, 29, 37, 47, 54 utilisent `var(--text-primary)` et `var(--text-secondary)` au lieu de `var(--color-content-primary)` / `var(--color-content-secondary)`. | ✅ OK |
| **F-S1-07** | `font-size` en px fixes sans tokens | ✅ Confirmé — Valeurs hardcodées `28px`, `22px`, `18px`, etc. | ✅ OK |
| **F-S1-08** | `--max-width-content` jamais utilisé | ✅ Confirmé — Token défini mais inutilisé. | ✅ OK |
| **F-S1-09** | `--color-surface-hover` absent | ✅ Confirmé — Utilisé dans `styles.scss` ligne 224 mais **jamais défini** dans `_variables.scss`. | ✅ OK |
| **F-S1-10** | 4 sélecteurs dark mode contradictoires dans `styles.scss` | ✅ Confirmé — 4 sélecteurs simultanés : `html.dark body`, `html[data-theme="dark"] body`, `body.dark`, `body[data-theme="dark"]` (lignes 192-195). | ✅ OK |
| **F-S1-11** | `mat.all-component-themes()` génère du CSS pour 100% de Material | ✅ Confirmé — `@include mat.all-component-themes($finaces-dummy-theme)` en ligne 24. | ✅ OK |
| **F-S1-12** | Fallback `sans-serif` masque token manquant | ✅ Confirmé — `font-family: var(--font-sans, sans-serif)` en ligne 56. Comme `--font-sans` n'est pas défini en CSS, c'est `sans-serif` qui s'applique silencieusement (pas la font Inter configurée dans Tailwind). | ✅ OK |
| **F-S1-13** | Classes snackbar Tailwind non applicables à l'overlay | ✅ Confirmé — Pattern `panelClass: ['bg-success', 'text-inverse']` utilisé partout. Les overlays Material sont hors encapsulation → classes Tailwind jamais appliquées. | ✅ OK |
| **F-S1-14** | `effect()` dans le constructeur → NG0203 | ✅ Confirmé — `effect()` déclaré dans le `constructor()` du `ThemeService` (lignes 14-31). | ✅ OK |
| **F-S1-15** | 3 stratégies dark mode simultanées dans `theme.service.ts` | ✅ Confirmé — `classList.add('dark')` sur `documentElement` ET `body` ET `setAttribute('data-theme', 'dark')` simultanément (lignes 19-28). | ✅ OK |
| **F-S1-16** | `isDarkMode` signal non encapsulé | ✅ Confirmé — `isDarkMode = signal<boolean>(false)` public sans `readonly` ni `asReadonly()` (ligne 8). | ✅ OK |
| **F-S1-17** | Zéro test sur `toggleTheme()` et `initTheme()` | ✅ Confirmé — Le spec ne teste que `'should be created'`. | ✅ OK |
| **F-S1-18** | `finaces-score-gauge.component.scss` : 7 tokens non conformes | ✅ Confirmé — Utilise `var(--success)`, `var(--warning)`, `var(--error)`, `var(--primary)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border)` au lieu de `var(--color-*)`. | ✅ OK |
| **F-S1-19** | `finaces-risk-badge.component.scss` : 8 tokens non conformes | ✅ Confirmé — Utilise `var(--mcc-low)`, `var(--mcc-moderate)`, etc. au lieu de `var(--color-mcc-*)`. | ✅ OK |

---

## Précisions et corrections

### F-S1-02 — `--color-content-inverse` : le document dit "absent", le code dit "présent"

Le document d'audit affirme que `--color-content-inverse` est absent. **Or, il est bien défini** dans `_variables.scss` aux lignes 64 (light) et 138 (dark) : `--color-content-inverse: var(--text-inverse);`.

**Impact :** Ce finding est un **faux positif**. La correction proposée (ajouter le token) est inutile — il est déjà là. **Supprimer F-S1-02 de la liste d'exécution** pour éviter un doublon de déclaration CSS qui ne casserait rien mais polluerait le fichier.

### Précision F-S1-12 — Le problème est plus profond que décrit

Le document propose de simplement retirer le fallback `sans-serif`. C'est correct pour le Fail-Fast, mais il faut noter que **même après F-S1-05** (ajout de `--font-sans` en CSS var), il y aura un risque de conflit avec la configuration Tailwind qui définit ses propres `fontFamily.sans` dans `tailwind.config.js`. Les deux mécanismes (CSS var `--font-sans` et Tailwind `font-sans`) doivent être synchronisés. Le correctif proposé en F-S1-05 le fait correctement (`--font-sans: 'Inter', system-ui, ...`) — c'est cohérent avec le Tailwind config. Juste à vérifier lors de l'exécution que les valeurs sont identiques.

---

## Conclusion S1

**18 findings sur 19 sont confirmés à 100%.** Le finding F-S1-02 est un faux positif (le token existe déjà). À supprimer de la liste d'exécution. Le reste du document est utilisable tel quel.
