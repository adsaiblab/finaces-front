import { test, expect } from '@playwright/test';
import { NormalizationPage } from '../pages/normalization.page';

const TEST_CASE_ID = 'TEST-CASE-001';

const MOCK_NORMALIZATION = {
    case_id: TEST_CASE_ID,
    fiscal_year: 2023,
    adjustments: [
        { id: 1, label: 'Restatement A', amount: 50000 },
    ],
    comparative_statement: {},
    accounting_standard: 'IFRS',
};

test.describe('Isolation — Bloc 3 Normalization', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalization**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ratios**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ coherence_status: 'OK', coherence_alerts: [] }) })
        );
    });

    test('La page Normalization se charge et affiche le badge NORMALIZED', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible();
    });

    test('L\'année fiscale est affichée dans le header', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await expect(normalizationPage.fiscalYearDisplay).toContainText('2023');
    });

    test('Le bouton Compute Ratios est présent et activé', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await expect(normalizationPage.computeRatiosBtn).toBeVisible();
        await expect(normalizationPage.computeRatiosBtn).toBeEnabled();
    });

    // TODO S4 : test recalculate avec mock réponse
    // TODO S4 : test navigation retour vers Financials
});