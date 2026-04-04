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
    contract_currency: 'USD',
    case_type: 'SINGLE',
    status: 'PENDING_GATE',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    created_by: 'e2e',
};

// GateDecisionSchema — corps réel de POST /cases/{id}/gate/evaluate
const MOCK_GATE_DECISION = {
    is_passed: true,
    verdict: 'PASS',
    reliability_level: 'HIGH',
    reliability_score: 4.0,
    missing_mandatory: [],
    missing_optional: [],
    blocking_reasons: [],
    reserve_flags: [],
    computed_at: '2026-01-01T00:00:00.000Z',
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
        // Body: GateDecisionSchema (is_passed, verdict, reliability_score, ...)
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/gate/evaluate**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_GATE_DECISION) })
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
