/**
 * e2e/specs/10-admin-ia.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolation — Admin IA (MLOps Center)
 * Session 4 Jour 2
 *
 * Route : /admin-ia (hors workspace case, pas de :id dans l'URL)
 * Service : AdminIaService.getDashboardData() est 100% mock interne
 *           via Observable<delay(800)> — PAS d'appel HTTP réel.
 *           Pas de page.route() nécessaire.
 *
 * NOTE : les data-testid doivent être ajoutés dans le template
 * (voir pré-requis de ce livrable).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '../fixtures/auth.fixture';
import { AdminIaPage } from '../pages/admin-ia.page';
import { TIMEOUTS } from '../fixtures/test-data';

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURE & CHARGEMENT
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin IA — Chargement et structure', () => {

    test('SKELETON — Admin IA : header et disclaimer visibles après chargement', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
    });

    test('Admin IA — le disclaimer "aide à la décision" est affiché', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        await adminPage.expectDisclaimerVisible();
    });

    test('Admin IA — le dashboard grid est visible après chargement des données', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        // Le grid s'affiche après résolution du Observable (delay 800ms)
        await adminPage.expectDashboardDisplayed();
    });

    test('Admin IA — le Model Registry est visible', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        await adminPage.expectModelsTableVisible();
    });

    test('Admin IA — le modèle ACTIVE est présent dans la table', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        await adminPage.expectActiveModelPresent();
    });

    test('Admin IA — le badge "ML ADMIN ROLE" est visible dans le header', async ({ page }) => {
        await page.goto('/admin-ia');
        // Le badge est un span statique, pas de data-testid — on le cible par contenu
        const badge = page.getByText('ML ADMIN ROLE');
        await expect(badge).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('Admin IA — le titre "AI / ML Operations Center" est présent', async ({ page }) => {
        await page.goto('/admin-ia');
        const title = page.getByText('AI / ML Operations Center');
        await expect(title).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES MOCK — Vérification contenu
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin IA — Données du mock interne', () => {

    test('Admin IA — la version "FinaCES-v2.1.0" est affichée dans la table', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        await adminPage.expectDashboardDisplayed();
        // Contenu du mock : version FinaCES-v2.1.0 statut ACTIVE
        await expect(adminPage.modelsTable).toContainText('FinaCES-v2.1.0', { timeout: TIMEOUTS.apiResponse });
    });

    test('Admin IA — les 3 statuts (ACTIVE, TESTING, ARCHIVED) sont présents', async ({ page }) => {
        const adminPage = new AdminIaPage(page);
        await page.goto('/admin-ia');
        await adminPage.expectPageLoaded();
        await adminPage.expectDashboardDisplayed();
        await expect(adminPage.modelsTable).toContainText('ACTIVE');
        await expect(adminPage.modelsTable).toContainText('TESTING');
        await expect(adminPage.modelsTable).toContainText('ARCHIVED');
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// AUTHGUARD — Route protégée
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Admin IA — AuthGuard', () => {

    test('Admin IA — la route /admin-ia est accessible avec le token valide', async ({ page }) => {
        // La fixture auth.fixture.ts injecte le token avant la navigation
        await page.goto('/admin-ia');
        // Si le guard laisse passer, on n'est pas redirigé vers /auth/login
        await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

});