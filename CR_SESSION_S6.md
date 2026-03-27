# COMPTE-RENDU — SESSION S6 : Routing & Configuration

**Auditeur** : Claude Opus 4.6
**Date** : 2026-03-27
**Périmètre** : 5 findings (F-S6-01 → F-S6-05) — `app.routes.ts`, `app.config.ts`, guards manquants

---

## Bilan synthétique

| Métrique | Valeur |
|:--|:--|
| Findings vérifiés | 5 / 5 |
| ✅ Confirmés | 4 |
| ⚠️ Confirmés avec nuances | 1 |
| ❌ Faux positifs | 0 |

---

### F-S6-01 — `app.routes.ts` : Route `**` redirige silencieusement vers dashboard

**Verdict : ✅ CONFIRMÉ**

Ligne 65 :
```typescript
{ path: '**', redirectTo: 'dashboard' }
```

Toute URL invalide redirige vers le dashboard sans feedback utilisateur. Aucun `NotFoundComponent` n'existe dans le projet.

---

### F-S6-02 — `app.routes.ts` : `title` manquant sur toutes les routes enfants

**Verdict : ✅ CONFIRMÉ**

Seules **2 routes** sur **16** ont un `title` :
- Ligne 20 : `dashboard` → `'FinaCES — Tableau de Bord'`
- Ligne 30 : `cases/new` → `'FinaCES — Nouveau Dossier'`

Routes **sans titre** (14) :
- `cases` (ligne 24)
- `admin-ia` (ligne 34)
- `reporting` (ligne 38)
- Les 12 routes enfants du workspace `cases/:id` (lignes 46-58) : `recevabilite`, `gate`, `financials`, `normalization`, `ratios`, `scoring-mcc`, `ia`, `tension`, `stress`, `expert`, `rapport`, `consortium`

Aucun onglet navigateur n'affichera de titre significatif sur ces pages.

---

### F-S6-03 — `app.routes.ts` : Route `/consortium` accessible sans guard

**Verdict : ✅ CONFIRMÉ**

**Aucun `canActivate`** sur aucune route du fichier (grep retourne 0 résultats). La route `consortium` (ligne 58) est accessible quel que soit le `case_type` du dossier — un dossier `SINGLE` peut naviguer vers la page consortium sans blocage.

Plus largement, **aucune route n'a de guard d'authentification** (`authGuard` absent de toutes les routes privées), ce qui renforce l'urgence de S0.

---

### F-S6-04 — `app.routes.ts` : Dossier fantôme `features/consortium/`

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

Le stub **`features/consortium/`** existe bien (3 fichiers) :
- `consortium.component.ts` : composant vide (12 lignes, `class ConsortiumComponent {}`)
- `consortium.component.html` : template minimal
- `consortium.component.scss` : vide

**Le routing est correct** : `app.routes.ts` (ligne 58) pointe vers `features/bloc12-consortium/consortium.component` (le vrai composant), PAS vers le stub. Les fichiers sont donc morts.

**Nuance sur `features/reporting/`** : L'audit mentionne de vérifier `reporting/` aussi. Ce dossier existe (3 fichiers, composant vide identique). **Mais contrairement à `consortium/`**, `reporting` EST référencé dans les routes (ligne 37-38). C'est donc un **stub actif** — une page vide accessible en production — pas un dossier mort.

**Actions** :
- Supprimer `features/consortium/` (dossier mort, 3 fichiers)
- Décider du sort de `features/reporting/` : soit l'implémenter, soit le retirer des routes

---

### F-S6-05 — `app.config.ts` : Vérification finale après S0

**Verdict : ✅ CONFIRMÉ (état pré-S0)**

L'état actuel de `app.config.ts` montre que S0 n'a **pas encore été exécuté** (attendu puisqu'on est en phase d'audit) :

| Élément | État actuel | État attendu après S0 |
|:--|:--|:--|
| `provideHttpClient` | `withInterceptorsFromDi()` (ligne 12) | `withInterceptors([jwtInterceptor])` |
| `provideAnimations()` | **Absent** | Présent |
| `withComponentInputBinding()` | **Absent** | `provideRouter(routes, withComponentInputBinding())` |
| `MAT_FORM_FIELD_DEFAULT_OPTIONS` | `{ appearance: 'outline' }` (ligne 14) | Conservé ✅ |
| `provideBrowserGlobalErrorListeners()` | Présent (ligne 10) | Non mentionné dans l'audit — à conserver |

**Note additionnelle** : `provideBrowserGlobalErrorListeners()` n'est pas mentionné dans le plan d'audit. C'est une API Angular 19+ pour capturer les erreurs globales — à conserver.

---

## Résumé des actions S6

| Finding | Sévérité | Verdict | Action |
|:--|:--|:--|:--|
| F-S6-01 | 🔴 CRITIQUE | ✅ Confirmé | Créer `NotFoundComponent`, route `**` vers 404 |
| F-S6-02 | 🟡 MINEUR | ✅ Confirmé | Ajouter `title` sur 14 routes |
| F-S6-03 | 🟠 MAJEUR | ✅ Confirmé | Créer `consortiumGuard` + ajouter `authGuard` sur routes privées |
| F-S6-04 | 🟠 MAJEUR | ⚠️ Confirmé (+ reporting est un stub actif) | Supprimer `features/consortium/`, décider de `features/reporting/` |
| F-S6-05 | 🔴 CRITIQUE | ✅ Confirmé (pré-S0) | Appliquer corrections S0 sur `app.config.ts` |

**Bilan : 4/5 confirmés exactement, 1 avec nuance (reporting stub actif non couvert). 0 faux positif.**
