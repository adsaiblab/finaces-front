import { test, expect } from '../fixtures/auth.fixture';
import { GatePage } from '../pages/gate.page';
import { TEST_CASE } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

const MOCK_CASE = {
    id: TEST_CASE_ID,
    name: 'E2E Test Dossier',
    bidder_name: 'E2E Test Company',
    sector: 'BTP',
    contract_value: 5000000,
    contract_currency: 'MAD',
    case_type: 'SINGLE',
    status: 'PENDING_GATE',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: 'e2e',
};

test.describe('Isolation — Bloc 1b Gate', () => {

    test.beforeEach(async ({ page }) => {
        // DocumentService.getGateDocuments() → GET /cases/:id/documents (polled every 2s)
        // Must be mocked BEFORE navigation to prevent real HTTP calls during polling
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/documents**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
        );
        // CaseService.getCaseDetail() → GET /cases/:id
        // Required for DecisionColumnComponent to render (and evaluateBtn to appear)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE) })
        );
        // CaseService.evaluateGate() → POST /cases/:id/gate/evaluate
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/gate/evaluate**`, route =>
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
