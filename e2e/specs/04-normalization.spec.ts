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
    // Recalculate :
    //   Le bouton appelle POST /cases/:id/normalize (normalizeFinancials)
    //   puis en cas de succes rappelle GET /normalized-financials (loadNormalizedData).
    //   On mock les deux endpoints et on attend le GET du rechargement.
    // -----------------------------------------------------------------------
    test('Recalculate — le clic declenche POST /normalize puis recharge le badge', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);

        // Mock POST /normalize (declencheur du recalcul)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalize**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION_V2) })
        );

        // Surcharger le GET normalized-financials pour retourner V2 apres le recalcul
        let getCallCount = 0;
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalized-financials**`, route => {
            getCallCount++;
            const body = getCallCount >= 2 ? MOCK_NORMALIZATION_V2 : MOCK_NORMALIZATION;
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        });

        // Charger la page — 1er GET normalized-financials
        const firstGet = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible(firstGet);
        // recalculateBtn est dans @if(normalizedData()) : attend qu'il soit visible
        await expect(normalizationPage.recalculateBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });

        // Enregistrer l'attente du 2e GET AVANT le clic
        const secondGet = page.waitForResponse(
            (r: any) => r.url().includes('normalized-financials') && r.status() === 200
        );
        // Verifier aussi que le POST /normalize est bien emis
        const postNormalize = page.waitForRequest(
            (req: any) => req.url().includes('/normalize') && req.method() === 'POST'
        );
        await normalizationPage.recalculateBtn.click();
        // Le POST doit partir
        await postNormalize;
        // Puis le GET de rechargement doit arriver
        await secondGet;
        // Le badge doit rester visible apres le rechargement
        await expect(normalizationPage.statusBadge).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Navigation retour vers Financials
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
