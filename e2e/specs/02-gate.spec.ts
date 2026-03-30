import { test, expect } from '../fixtures/auth.fixture';
import { GatePage } from '../pages/gate.page';

const TEST_CASE_ID = 'TEST-CASE-001';

test.describe('Isolation — Bloc 1b Gate', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        // Mock IA evaluation endpoint
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