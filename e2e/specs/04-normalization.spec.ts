import { test, expect } from '../fixtures/auth.fixture';
import { NormalizationPage } from '../pages/normalization.page';
import { TEST_CASE } from '../fixtures/test-data';

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

test.describe('Isolation — Bloc 3 Normalization', () => {

    test.beforeEach(async ({ page }) => {
        // ⚠️ Playwright évalue les routes en ordre LIFO (dernier enregistré = priorité max).
        // On enregistre donc le wildcard continue() EN PREMIER (priorité la plus basse)
        // et les mocks spécifiques EN DERNIER (priorité la plus haute).

        // 1. Wildcard sécurité — laisse passer tout le reste (priorité basse)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/**`, (route: any) => route.continue());

        // 2. Mock ratios (priorité moyenne)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/ratios**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ coherence_status: 'OK', coherence_alerts: [] }) })
        );

        // 3. Mock normalized-financials (priorité haute) — CaseService.getNormalizedFinancials()
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/normalized-financials**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
        );

        // 4. Mock dossier parent exact (priorité maximale) — case-workspace setCaseId
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, (route: any) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
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
