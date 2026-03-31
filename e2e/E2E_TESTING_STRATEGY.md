# Stratégie de Tests E2E — FinaCES

> **Document de référence** pour comprendre l'architecture des tests Playwright,
> les choix techniques, et la feuille de route par session.

---

## Philosophie générale

Les tests E2E FinaCES suivent **deux niveaux complémentaires** qui ne se remplacent
pas — ils se superposent :

| Niveau | Fichiers | Ce que ça teste | Dépendances |
|--------|----------|-----------------|-------------|
| **Isolation (mocks)** | `02-auth.spec.ts` → `10-*.spec.ts` | Le frontend seul — composants, routing, UI, signals | Aucune — 100% Playwright `route.fulfill()` |
| **Intégration réelle** | `00-integration.spec.ts` | Front ↔ API ↔ DB — vraies routes, vraies données | Backend up + DB seedée |

### Pourquoi les mocks en priorité ?

- **Vitesse** : un test mocké s'exécute en < 2s vs 5-15s avec vraie API
- **Fiabilité** : pas de dépendance réseau, pas de race condition, 0 flakiness
- **Isolation** : un bug backend ne fait pas échouer les tests frontend
- **Développement** : on peut tester le front même si le backend n'est pas finalisé

### Pourquoi les tests d'intégration en S5 ?

Les tests d'intégration réels ont de la valeur uniquement quand le backend est
stable et que toutes les routes sont implémentées. Les ajouter trop tôt crée
de la fragilité dans la CI. On les ajoute en S5, une fois l'application finalisée.

---

## Règle LIFO Playwright (piège classique)

Playwright évalue les routes en ordre **LIFO** (Last In, First Out) :
le dernier `page.route()` enregistré a la **priorité maximale**.

**Toujours enregistrer dans cet ordre dans `beforeEach` :**

```typescript
// 1. Wildcard continue() EN PREMIER (priorité la plus basse)
await page.route(`**/api/v1/cases/${ID}/**`, route => route.continue());

// 2. Mocks génériques
await page.route(`**/api/v1/cases/${ID}/ratios**`, route => route.fulfill({...}));

// 3. Mocks spécifiques EN DERNIER (priorité maximale)
await page.route(`**/api/v1/cases/${ID}/normalized-financials**`, route => route.fulfill({...}));
await page.route(`**/api/v1/cases/${ID}`, route => route.fulfill({...})); // exact match
```

---

## Architecture des fichiers

```
e2e/
├── specs/
│   ├── 00-integration.spec.ts    ← S5 : vraie DB, vraies routes (sans mocks)
│   ├── 01-happy-path.spec.ts     ← S4 : navigation complète (mocks)
│   ├── 02-auth.spec.ts           ← S1 : login, logout, guard
│   ├── 03-financials.spec.ts     ← S2/S3 : Bloc 2 Financials
│   ├── 04-normalization.spec.ts  ← S3 : Bloc 3 Normalization
│   ├── 05-ratios.spec.ts         ← S3 : Bloc 4 Ratios
│   ├── 06-scoring.spec.ts        ← S3 : Bloc 5 Scoring MCC
│   ├── 07-ia.spec.ts             ← S3 : Bloc 6 IA Prediction
│   ├── 08-stress.spec.ts         ← S3 : Bloc 7 Stress/Tension
│   ├── 09-gate.spec.ts           ← S3 : Bloc 8 Gate Review
│   ├── 10-expert.spec.ts         ← S4 : Bloc 9 Expert (form submit)
│   ├── 11-rapport.spec.ts        ← S4 : Bloc 10 Rapport (PDF export)
│   ├── 12-consortium.spec.ts     ← S4 : Bloc 12 Consortium
│   └── 13-admin-ia.spec.ts       ← S4 : Admin IA (calibration)
├── pages/                         ← Page Object Models
├── fixtures/                      ← auth.fixture.ts, test-data.ts
├── global-setup.ts               ← Auth JWT inject
├── playwright.config.ts
└── E2E_TESTING_STRATEGY.md       ← ce fichier
```

---

## Feuille de route par session

### Session 1 — Base (terminée ✅)

- Setup Playwright, `global-setup.ts`, `auth.fixture.ts`
- `02-auth.spec.ts` : login, logout, guard redirect
- `03-financials.spec.ts` : happy path Bloc 2
- Pipeline CI de base

### Session 2 — Happy Path S1→S10 (terminée ✅)

- `01-happy-path.spec.ts` : navigation complète Blocs 3→10
- Page Objects : `normalization.page.ts`, `ratios.page.ts`, etc.
- `data-testid` ajoutés sur les composants clés

### Session 3 — Isolation Blocs 3→10 (terminée ✅)

- `04-normalization.spec.ts` → `09-gate.spec.ts`
- Mocks Playwright pour chaque bloc
- Fix LIFO route order
- **29/29 tests verts en local**

### Session 4 — CI/CD + Nouveaux blocs + Approfondissement (en cours 🔄)

**Jour 1 — CI/CD GitHub Actions** *(terminé ✅)*

- Pipeline `e2e.yml` : PostgreSQL + Redis + FastAPI + Angular + Playwright
- Pipeline `ci.yml` : Lint + Vitest + Build
- `CODEOWNERS` : review obligatoire sur `e2e/` et `.github/`
- Fixes successifs : `asyncpg`, Redis service

**Jour 2 — Nouveaux blocs (Option B)**

- `10-expert.spec.ts` : soumission formulaire expert, validation
- `11-rapport.spec.ts` : génération PDF, export Word
- `12-consortium.spec.ts` : formulaire multi-entités
- `13-admin-ia.spec.ts` : dashboard admin, calibration modèle

**Jour 3 — Approfondissement isolation (Option A)**

- Tous les `// TODO S4` dans les 8 specs existants
- Navigation entre blocs (chaînes complètes)
- États loading/skeleton
- Recalculate, override scoring, simulation IA

**Jour 4 — Cas d'erreur (Option D)**

- API 500 → message d'erreur affiché
- Token expiré → redirect `/auth/login`
- Dossier 404 → page not found
- Timeout → spinner puis fallback

### Session 5 — Tests d'intégration réels (après finalisation app) 🔮

> À déployer **uniquement après** que tous les blocs backend sont implémentés
> et stables. Ces tests complètent les mocks — ils ne les remplacent pas.

**Objectif :** Valider que le front, le backend et la base de données fonctionnent
correctement **ensemble**, sur de vraies données, sans aucun mock Playwright.

**Prérequis :**

1. Enrichir `finaces-api/scripts/seed_e2e.py` avec **toutes** les données liées :
   - `FinancialStatement` complet avec actif/passif/income/cashflow
   - `NormalizedFinancials` avec adjustments
   - `Ratios` calculés
   - `Scoring` MCC et IA
   - `StressTest` et tension label
   - `GateReview` avec décision
   - `ExpertOpinion` soumis
   - `Report` généré

2. Créer `e2e/specs/00-integration.spec.ts` :

```typescript
// 00-integration.spec.ts
// ⚠️ PAS de page.route() mocks ici — tests 100% réels
import { test, expect } from '../fixtures/auth.fixture';
import { TEST_CASE } from '../fixtures/test-data';

test.describe('Intégration réelle — Front ↔ API ↔ DB', () => {

  test('GET /health — le backend répond 200', async ({ request }) => {
    const res = await request.get('http://localhost:8000/health');
    expect(res.status()).toBe(200);
  });

  test('Le dossier E2E existe en DB et est accessible', async ({ page }) => {
    await page.goto(`/cases/${TEST_CASE.id}`);
    await expect(page.locator('[data-testid="case-title"]')).toBeVisible();
  });

  test('Les financials du dossier E2E sont chargés depuis la vraie DB', async ({ page }) => {
    await page.goto(`/cases/${TEST_CASE.id}/financials`);
    await expect(page.locator('[data-testid="financial-list"]')).toBeVisible();
  });

  test('La normalisation est accessible et affiche le badge NORMALIZED', async ({ page }) => {
    await page.goto(`/cases/${TEST_CASE.id}/normalization`);
    await expect(page.locator('[data-testid="normalized-badge"]')).toBeVisible();
  });

  test('Le scoring MCC est calculé et affiche un score', async ({ page }) => {
    await page.goto(`/cases/${TEST_CASE.id}/scoring`);
    await expect(page.locator('[data-testid="global-score"]')).toBeVisible();
  });

  // TODO S5 : test soumission Gate Review réelle
  // TODO S5 : test génération PDF (vérifier blob download)
  // TODO S5 : test auth token expiry avec vrai JWT expiré
});
```

1. Séparer la CI en **deux jobs** :
   - `job: e2e-mocked` → toujours vert, bloque le merge (rapide ~5 min)
   - `job: e2e-integration` → informatif, ne bloque pas le merge (lent ~15 min)

```yaml
# Dans e2e.yml — à ajouter en S5
jobs:
  e2e-mocked:
    name: E2E Mocked Tests (bloque merge)
    # ... run: npx playwright test --ignore=**/00-integration*

  e2e-integration:
    name: E2E Integration Tests (informatif)
    continue-on-error: true
    # ... run: npx playwright test e2e/specs/00-integration.spec.ts
```

---

## Résumé décisionnel

```
Application en développement  →  Mocks Playwright (S1–S4)
Application finalisée         →  Mocks + Intégration réelle (S5)
Après un déploiement         →  Intégration réelle en priorité (smoke tests)
```

Les tests mockés restent **toujours utiles** même après la finalisation :
ils protègent les refactors frontend indépendamment du backend.
Les tests d'intégration réels deviennent **critiques en production** :
ils détectent les régressions API/DB que les mocks ne voient pas.
