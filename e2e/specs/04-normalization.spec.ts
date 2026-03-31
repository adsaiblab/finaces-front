import { test, expect } from '../fixtures/auth.fixture';
import { NormalizationPage } from '../pages/normalization.page';
import { RatiosPage } from '../pages/ratios.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_NORMALIZATION = {
    statement_id: 'mock-e2e-001',
    fiscal_year: 2023,
    normalized_revenue: 8500000,
    normalized_ebitda: 4000000,
    normalized_net_income: 2850000,
    normalized_working_capital: 1500000,
    normalized_cash_flow: 500000,
    adjustments: [
        { line_item: 'EBITDA', original_value: 3500000, adjusted_value: 4000000, reason: 'Add back D&A', confidence: 98 },
    ],
    confidence_score: 92,
    normalization_date: '2026-01-01T00:00:00.000Z',
};

const MOCK_NORMALIZATION_V2 = {
    ...MOCK_NORMALIZATION,
    statement_id: 'mock-e2e-002',
    confidence_score: 95,
    adjustments: [
        { line_item: 'EBITDA', original_value: 3500000, adjusted_value: 4200000, reason: 'Recalculated', confidence: 99 },
    ],
};

const MOCK_RATIOS = {
    coherence_status: 'OK',
    coherence_alerts: [],
};

const MOCK_CASE_BASE = {
    id: TEST_CASE_ID,
    bidder_name: 'E2E Test Company',
    sector: 'BTP',
    contract_value: 5000000,
    contract_currency: 'MAD',
    case_type: 'STANDARD',
    status: 'IN_PROGRESS',
    risk_class: 'B',
    mcc_score: 72,
    ia_score: 68,
    tension_label: 'LOW',
    fiscal_year: 2023,
};

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 3 Normalization', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/**`, (route: any) => route.continue());
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ratios**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalized-financials**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, (route: any) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
    });

    test('La page Normalization se charge et affiche le badge NORMALIZED', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        const normResp = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible(normResp);
    });

    test('L\'annee fiscale est affichee dans le header', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await expect(normalizationPage.fiscalYearDisplay).toContainText('2023');
    });

    test('Le bouton Compute Ratios est present et active', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await expect(normalizationPage.computeRatiosBtn).toBeVisible();
        await expect(normalizationPage.computeRatiosBtn).toBeEnabled();
    });

    // -----------------------------------------------------------------------
    // TODO S4 : test recalculate avec mock reponse
    // -----------------------------------------------------------------------
    test('Recalculate — le clic declenche un second appel API et met a jour le badge', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);

        // Compteur d'appels pour detecter le recalcul
        let callCount = 0;
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalized-financials**`, route => {
            callCount++;
            const body = callCount >= 2 ? MOCK_NORMALIZATION_V2 : MOCK_NORMALIZATION;
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        });

        const firstResp = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible(firstResp);

        // Clic recalculate — attend la reponse du 2e appel
        const secondResp = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        await normalizationPage.recalculateBtn.click();
        await secondResp;
        // Le badge doit rester visible apres recalcul
        await expect(normalizationPage.statusBadge).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // TODO S4 : test navigation retour vers Financials
    // -----------------------------------------------------------------------
    test('Navigation — le bouton Back navigue vers /financials', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.clickBack();
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/financials`),
            { timeout: TIMEOUTS.navigation }
        );
    });

    // -----------------------------------------------------------------------
    // Navigation chain : Normalization -> Ratios via bouton Compute Ratios
    // -----------------------------------------------------------------------
    test('Navigation chain — Compute Ratios navigue vers /ratios', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        const ratiosPage = new RatiosPage(page);

        // Mock ratios pour la page de destination
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ratios/compute**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
        );

        const normResp = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible(normResp);

        await normalizationPage.clickComputeRatios();
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ratios`),
            { timeout: TIMEOUTS.navigation }
        );
        await ratiosPage.expectPageLoaded();
    });

});
