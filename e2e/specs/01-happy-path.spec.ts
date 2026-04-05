import { test, expect } from '../fixtures/auth.fixture';
import { NormalizationPage } from '../pages/normalization.page';
import { RatiosPage } from '../pages/ratios.page';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { RapportPage } from '../pages/rapport.page';
import { TEST_CASE, API_ENDPOINTS } from '../fixtures/test-data';

// ─── CONSTANTES DE TEST ─────────────────────────────────────────────────────
const TEST_CASE_ID = TEST_CASE.id;

// ─── MOCK PAYLOADS ──────────────────────────────────────────────────────────────────────────────

// Bloc 3 — List[FinancialStatementNormalized]
// Champs réels : id, fiscal_year, revenue, ebitda, net_income,
//               operating_cash_flow, adjustments_count
// Supprimés : normalized_*, confidence_score, normalization_date,
//              source_standard, applied_standard, working_capital
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

// Bloc 4 — List[RatioSetSchema] (champs plats — PAS RatioSetEnrichedOut groupé)
// Route : POST /cases/{id}/ratios/compute → response_model=List[RatioSetSchema]
// Renommés : wcr → working_capital_requirement
//             cf_capacity_margin → cash_flow_capacity_margin_pct
// Supprimé : structure groupée liquidity{}/solvency{}/profitability{}/capacity{}/z_score{}
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
        current_ratio: 2.1,
        quick_ratio: 1.5,
        cash_ratio: 0.6,
        working_capital_requirement: 180000.0,
        cash_flow_capacity_margin_pct: 0.18,
        debt_to_equity: 0.8,
        net_margin: 0.14,
        ebitda_margin: 0.22,
        z_score_altman: 3.1,
        z_score_zone: 'SAFE',
        coherence_alerts_json: [],
    },
];

// Bloc 5 — ScorecardOutputSchema
// Scores 0–5 (pas 0–100), labels InterpretationLabel, RiskClass réels
// Supprimés : scorecard_id, ia_score, tension_level, expert_comment,
//              version, fiscal_year, risk_class (→ final_risk_class),
//              liquidity_score etc. (→ dans pillars[])
const MOCK_SCORING = {
    system_calculated_score: 3.2,
    system_risk_class: 'MODERATE',
    global_score: 3.2,
    base_risk_class: 'MODERATE',
    final_risk_class: 'MODERATE',
    is_overridden: false,
    override_rationale: null,
    risk_profile: 'BALANCED',
    risk_description: 'Profil équilibré',
    synergy_index: null,
    synergy_bonus: null,
    cross_analysis_alerts: [],
    trends_summary: {},
    smart_recommendations: ['Surveiller la trésorerie'],
    overrides_applied: [],
    computed_at: '2024-01-15T10:00:00Z',
    pillars: [
        {
            id: 'liquidity',
            name: 'Liquidité',
            score: 3,
            weight: 0.25,
            trend: [2.8, 3.0, 3.2],
            signals: ['Ratio courant satisfaisant'],
            detailText: 'Liquidité correcte',
        },
        {
            id: 'solvency',
            name: 'Solvabilité',
            score: 3,
            weight: 0.25,
            trend: [2.5, 2.8, 3.0],
            signals: ['Endettement maîtrisé'],
            detailText: 'Solvabilité correcte',
        },
        {
            id: 'profitability',
            name: 'Rentabilité',
            score: 3,
            weight: 0.20,
            trend: [2.9, 3.1, 3.3],
            signals: ['Marge nette positive'],
            detailText: 'Rentabilité satisfaisante',
        },
        {
            id: 'capacity',
            name: 'Capacité',
            score: 3,
            weight: 0.20,
            trend: [3.0, 3.2, 3.4],
            signals: ['Cash-flow positif'],
            detailText: 'Capacité correcte',
        },
        {
            id: 'quality',
            name: 'Qualité',
            score: 4,
            weight: 0.10,
            trend: [3.5, 3.8, 4.0],
            signals: ['Données auditées'],
            detailText: 'Qualité des données élevée',
        },
    ],
};

const MOCK_IA_PREDICTION = {
    case_id:              TEST_CASE_ID,
    ia_score: 72.5, // keep it for logic
    ia_risk_class: 'MODERATE',
    model_version:        'e2e-stub-v1.0',
    prediction_timestamp: '2024-01-15T10:00:00Z',
    predicted_score:      3.2,
    predicted_risk_class: 'MODERATE',
    confidence_interval:  { lower: 2.1, upper: 3.5 },
    model_performance:    { auc_roc: 0.89, accuracy: 0.85, f1_score: 0.82 },
    disclaimer:           'Ce score est fourni à titre indicatif uniquement.',
    feature_importance:   [],
    shap_values: {
        base_value:         3.0,
        total_contribution: -0.6,
        features: [
            { feature_name: 'Cash-flow', feature_value: '1M', shap_value: 0.3, direction: 'positive', magnitude: 0.3 }
        ],
    },
};

// GET /ia/models/active
// Corrigé : name → model_name, métriques dans metrics{}
const MOCK_IA_MODEL = {
    id:                  'mock-model-e2e-001',
    name:                'XGBoost Risk Classifier',
    version:             'e2e-stub-v1.0',
    is_active:           true,
    auc_roc:             0.89,
    accuracy:            0.85,
    f1_score:            0.82,
    confidence_interval: { lower: 0.85, upper: 0.93 },
    trained_at:          '2024-01-01T00:00:00Z',
};

// Bloc 7 — Tension : PAS de mock API nécessaire.
// La tension est calculée localement par TensionCalculatorService
// à partir des données MCC (scoring) et IA déjà en mémoire.

// Bloc 8 — Stress — List[StressResultSchema] (objet unique par appel contractuel)
// Route : GET /cases/{id}/stress → retourne StressResultSchema (pas List brute)
// StressDecision : SOLVENT / LIMIT / INSOLVENT
const MOCK_STRESS: Record<string, unknown> = {
    contract_value: 5000000,
    contract_months: 24,
    annual_ca_avg: 10000000,
    exposition_pct: 0.5,
    backlog_value: 0,
    bank_guarantee: false,
    bank_guarantee_amount: 0,
    credit_lines_confirmed: 0,
    cash_available: 1500000,
    working_capital_requirement_estimate: 800000,
    advance_payment_pct: 0.1,
    payment_milestones: [],
    stress_60d_result: 'SOLVENT',
    stress_90d_result: 'SOLVENT',
    stress_60d_cash_position: 700000,
    stress_90d_cash_position: 550000,
    score_capacity: 3.5,
    capacity_conclusion: 'Capacité financière suffisante',
    monthly_flows: [],
    scenarios_results: {},
    data_alerts: [],
};

// Bloc 9 — Expert
// Le composant ne fait PAS de GET /expert au ngOnInit —
// MOCK_EXPERT conservé uniquement pour usage futur (ex. Bloc 9 assertions POST)
const MOCK_EXPERT = {
    case_id: TEST_CASE_ID,
    expert_opinion: '',
    recommendation: 'ACCEPT',
    status: 'PENDING',
};

// Bloc 10 — Rapport Final
const MOCK_RAPPORT = {
    case_id: TEST_CASE_ID,
    report_url: '/reports/mock-e2e.pdf',
    status: 'DRAFT',
    sections_complete: 14,
    sections_total: 14,
    recommendation: 'ACCEPT',
};

// Bloc 0 — Case Base
const MOCK_CASE_BASE = {
    id: TEST_CASE_ID,
    bidder_name: 'E2E Test Company',
    sector: 'BTP',
    contract_value: 5000000,
    contract_currency: 'USD',
    case_type: 'SINGLE',
    status: 'SCORING_DONE',
    final_risk_class: 'MODERATE',
    global_score: 3.2,
    ia_score: 72.5,
    fiscal_year: 2023,
};

// ─── SUITE HAPPY PATH ──────────────────────────────────────────────────────────────────────────────
test.describe('Happy Path — FinaCES V1.2 E2E (Blocs 3↑10)', () => {

    test('Bloc 3 — Normalization : la page se charge et affiche le badge NORMALIZED', async ({ page }) => {
        const normalizationPage = new NormalizationPage(page);
        await page.route(API_ENDPOINTS.normalizedFinancials(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION[0]) });
        });
        await page.goto(`/cases/${TEST_CASE_ID}/normalization`);
        await page.waitForLoadState('networkidle');
        await normalizationPage.expectPageLoaded();
        await normalizationPage.expectNormalizedBadgeVisible();
    });

    test('Bloc 4 — Ratios : la page se charge et affiche le contenu principal', async ({ page }) => {
        const ratiosPage = new RatiosPage(page);
        await page.route(API_ENDPOINTS.ratiosCompute(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) });
        });
        await page.goto(`/cases/${TEST_CASE_ID}/ratios`);
        await page.waitForLoadState('networkidle');
        await ratiosPage.expectPageLoaded();
        await ratiosPage.expectRatiosDisplayed();
    });

    test('Bloc 5 — Scoring MCC : la page se charge et affiche le score global', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) });
        });
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await page.waitForLoadState('networkidle');
        await scoringPage.expectPageLoaded();
        await scoringPage.expectScoringDisplayed();
    });

    test('Bloc 6 — IA Prediction : la page se charge et affiche la carte de score prédit', async ({ page }) => {
        const iaPage = new IaPage(page);
        await page.route(API_ENDPOINTS.iaPredict(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) });
        });
        await page.route('**/api/v1/ia/models/active**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_MODEL) });
        });
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);
        await page.waitForLoadState('networkidle');
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed();
    });

    test('Bloc 7 — Tension : le composant racine est visible', async ({ page }) => {
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/tension`);
        await tensionPage.expectPageLoaded();
        await tensionPage.expectContentDisplayed();
    });

    test('Bloc 8 — Stress Test : le composant racine est visible', async ({ page }) => {
        const stressPage = new StressPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/stress`);
        await stressPage.expectPageLoaded();
        await stressPage.expectLayoutDisplayed();
    });

    test('Bloc 9 — Expert Opinion : le composant racine est visible', async ({ page }) => {
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/expert`);
        await expertPage.expectPageLoaded();
        await expertPage.expectFormDisplayed();
    });

    test('Bloc 10 — Rapport Final : le composant racine est visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectStructureDisplayed();
        await rapportPage.expectGenerateBtnVisible();
    });

    test('Navigation chain — Scoring vers IA via bouton Proceed', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        const iaPage = new IaPage(page);
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) });
        });
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await page.waitForLoadState('networkidle');
        await scoringPage.expectScoringDisplayed();
        
        await page.route(API_ENDPOINTS.iaPredict(TEST_CASE_ID), async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) });
        });
        await page.route('**/api/v1/ia/models/active**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_MODEL) });
        });
        
        await scoringPage.clickProceedToIA();
        await page.waitForLoadState('networkidle');
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed();
    });

});
