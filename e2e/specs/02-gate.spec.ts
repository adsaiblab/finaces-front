import { test, expect } from '../fixtures/auth.fixture';
import { GatePage } from '../pages/gate.page';
import { TEST_CASE } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

test.describe('Isolation — Bloc 1b Gate', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/gate**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'SEALED', checklist: [] }) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/evaluate**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'EVALUATED' }) })
        );
    });

    test('SKELETON — Gate : le bouton d\'évaluation est visible', async ({ page }) => {
        const gatePage = new GatePage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/gate`);
        await expect(gatePage.evaluateBtn).toBeVisible();
    });

    // TODO S4 : test évaluation complète avec mock streaming IA
    // TODO S4 : test seal & navigation vers Financials
});
