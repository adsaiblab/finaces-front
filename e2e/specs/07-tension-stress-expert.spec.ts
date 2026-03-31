/**
 * e2e/specs/07-tension-stress-expert.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolation — Blocs 7 Tension / 8 Stress / 9 Expert
 * Session 4 Jour 2 : enrichissement complet des TODO S4
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '../fixtures/auth.fixture';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;

// ── Mocks ─────────────────────────────────────────────────────────────────────

const MOCK_TENSION = {
    tension_label: 'MODERATE',
    mcc_score: 3.2,
    ia_score: 68,
    delta: 0.52,
    pillars: [
        { pillar: 'LIQUIDITY', mcc_score: 3.5, ia_score: 70, tension: false },
        { pillar: 'SOLVENCY', mcc_score: 2.8, ia_score: 62, tension: true },
    ],
};

const MOCK_STRESS = {
    stress_results: [
        {
            scenario_id: 'stress60d',
            label: '60-Day Payment Delay',
            status: 'SOLVENT',
            cash_impact: -120_000,
            dscr_impact: -0.15,
        },
        {
            scenario_id: 'stress90d',
            label: '90-Day Critical Delay',
            status: 'LIMIT',
            cash_impact: -280_000,
            dscr_impact: -0.35,
        },
    ],
};

const MOCK_EXPERT = {
    case_id: ID,
    bidder_name: TEST_CASE.bidderName,
    risk_class: 'MODERATE',
    tension_label: 'MODERATE',
    mcc_score: 3.2,
    ia_score: 68,
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOC 7 — TENSION
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Isolation — Bloc 7 Tension', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/tension**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TENSION) })
        );
        // Le bloc tension lit aussi le case detail
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
        );
    });

    test('SKELETON — Bloc 7 Tension : composant racine visible', async ({ page }) => {
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${ID}/tension`);
        await tensionPage.expectPageLoaded();
    });

    test('Tension — le banner de tension est affiché avec le bon niveau', async ({ page }) => {
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${ID}/tension`);
        await tensionPage.expectPageLoaded();
        // Le template utilise data-testid="tension-banner" sur le composant tension-banner
        const banner = page.getByTestId('tension-banner');
        await expect(banner).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('Tension — la table des pilliers est visible', async ({ page }) => {
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${ID}/tension`);
        await tensionPage.expectPageLoaded();
        // Le template utilise data-testid="pillar-tension-table" sur le composant
        const table = page.getByTestId('pillar-tension-table');
        await expect(table).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// BLOC 8 — STRESS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Isolation — Bloc 8 Stress', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/stress**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STRESS) })
        );
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
        );
    });

    test('SKELETON — Bloc 8 Stress : composant racine visible', async ({ page }) => {
        const stressPage = new StressPage(page);
        await page.goto(`/cases/${ID}/stress`);
        await stressPage.expectPageLoaded();
    });

    test('Stress — les paramètres du scénario sont affichés', async ({ page }) => {
        const stressPage = new StressPage(page);
        await page.goto(`/cases/${ID}/stress`);
        await stressPage.expectPageLoaded();
        const params = page.getByTestId('stress-parameters');
        await expect(params).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// BLOC 9 — EXPERT
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Isolation — Bloc 9 Expert', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
        );
        await page.route(`**/api/v1/experts/${ID}/expert-review**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'mock-review-id', case_id: ID }) })
        );
    });

    test('SKELETON — Bloc 9 Expert : composant racine visible', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
    });

    test('Expert — le formulaire complet est affiché', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.expectFormDisplayed();
    });

    test('Expert — toutes les sections du formulaire sont visibles', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.expectAllSectionsVisible();
    });

    test('Expert — le badge EXPERT REVIEW PHASE est affiché', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.expectPhaseBadgeVisible();
    });

    test('Expert — le bouton Submit est désactivé quand le formulaire est vide', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        // Le formulaire est invalide par défaut (champs required vides)
        await expertPage.expectSubmitDisabledWhenFormEmpty();
    });

    test('Expert — la conclusion textarea accepte du texte', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        const longText = 'A'.repeat(150); // >= 100 chars (minlength validator)
        await expertPage.fillConclusion(longText);
        await expect(expertPage.conclusionTextarea).toHaveValue(longText);
    });

    test('Expert — le bouton Return navigue vers /stress', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.clickBack();
        await expect(page).toHaveURL(new RegExp(`/cases/${ID}/stress`), { timeout: TIMEOUTS.navigation });
    });

});