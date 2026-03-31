import { test, expect } from '../fixtures/auth.fixture';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_SCORING = {
    case_id: TEST_CASE_ID,
    global_score: 72,
    risk_class: 'B',
    status: 'COMPUTED',
    pillars: [
        { id: 'p1', name: 'Liquidity', score: 70, weight: 0.2 },
        { id: 'p2', name: 'Solvency', score: 75, weight: 0.2 },
    ],
    recommendations: [],
    cross_analysis_alerts: [],
    override: null,
};

const MOCK_SCORING_OVERRIDE = {
    ...MOCK_SCORING,
    override: {
        analyst_comment: 'Secteur strategique — ajustement manuel',
        override_score: 78,
        override_risk_class: 'A',
    },
    global_score: 78,
    risk_class: 'A',
    status: 'OVERRIDE',
};

const MOCK_IA = {
    predicted_score: 68,
    predicted_risk_class: 'B',
    model_version: 'v2.1-test',
    model_performance: { accuracy: 0.87, precision: 0.85, recall: 0.88 },
    confidence_interval: { lower: 62.5, upper: 73.5 },
    shap_values: {
        features: [
            { name: 'Current Ratio', value: 0.35, impact: 'positive' },
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

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 5 Scoring MCC', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/score`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
        );
    });

    test('Le Score Global et la Risk Class sont affiches', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        const scoreResp = page.waitForResponse(
            (r: any) => r.url().includes('/score') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed(scoreResp);
        await expect(scoringPage.globalScoreCard).toBeVisible();
        await expect(scoringPage.riskClassCard).toBeVisible();
    });

    test('Le badge de statut SYSTEM COMPUTED est affiche', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await expect(scoringPage.statusBadge).toContainText('SYSTEM COMPUTED');
    });

    test('La grille des pilliers est visible', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await expect(scoringPage.pillarsGrid).toBeVisible();
    });

    test('Override — la zone override est visible et le mock retourne status OVERRIDE', async ({ page }) => {
        const scoringPage = new ScoringPage(page);

        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/score/override**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING_OVERRIDE) })
        );

        const scoreResp = page.waitForResponse(
            (r: any) => r.url().includes('/score') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed(scoreResp);
        await expect(scoringPage.overrideZone).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Le template affiche "MANUALLY OVERRIDDEN" (pas "OVERRIDE") quand
    // le scoring a un override actif. Valeur lue directement dans le DOM.
    // -----------------------------------------------------------------------
    test('Override — le badge MANUALLY OVERRIDDEN est affiche quand override est actif (mock direct)', async ({ page }) => {
        const scoringPage = new ScoringPage(page);

        await page.unroute(`**/api/v1/cases/${TEST_CASE_ID}/score`);
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/score`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING_OVERRIDE) })
        );

        const scoreResp = page.waitForResponse(
            (r: any) => r.url().includes('/score') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed(scoreResp);
        // Le template affiche "MANUALLY OVERRIDDEN" (valeur exacte du DOM)
        await expect(scoringPage.statusBadge).toContainText('MANUALLY OVERRIDDEN', { timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Navigation Scoring -> IA
    // -----------------------------------------------------------------------
    test('Navigation — le bouton Proceed navigue vers /ia', async ({ page }) => {
        await page.route(`**/api/v1/ia/predict/${TEST_CASE_ID}**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/ia/models/active**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MODEL) })
        );

        const scoringPage = new ScoringPage(page);
        const iaPage = new IaPage(page);

        const scoreResp = page.waitForResponse(
            (r: any) => r.url().includes('/score') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed(scoreResp);

        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await scoringPage.clickProceedToIA();
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed(iaResp);
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ia`),
            { timeout: TIMEOUTS.navigation }
        );
    });

});
