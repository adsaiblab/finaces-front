import { test, expect } from '@playwright/test';
import { ScoringPage } from '../pages/scoring.page';

const TEST_CASE_ID = 'TEST-CASE-001';

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

test.describe('Isolation — Bloc 5 Scoring MCC', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/scoring**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
        );
        // Mock IA pour ne pas bloquer le bouton Proceed
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/prediction**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ predicted_score: 68, predicted_risk_class: 'B', model_version: 'mock', model_performance: { accuracy: 0.87 }, confidence_interval: { lower: 62, upper: 73 }, shap_values: { features: [] } }) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ia**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ predicted_score: 68, predicted_risk_class: 'B', model_version: 'mock', model_performance: { accuracy: 0.87 }, confidence_interval: { lower: 62, upper: 73 }, shap_values: { features: [] } }) })
        );
    });

    test('Le Score Global et la Risk Class sont affichés', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed();
        await expect(scoringPage.globalScoreCard).toBeVisible();
        await expect(scoringPage.riskClassCard).toBeVisible();
    });

    test('Le badge de statut SYSTEM COMPUTED est affiché', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await expect(scoringPage.statusBadge).toContainText('SYSTEM COMPUTED');
    });

    test('La grille des pilliers est visible', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await expect(scoringPage.pillarsGrid).toBeVisible();
    });

    // TODO S4 : test override avec formulaire mock
    // TODO S4 : test navigation Proceed vers IA
});