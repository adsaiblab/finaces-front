import { test, expect } from '../fixtures/auth.fixture';
import { NormalizationPage } from '../pages/normalization.page';
import { RatiosPage } from '../pages/ratios.page';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { RapportPage } from '../pages/rapport.page';
import { TEST_CASE } from '../fixtures/test-data';

// ─── CONSTANTES DE TEST ─────────────────────────────────────────────
const TEST_CASE_ID = TEST_CASE.id;

// ─── MOCK PAYLOADS ────────────────────────────────────────────────
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

const MOCK_NORMALIZATION = {
    case_id: TEST_CASE_ID,
    fiscal_year: 2023,
    adjustments: [],
    comparative_statement: {},
    accounting_standard: 'IFRS',
};

const MOCK_RATIOS = {
    case_id: TEST_CASE_ID,
    coherence_status: 'OK',
    coherence_alerts: [],
    liquidity: [],
    solvency: [],
    profitability: [],
    capacity: [],
    z_score: { z_score: 3.5, z_score_zone: 'SAFE', components: {} },
};

const MOCK_SCORING = {
    case_id: TEST_CASE_ID,
    global_score: 72,
    risk_class: 'B',
    status: 'COMPUTED',
    pillars: [],
    recommendations: [],
    cross_analysis_alerts: [],
    override: null,
};

// Bloc 6 — IA : deux endpoints appelés en forkJoin
// - GET /ia/predict/:caseId  → IaService.getPrediction()
// - GET /ia/models/active    → IaService.getActiveModel()
const MOCK_IA_PREDICTION = {
    case_id: TEST_CASE_ID,
    predicted_score: 68,
    predicted_risk_class: 'B',
    model_version: 'v2.1-mock',
    confidence_interval: { lower: 62.5, upper: 73.5 },
    shap_values: { features: [] },
};

const MOCK_IA_MODEL = {
    model_id: 'mock-model-1',
    model_version: 'v2.1-mock',
    auc_roc: 0.89,
    accuracy: 0.85,
    f1_score: 0.82,
};

// Bloc 7 — Tension : PAS de mock API nécessaire.
// La tension est calculée localement par TensionCalculatorService
// à partir des données MCC (scoring) et IA déjà en mémoire.
// Le composant appelle GET /score et GET /ia/predict/:id (déjà mockés).

const MOCK_STRESS = {
    case_id: TEST_CASE_ID,
    scenarios: [],
    status: 'COMPUTED',
};

const MOCK_EXPERT = {
    case_id: TEST_CASE_ID,
    expert_opinion: '',
    recommendation: 'FAVORABLE',
    status: 'PENDING',
};

const MOCK_RAPPORT = {
    case_id: TEST_CASE_ID,
    report_url: '/reports/mock.pdf',
    status: 'GENERATED',
    sections_complete: 14,
    sections_total: 14,
    recommendation: 'FAVORABLE',
};

// ─── HELPER : Setup de tous les mocks API ───────────────────────────────
//
// ⚠️  Règle LIFO Playwright : le DERNIER route() enregistré a la priorité MAX.
//     → Wildcard continue() EN PREMIER  (priorité la plus basse)
//     → Mocks spécifiques EN DERNIER   (priorité la plus haute)
//
async function setupApiMocks(page: any, caseId: string) {
    // ── 0. Wildcard sécurité EN PREMIER ──────────────────────────────
    // Intercepte tout appel résiduel vers ce case sans le bloquer.
    // Doit être enregistré EN PREMIER pour avoir la priorité la plus BASSE.
    await page.route(`**/api/v1/cases/${caseId}/**`, (route: any) => route.continue());

    // ── 1. Mocks spécifiques EN DERNIER (priorité maximale) ──────────────

    // Bloc 3 — Normalization
    // case.service.ts → GET /cases/:id/normalized-financials
    await page.route(`**/api/v1/cases/${caseId}/normalized-financials`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
    );

    // Bloc 4 — Ratios
    // ratio-calculation.service.ts → POST /cases/:id/ratios/compute
    await page.route(`**/api/v1/cases/${caseId}/ratios/compute`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
    );

    // Bloc 5 — Scoring MCC
    // scoring-mcc.service.ts → GET /cases/:id/score
    await page.route(`**/api/v1/cases/${caseId}/score`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
    );

    // Bloc 6 — IA Prediction (forkJoin de 2 appels)
    // ia.service.ts → GET /ia/predict/:caseId
    await page.route(`**/api/v1/ia/predict/${caseId}`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) })
    );
    // ia.service.ts → GET /ia/models/active
    await page.route(`**/api/v1/ia/models/active`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_MODEL) })
    );

    // Bloc 7 — Tension : pas de mock API (calcul local TensionCalculatorService).
    // Le composant réutilise GET /score et GET /ia/predict/:id déjà mockés ci-dessus.

    // Bloc 8 — Stress Test
    // stress.service.ts → GET /cases/:id/stress
    await page.route(`**/api/v1/cases/${caseId}/stress`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STRESS) })
    );

    // Bloc 9 — Expert Opinion
    await page.route(`**/api/v1/cases/${caseId}/expert**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
    );

    // Bloc 10 — Rapport Final
    await page.route(`**/api/v1/cases/${caseId}/report**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RAPPORT) })
    );

    // Données de base du dossier EN DERNIER — exact match, priorité maximale
    await page.route(`**/api/v1/cases/${caseId}`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
    );
}

// ─── SUITE HAPPY PATH ─────────────────────────────────────────────
test.describe('Happy Path — FinaCES V1.2 E2E (Blocs 3→10)', () => {

    test('Bloc 3 — Normalization : la page se charge et affiche le badge NORMALIZED', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const normalizationPage = new NormalizationPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible();
    });

    test('Bloc 4 — Ratios : la page se charge et affiche le contenu principal', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const ratiosPage = new RatiosPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ratios`);
        await ratiosPage.expectPageLoaded();
        await ratiosPage.expectRatiosDisplayed();
    });

    test('Bloc 5 — Scoring MCC : la page se charge et affiche le score global', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const scoringPage = new ScoringPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectPageLoaded();
        await scoringPage.expectScoringDisplayed();
    });

    test('Bloc 6 — IA Prediction : la page se charge et affiche la carte de score prédit', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed();
    });

    test('Bloc 7 — Tension : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/tension`);
        await tensionPage.expectPageLoaded();
        await tensionPage.expectContentDisplayed();
    });

    test('Bloc 8 — Stress Test : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const stressPage = new StressPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/stress`);
        await stressPage.expectPageLoaded();
        await stressPage.expectLayoutDisplayed();
    });

    test('Bloc 9 — Expert Opinion : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.expectFormDisplayed();
    });

    test('Bloc 10 — Rapport Final : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectStructureDisplayed();
        await rapportPage.expectGenerateBtnVisible();
    });

    test('Navigation chain — Scoring vers IA via bouton Proceed (avec mock)', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const scoringPage = new ScoringPage(page);
        const iaPage = new IaPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed();
        await scoringPage.clickProceedToIA();
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed();
    });

});
