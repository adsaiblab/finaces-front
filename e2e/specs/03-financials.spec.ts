import { test, expect } from '../fixtures/auth.fixture';
import { FinancialsPage } from '../pages/financials.page';
import { TEST_CASE } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

// FinancialStatementRawOut — structure réelle de GET /cases/{id}/financials
const MOCK_FINANCIALS: Array<{
    id: string;
    case_id: string;
    fiscal_year: number;
    currency_original: string;
    exchange_rate_to_usd: number;
    total_assets: number;
    current_assets: number;
    equity: number;
    revenue: number;
    net_income: number;
    ebitda: number;
    operating_cash_flow: number;
    created_at: string;
    updated_at: string;
}> = [
    {
        id: 'mock-fin-2022',
        case_id: TEST_CASE_ID,
        fiscal_year: 2022,
        currency_original: 'USD',
        exchange_rate_to_usd: 1.0,
        total_assets: 3200000,
        current_assets: 1800000,
        equity: 1200000,
        revenue: 1800000,
        net_income: 216000,
        ebitda: 360000,
        operating_cash_flow: 270000,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
        id: 'mock-fin-2023',
        case_id: TEST_CASE_ID,
        fiscal_year: 2023,
        currency_original: 'USD',
        exchange_rate_to_usd: 1.0,
        total_assets: 3500000,
        current_assets: 2000000,
        equity: 1400000,
        revenue: 2000000,
        net_income: 240000,
        ebitda: 400000,
        operating_cash_flow: 300000,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
    },
];

test.describe('Isolation — Bloc 2 Financials', () => {

    test.beforeEach(async ({ page }) => {
        // FinancialsService.getFinancials() → GET /cases/{id}/financials
        // Returns List[FinancialStatementRawOut] (not { years, data })
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/financials**`, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(MOCK_FINANCIALS),
            })
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
