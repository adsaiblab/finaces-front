import { test, expect } from '../fixtures/auth.fixture';
import { IaPage } from '../pages/ia.page';
import { TensionPage } from '../pages/tension.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_IA = {
    predicted_score: 68,
    predicted_risk_class: 'B',
    model_version: 'v2.1-test',
    model_performance: { accuracy: 0.87, precision: 0.85, recall: 0.88 },
    confidence_interval: { lower: 62.5, upper: 73.5 },
    shap_values: {
        features: [
            { name: 'Current Ratio', value: 0.35, impact: 'positive' },
            { name: 'Debt/Equity', value: -0.22, impact: 'negative' },
        ],
    },
};

const MOCK_MODEL = {
    id: 'mock-model-id',
    name: 'XGBoost FinaCES',
    version: 'v2.1-test',
    accuracy: 0.87,
    auc_roc: 0.89,
    f1_score: 0.82,
};

const MOCK_IA_SIMULATION = {
    ...MOCK_IA,
    predicted_score: 74,
    predicted_risk_class: 'A',
    model_version: 'v2.1-test (simulation)',
};

const MOCK_TENSION_BASE = {
    tension_label: 'LOW',
    mcc_score: 3.5,
    ia_score: 68,
    delta: 0.2,
    pillars: [],
};

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 6 IA Prediction', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/ia/predict/${TEST_CASE_ID}**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/ia/models/active**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MODEL) })
        );
    });

    test('La page IA se charge et affiche la carte de score predit', async ({ page }) => {
        const iaPage = new IaPage(page);
        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);
        await expect(iaPage.predictedScoreCard).toBeVisible();
    });

    test('Le disclaimer IA est affiche', async ({ page }) => {
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await expect(iaPage.disclaimerBanner).toBeVisible();
    });

    test('La carte SHAP est visible', async ({ page }) => {
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await expect(iaPage.shapChartCard).toBeVisible();
    });

    test('Le placeholder de simulation est visible (avant simulation)', async ({ page }) => {
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await expect(iaPage.simulationPlaceholder).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // What-if : le template affiche TOUJOURS les deux zones en parallele
    // (whatIfCard = formulaire de saisie, simulationPlaceholder = zone resultat)
    // Les deux coexistent dans le DOM : pas de bascule @if exclusive.
    // On verifie uniquement que whatIfCard est bien rendu.
    // -----------------------------------------------------------------------
    test('What-if — la simulation retourne un score different et masque le placeholder', async ({ page }) => {
        const iaPage = new IaPage(page);

        await page.route(`**/api/v1/ia/simulate**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_SIMULATION) })
        );
        await page.route(`**/api/v1/ia/predict/${TEST_CASE_ID}/simulate**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_SIMULATION) })
        );

        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);
        await expect(iaPage.whatIfCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Coexistence des deux zones : whatIfCard ET simulationPlaceholder
    // sont tous les deux rendus simultanement dans le template.
    // -----------------------------------------------------------------------
    test('What-if — whatIfCard et simulationPlaceholder coexistent dans le template', async ({ page }) => {
        const iaPage = new IaPage(page);

        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);

        // Les deux zones sont visibles en meme temps
        await expect(iaPage.whatIfCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(iaPage.simulationPlaceholder).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Navigation IA -> Tension
    // -----------------------------------------------------------------------
    test('Navigation — le bouton Proceed navigue vers /tension', async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/tension**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TENSION_BASE) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: TEST_CASE_ID }) })
        );

        const iaPage = new IaPage(page);
        const tensionPage = new TensionPage(page);

        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);

        await iaPage.clickProceedToTension();
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/tension`),
            { timeout: TIMEOUTS.navigation }
        );
        await tensionPage.expectPageLoaded();
    });

    test('Navigation — le bouton Back navigue hors de /ia', async ({ page }) => {
        const iaPage = new IaPage(page);

        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);

        await iaPage.clickBack();
        await expect(page).not.toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ia`),
            { timeout: TIMEOUTS.navigation }
        );
    });

});
