/**
 * e2e/specs/07-tension-stress-expert.spec.ts
 * ────────────────────────────────────────────────────────────────────────────────
 * Isolation — Blocs 7 Tension / 8 Stress / 9 Expert
 * Session 4 Jour 2 : enrichissement complet des TODO S4
 * ────────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '../fixtures/auth.fixture';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;

// ── Mocks ────────────────────────────────────────────────────────────────────────────────

// MOCK_TENSION : tension_label supprimé (champ fantome, absent du backend)
const MOCK_TENSION = {
    mcc_score: 3.2,
    ia_score: 72.5,
    delta: 0.52,
    pillars: [
        { pillar: 'LIQUIDITY', mcc_score: 3.5, ia_score: 70, tension: false },
        { pillar: 'SOLVENCY',  mcc_score: 2.8, ia_score: 62, tension: true },
    ],
};

// MOCK_STRESS : StressResultSchema complet (tous les champs obligatoires non-Optional)
const MOCK_STRESS = {
    contract_value: 5000000.0,
    contract_months: 24,
    annual_ca_avg: 2000000.0,
    exposition_pct: 0.25,
    backlog_value: 0.0,
    bank_guarantee: false,
    bank_guarantee_amount: 0.0,
    credit_lines_confirmed: 500000.0,
    cash_available: 800000.0,
    working_capital_requirement_estimate: 300000.0,
    advance_payment_pct: 0.10,
    payment_milestones: [],
    stress_60d_result: 'SOLVENT',    // StressDecision enum
    stress_90d_result: 'SOLVENT',    // StressDecision enum
    stress_60d_cash_position: 650000.0,
    stress_90d_cash_position: 500000.0,
    score_capacity: 3.5,
    capacity_conclusion: 'Capacité satisfaisante',
    monthly_flows: [],
    scenarios_results: {},
    data_alerts: [],
};

// MOCK_EXPERT : tension_label supprimé (fantome) — utilisé aussi comme case detail
const MOCK_EXPERT = {
    id: ID,
    bidder_name: TEST_CASE.bidderName,
    mcc_score: 3.2,
    ia_score: 72.5,
};

// ────────────────────────────────────────────────────────────────────────────────
// BLOC 7 — TENSION
// ────────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────────
// BLOC 8 — STRESS
// ────────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────────
// BLOC 9 — EXPERT
// ────────────────────────────────────────────────────────────────────────────────
test.describe('Isolation — Bloc 9 Expert', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
        );
        // Route réelle confirmée : POST /cases/{case_id}/experts/review
        await page.route(`**/api/v1/cases/${ID}/experts/review**`, route =>
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
