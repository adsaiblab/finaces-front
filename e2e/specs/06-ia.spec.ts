import { test, expect } from '@playwright/test';
import { IaPage } from '../pages/ia.page';

const TEST_CASE_ID = 'TEST-CASE-001';

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

test.describe('Isolation — Bloc 6 IA Prediction', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/prediction**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ia**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/tension**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scenarios: [] }) })
        );
    });

    test('La page IA se charge et affiche la carte de score prédit', async ({ page }) => {
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPredictionDisplayed();
        await expect(iaPage.predictedScoreCard).toBeVisible();
    });

    test('Le disclaimer IA est affiché', async ({ page }) => {
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

    // TODO S4 : test simulation what-if avec valeur modifiée
    // TODO S4 : test proceed vers Tension
});