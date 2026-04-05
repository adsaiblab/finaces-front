import { test, expect } from '../fixtures/auth.fixture';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TEST_CASE, TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_SCORING = {
    case_id: TEST_CASE_ID,
    system_calculated_score: 3.2,
    system_risk_class: 'MODERATE',
    global_score: 3.2,
    base_risk_class: 'MODERATE',
    final_risk_class: 'MODERATE',
    is_overridden: false,
    override_rationale: null,
    risk_profile: 'BALANCED',
    risk_description: 'Profil équilibré',
    synergy_index: null,
    synergy_bonus: null,
    cross_analysis_alerts: [],
    trends_summary: {},
    smart_recommendations: ['Surveiller la trésorerie'],
    overrides_applied: [],
    computed_at: '2024-01-15T10:00:00Z',
    pillars: [
        {
            id: 'liquidity',
            name: 'Liquidité',
            score: 3.0,
            weight: 0.25,
            trend: [2.8, 3.0, 3.2],
            signals: ['Ratio courant satisfaisant'],
            detailText: 'Liquidité correcte',
        },
        {
            id: 'solvency',
            name: 'Solvabilité',
            score: 3.0,
            weight: 0.25,
            trend: [2.5, 2.8, 3.0],
            signals: ['Endettement maîtrisé'],
            detailText: 'Solvabilité correcte',
        },
    ],
};

const MOCK_SCORING_OVERRIDE = {
    ...MOCK_SCORING,
    global_score: 3.8,
    final_risk_class: 'HIGH',
    is_overridden: true,
    override_rationale: 'Override justifié — secteur stratégique',
};

const MOCK_IA = {
    case_id: TEST_CASE_ID,
    ia_score: 72.5,
    ia_probability_default: 0.18,
    ia_risk_class: 'MODERATE',
    model_version: 'e2e-stub-v1.0',
    predicted_at: '2024-01-15T10:00:00Z',
    explanations: null,
    threshold_info: {},
};

const MOCK_MODEL = {
    id: 'mock-model-e2e-001',
    model_name: 'XGBoost Risk Classifier',
    version: 'e2e-stub-v1.0',
    metrics: {
        auc_roc: 0.89,
        accuracy: 0.85,
        f1_score: 0.82,
    },
    created_at: '2024-01-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 5 Scoring MCC', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), route =>
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

        await page.route(API_ENDPOINTS.score(TEST_CASE_ID) + '?override=true', route =>
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

        await page.unroute(API_ENDPOINTS.score(TEST_CASE_ID));
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), route =>
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
        await page.route(API_ENDPOINTS.iaPredict(TEST_CASE_ID), route =>
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
