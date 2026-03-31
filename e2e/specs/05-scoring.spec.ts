import { test, expect } from '../fixtures/auth.fixture';
import { ScoringPage } from '../pages/scoring.page';
import { TEST_CASE } from '../fixtures/test-data';

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

test.describe('Isolation — Bloc 5 Scoring MCC', () => {

    test.beforeEach(async ({ page }) => {
        // ScoringMccService.getScoring() calls GET /cases/:id/score (not /scoring)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/score`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
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
