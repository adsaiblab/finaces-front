/**
 * e2e/specs/02-smoke.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 2 — Page Objects Smoke Test
 *
 * Objectif : vérifier que la session auth est valide et que les deux
 * premières pages applicatives (Dashboard + CasesList) sont accessibles
 * et fonctionnelles avec les Page Objects.
 *
 * Prérequis : seed_e2e.py doit avoir créé le dossier TEST_CASE.
 * Auth     : gérée par playwright.config.ts via e2e/.auth/user.json
 *            (généré par global-setup.ts — pas de test.use() ici).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { CasesListPage } from '../pages/cases-list.page';
import { TEST_CASE } from '../fixtures/test-data';

test.describe('Session 2 — Page Objects Smoke Test', () => {

  test('Dashboard : les éléments clés sont visibles après connexion', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.goto();
    await expect(dashboard.newCaseBtn).toBeVisible();
    await expect(dashboard.recentCasesTable).toBeVisible();
  });

  test('CasesList : la table des dossiers est accessible et la recherche fonctionne', async ({ page }) => {
    const casesList = new CasesListPage(page);

    await casesList.goto();
    await expect(casesList.casesTable).toBeVisible();

    // Vérifie que le dossier seedé est trouvable par recherche
    await casesList.search(TEST_CASE.marketReference);
    await expect(casesList.caseRow(TEST_CASE.marketReference)).toBeVisible();
  });

});
