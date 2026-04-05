import { test, expect } from '../fixtures/auth.fixture';
import { NormalizationPage } from '../pages/normalization.page';
import { RatiosPage } from '../pages/ratios.page';
import { TEST_CASE, TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_NORMALIZATION = [
    {
        id: 'mock-norm-2022',
        fiscal_year: 2022,
        revenue: 1800000.0,
        ebitda: 360000.0,
        net_income: 216000.0,
        operating_cash_flow: 270000.0,
        adjustments_count: 2,
    },
    {
        id: 'mock-norm-2023',
        fiscal_year: 2023,
        revenue: 2000000.0,
        ebitda: 400000.0,
        net_income: 240000.0,
        operating_cash_flow: 300000.0,
        adjustments_count: 3,
    },
];

const MOCK_NORMALIZATION_V2 = [
    {
        id: 'mock-norm-2022',
        fiscal_year: 2022,
        revenue: 1800000.0,
        ebitda: 360000.0,
        net_income: 216000.0,
        operating_cash_flow: 270000.0,
        adjustments_count: 2,
    },
    {
        id: 'mock-norm-2023-v2',
        fiscal_year: 2023,
        revenue: 2000000.0,
        ebitda: 420000.0,
        net_income: 252000.0,
        operating_cash_flow: 315000.0,
        adjustments_count: 4,
    },
];

const MOCK_RATIOS = [
    {
        id: 'mock-ratio-2022',
        case_id: TEST_CASE_ID,
        fiscal_year: 2022,
        normalized_statement_id: 'mock-norm-2022',
        current_ratio: 1.8,
        quick_ratio: 1.2,
        cash_ratio: 0.4,
        working_capital_requirement: 150000.0,
        cash_flow_capacity_margin_pct: 0.15,
        debt_to_equity: 0.9,
        net_margin: 0.12,
        ebitda_margin: 0.20,
        z_score_altman: 2.8,
        z_score_zone: 'GREY',
        coherence_alerts_json: [],
    },
    {
        id: 'mock-ratio-2023',
        case_id: TEST_CASE_ID,
        fiscal_year: 2023,
        normalized_statement_id: 'mock-norm-2023',
        current_ratio: 1.9,
        quick_ratio: 1.3,
        cash_ratio: 0.5,
        working_capital_requirement: 160000.0,
        cash_flow_capacity_margin_pct: 0.16,
        debt_to_equity: 0.85,
        net_margin: 0.12,
        ebitda_margin: 0.20,
        z_score_altman: 3.0,
        z_score_zone: 'SAFE',
        coherence_alerts_json: [],
    },
];

const MOCK_CASE_BASE = {
    id: TEST_CASE_ID,
    bidder_name: 'E2E Test Company',
    sector: 'BTP',
    contract_value: 5000000,
    contract_currency: 'USD',
    case_type: 'STANDARD',
    status: 'SCORING_DONE',
};

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 3 Normalization', () => {

    test.beforeEach(async ({ page }) => {
        // ÉTAPE 1 — Tous les mocks AVANT goto()
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/**`, (route: any) => route.continue());
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ratios**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
        );
        await page.route(API_ENDPOINTS.normalizedFinancials(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
        );
        await page.route(API_ENDPOINTS.normalization(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, (route: any) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );

        // ÉTAPE 2 — Navigation APRÈS les mocks
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);

        // ÉTAPE 3 — Attendre stabilisation réseau
        await page.waitForLoadState('networkidle');

        // ÉTAPE 4 — Attendre le composant racine du bloc (root container) + badge de statut (données chargées)
        await expect(page.getByTestId('normalization-root')).toBeVisible({ timeout: TIMEOUTS.navigation });
        await expect(page.getByTestId('normalization-status-badge')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('La page Normalization se charge et affiche le badge NORMALIZED', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await expect(normalizationPage.statusBadge).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(normalizationPage.statusBadge).toContainText('NORMALIZED');
    });

    test('L\'annee fiscale est affichee dans le header', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await expect(normalizationPage.fiscalYearDisplay).toContainText('2023');
    });

    test('Le bouton Compute Ratios est present et active', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
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
        await page.route(API_ENDPOINTS.normalization(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION_V2) })
        );

        // Surcharger le GET normalized-financials pour retourner V2 apres le recalcul
        let getCallCount = 0;
        await page.route(API_ENDPOINTS.normalizedFinancials(TEST_CASE_ID), route => {
            getCallCount++;
            const body = getCallCount >= 2 ? MOCK_NORMALIZATION_V2 : MOCK_NORMALIZATION;
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
        });

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

        await expect(normalizationPage.statusBadge).toBeVisible({ timeout: TIMEOUTS.apiResponse });

        await normalizationPage.clickComputeRatios();
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ratios`),
            { timeout: TIMEOUTS.navigation }
        );
        await ratiosPage.expectPageLoaded();
    });

});
