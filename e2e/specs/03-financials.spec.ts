import { test, expect } from '../fixtures/auth.fixture';
import { FinancialsPage } from '../pages/financials.page';

const TEST_CASE_ID = 'TEST-CASE-001';

test.describe('Isolation — Bloc 2 Financials', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/financials**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ years: [2021, 2022, 2023], data: {} }) })
        );
    });

    test('SKELETON — Financials : le bouton Run Normalization est visible', async ({ page }) => {
        const financialsPage = new FinancialsPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/financials`);
        await expect(financialsPage.runNormalizationBtn).toBeVisible();
    });

    // TODO S4 : test saisie bilan, CPC, TFT
    // TODO S4 : test run normalization avec mock réponse
});