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

// Bloc 3 — FinancialStatementNormalizedSchema (financial.model.ts)
const MOCK_NORMALIZATION = {
    statement_id: 'mock-stmt-e2e-001',
    fiscal_year: 2023,
    normalized_revenue: 8500000,
    normalized_ebitda: 4000000,
    normalized_net_income: 2850000,
    normalized_working_capital: 1500000,
    normalized_cash_flow: 500000,
    adjustments: [
        {
            line_item: 'EBITDA',
            original_value: 3500000,
            adjusted_value: 4000000,
            reason: 'Added back depreciation and amortization',
            confidence: 98,
        },
    ],
    confidence_score: 92,
    normalization_date: '2023-12-31T00:00:00Z',
    source_standard: 'LOCAL',
    applied_standard: 'IFRS',
};

// Bloc 4 — RatioSetGrouped (ratio.model.ts)
const MOCK_RATIO_VALUE = {
    current: 1.5,
    trend: [1.2, 1.3, 1.5],
    benchmark_min: 1.0,
    benchmark_max: 2.5,
    status: 'GREEN',
    unit: 'ratio',
    variation_pct: 15.4,
};

const MOCK_RATIOS = {
    case_id: TEST_CASE_ID,
    fiscal_year: 2023,
    liquidity: {
        current_ratio: MOCK_RATIO_VALUE,
        quick_ratio: MOCK_RATIO_VALUE,
        cash_ratio: MOCK_RATIO_VALUE,
        working_capital: { ...MOCK_RATIO_VALUE, unit: 'currency' },
        wcr: { ...MOCK_RATIO_VALUE, unit: 'currency' },
        wcr_pct_revenue: { ...MOCK_RATIO_VALUE, unit: '%' },
        dso_days: { ...MOCK_RATIO_VALUE, unit: 'days' },
        dpo_days: { ...MOCK_RATIO_VALUE, unit: 'days' },
        dio_days: { ...MOCK_RATIO_VALUE, unit: 'days' },
        cash_conversion_cycle: { ...MOCK_RATIO_VALUE, unit: 'days' },
    },
    solvency: {
        debt_to_equity: MOCK_RATIO_VALUE,
        financial_autonomy: { ...MOCK_RATIO_VALUE, unit: '%' },
        gearing: MOCK_RATIO_VALUE,
        interest_coverage: MOCK_RATIO_VALUE,
        debt_repayment_years: { ...MOCK_RATIO_VALUE, unit: 'days' },
        negative_equity: { ...MOCK_RATIO_VALUE, unit: 'binary' },
    },
    profitability: {
        net_margin: { ...MOCK_RATIO_VALUE, unit: '%' },
        ebitda_margin: { ...MOCK_RATIO_VALUE, unit: '%' },
        operating_margin: { ...MOCK_RATIO_VALUE, unit: '%' },
        roa: { ...MOCK_RATIO_VALUE, unit: '%' },
        roe: { ...MOCK_RATIO_VALUE, unit: '%' },
    },
    capacity: {
        cash_flow_capacity: { ...MOCK_RATIO_VALUE, unit: 'currency' },
        cf_capacity_margin: { ...MOCK_RATIO_VALUE, unit: '%' },
        operating_cash_flow: { ...MOCK_RATIO_VALUE, unit: 'currency' },
    },
    z_score: {
        z_score_altman: { ...MOCK_RATIO_VALUE, current: 3.5 },
        z_score_zone: 'SAFE',
        formula_breakdown: { x1: 0.12, x2: 0.34, x3: 0.21, x4: 0.65 },
    },
    coherence_alerts: [],
    coherence_status: 'CLEAN',
    calculation_date: '2023-12-31T00:00:00Z',
    normalization_source: 'IFRS',
    sector_code: 'BTP',
};

// Bloc 5 — ScorecardOutputSchema (scoring.model.ts)
const MOCK_PILLAR_DETAIL = {
    pillar_name: 'Liquidity',
    score: 72,
    label: 'GOOD',
    ratios_used: ['current_ratio', 'quick_ratio'],
    comment: 'Solid liquidity position',
};

const MOCK_SCORING = {
    case_id: TEST_CASE_ID,
    scorecard_id: 'mock-scorecard-e2e-001',
    fiscal_year: 2023,
    liquidity_score: 72,
    liquidity_label: 'GOOD',
    liquidity_detail: MOCK_PILLAR_DETAIL,
    solvency_score: 68,
    solvency_label: 'FAIR',
    solvency_detail: { ...MOCK_PILLAR_DETAIL, pillar_name: 'Solvency' },
    profitability_score: 75,
    profitability_label: 'GOOD',
    profitability_detail: { ...MOCK_PILLAR_DETAIL, pillar_name: 'Profitability' },
    capacity_score: 70,
    capacity_label: 'GOOD',
    capacity_detail: { ...MOCK_PILLAR_DETAIL, pillar_name: 'Capacity' },
    quality_score: 74,
    quality_label: 'GOOD',
    quality_detail: { ...MOCK_PILLAR_DETAIL, pillar_name: 'Quality' },
    global_score: 72,
    risk_class: 'B',
    risk_profile: 'MODERATE',
    ia_score: 68,
    tension_level: 'NONE',
    tension_comment: null,
    expert_comment: null,
    expert_reviewed_at: null,
    expert_reviewed_by: null,
    created_at: '2023-12-31T00:00:00Z',
    computed_at: '2023-12-31T00:00:00Z',
    version: 'v1.0',
    overrides: [],
};

// Bloc 6 — IAPredictionOut (ia.model.ts)
// GET /ia/predict/:caseId
const MOCK_IA_PREDICTION = {
    id: 'mock-ia-pred-e2e-001',
    case_id: TEST_CASE_ID,
    ia_score: 68,
    ia_risk_class: 'B',
    ia_probability_default: 0.18,
    threshold_info: 'Threshold: 0.35 — Below threshold (low risk)',
    predicted_at: '2023-12-31T00:00:00Z',
    explanations: {
        top_features: [
            {
                feature_name: 'current_ratio',
                feature_value: 1.5,
                shap_value: 0.12,
                impact: 0.08,
                direction: 'POSITIVE',
                magnitude: 'MODERATE',
            },
        ],
        explanation_method: 'SHAP',
        base_value: 0.22,
    },
};

// GET /ia/models/active — IAModelInfo (ia.model.ts)
const MOCK_IA_MODEL = {
    id: 'mock-model-e2e-001',
    name: 'FinaCES XGBoost v2.1',
    version: 'v2.1',
    is_active: true,
    auc_roc: 0.89,
    accuracy: 0.85,
    f1_score: 0.82,
    confidence_interval: { lower: 0.84, upper: 0.94 },
    trained_at: '2023-10-01T00:00:00Z',
};

// Bloc 7 — Tension : PAS de mock API nécessaire.
// La tension est calculée localement par TensionCalculatorService
// à partir des données MCC (scoring) et IA déjà en mémoire.

// Bloc 8 — Stress
const MOCK_STRESS = {
    case_id: TEST_CASE_ID,
    scenarios: [],
    status: 'COMPUTED',
};

// Bloc 9 — Expert
const MOCK_EXPERT = {
    case_id: TEST_CASE_ID,
    expert_opinion: '',
    recommendation: 'FAVORABLE',
    status: 'PENDING',
};

// Bloc 10 — Rapport Final
const MOCK_RAPPORT = {
    case_id: TEST_CASE_ID,
    report_url: '/reports/mock-e2e.pdf',
    status: 'GENERATED',
    sections_complete: 14,
    sections_total: 14,
    recommendation: 'FAVORABLE',
};

// Bloc 0 — Case Base
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

// ─── HELPER : Setup de tous les mocks API ───────────────────────────────
//
// ⚠️  Règle LIFO Playwright : le DERNIER route() enregistré a la priorité MAX.
//     → Wildcard continue() EN PREMIER  (priorité la plus basse)
//     → Mocks spécifiques EN DERNIER   (priorité la plus haute)
//
async function setupApiMocks(page: any, caseId: string) {
    // ── 0. Wildcard sécurité EN PREMIER ──────────────────────────────
    await page.route(`**/api/v1/cases/${caseId}/**`, (route: any) => route.continue());

    // ── 1. Mocks spécifiques EN DERNIER (priorité maximale) ──────────────

    // Bloc 3 — Normalization
    await page.route(`**/api/v1/cases/${caseId}/normalized-financials`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
    );

    // Bloc 4 — Ratios
    await page.route(`**/api/v1/cases/${caseId}/ratios/compute`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
    );

    // Bloc 5 — Scoring MCC
    await page.route(`**/api/v1/cases/${caseId}/score`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
    );

    // Bloc 6 — IA Prediction (forkJoin de 2 appels)
    await page.route(`**/api/v1/ia/predict/${caseId}`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) })
    );
    await page.route(`**/api/v1/ia/models/active`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_MODEL) })
    );

    // Bloc 7 — Tension : pas de mock API (calcul local TensionCalculatorService).

    // Bloc 8 — Stress Test
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
