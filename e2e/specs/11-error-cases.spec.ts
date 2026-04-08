// e2e/specs/11-error-cases.spec.ts
// Session 4 — Jour 4 : Cas d'erreur
// CORRIGÉ v8 : MOCK_CASE_BASE aligné sur CaseOut réel + mocks inline
//   Batch 1 (scoring/IA) + Batch 3 (stress) + ExportResultSchema

import { test, expect } from '../fixtures/auth.fixture';
import { TEST_CASE, TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;
const INVALID_ID = 'not-a-valid-uuid';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function mockApi500(page: any, urlPattern: string) {
    await page.route(`**${urlPattern}**`, (route: any) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
    );
}

async function mockApi401(page: any, urlPattern: string) {
    await page.route(`**${urlPattern}**`, (route: any) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Unauthorized' }) })
    );
}

// Mock /api/v1/cases/${ID} STRICT : ne pas intercepter les sous-routes
async function mockCaseDetail(page: any, caseId: string, body: object) {
    await page.route(`**/api/v1/cases/${caseId}/**`, (route: any) => {
        return route.continue();
    });
    await page.route(`**/api/v1/cases/${caseId}`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    );
}

// MOCK_CASE_BASE — aligné sur CaseOut réel :
// - risk_class supprimé (fantôme sur CaseOut)
// - tension_label supprimé (fantôme global, 0 occurrence backend)
// - contract_currency MAD→USD (alignement seed)
// - mcc_score 72→3.2 (scale 0-5)
// - ia_score 68→72.5 (alignement Batch 1)
// - case_type STANDARD→SINGLE (valeur enum CaseType valide)
const MOCK_CASE_BASE = {
    id: ID,
    bidder_name: 'E2E Error Test',
    sector: 'BTP',
    contract_value: 5000000,
    contract_currency: 'USD',
    case_type: 'SINGLE',
    status: 'IN_PROGRESS',
    mcc_score: 3.2,
    ia_score: 72.5,
    fiscal_year: 2023,
};

const MOCK_CONSORTIUM_DATA = {
    joint_venture_type: 'SOLIDAIRE',
    synergy_index: 2.5,
    weakest_member_id: 'm2',
    combined_scorecard: { final_score: 3.45, risk_class: 'MODERATE' },
    members: [
        { member_id: 'm1', member_name: 'Alpha Corp', score: 3.8, participation_pct: 60, role: 'LEADER', risk_class: 'LOW',  status: 'ACTIVE' },
        { member_id: 'm2', member_name: 'Beta Ltd',   score: 2.1, participation_pct: 40, role: 'MEMBER', risk_class: 'HIGH', status: 'ACTIVE' },
    ],
};

const MOCK_IA_MODEL = {
    id:                  'mock-model-err-001',
    name:                'XGBoost Risk Classifier',
    version:             'e2e-stub-v1.0',
    is_active:           true,
    auc_roc:             0.89,
    accuracy:            0.85,
    f1_score:            0.82,
    confidence_interval: { lower: 0.85, upper: 0.93 },
    trained_at:          '2024-01-01T00:00:00Z',
};

const MOCK_REPORT_BASE = {
    report_id: 'rpt-err-001',
    case_id: ID,
    status: 'DRAFT',
    sections_complete: 3,
    sections_total: 14,
    recommendation: 'FAVORABLE',
    section_14_conclusion: 'Conclusion E2E.',
    audit_log: []
};

// ═══════════════════════════════════════════════════════════════════════════
// A — JWT Interceptor : 401 → redirect /auth/login
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — 401 JWT Token expiré', () => {

    test('Normalization 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, API_ENDPOINTS.normalizedFinancials(ID));
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Scoring 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, API_ENDPOINTS.score(ID));
        await page.goto(`/cases/${ID}/scoring-mcc`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('IA Prediction 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, API_ENDPOINTS.iaPredict(ID));
        await page.goto(`/cases/${ID}/ia`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Rapport 401 → redirect vers /auth/login', async ({ page }) => {
        // En mockant l'appel principal du dossier, on déclenche le redirect immédiat
        await mockApi401(page, `/api/v1/cases/${ID}`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Dashboard stats 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/dashboard/stats`);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Consortium 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/api/v1/cases/${ID}`);
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Admin IA models 401 → composant reste visible (pas de redirect sur route standalone)', async ({ page }) => {
        await mockApi401(page, `/ia/admin`);
        await page.goto('/admin-ia');
        await expect(page.locator('[data-testid="admin-ia-root"]')).toBeVisible({ timeout: TIMEOUTS.navigation });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// B — UUID Guard : identifiant invalide → redirect /dashboard
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — UUID invalide → redirect /dashboard', () => {

    test('UUID invalide sur /normalization redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/normalization`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /scoring-mcc redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/scoring-mcc`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /ia redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/ia`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /rapport redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/rapport`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /consortium redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/consortium`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /stress redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/stress`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /expert redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/expert`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

    test('UUID invalide sur /tension redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/tension`);
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// C — Bloc 3 Normalization : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 3 Normalization API 500', () => {

    test('GET normalized-financials 500 → fallback mock : composant racine visible', async ({ page }) => {
        await mockApi500(page, API_ENDPOINTS.normalizedFinancials(ID));
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET normalized-financials 500 → fallback mock actif, compute-ratios-btn visible', async ({ page }) => {
        await mockApi500(page, API_ENDPOINTS.normalizedFinancials(ID));
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="normalization-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="normalization-compute-ratios-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /normalize 500 → fallback snackbar : composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/**`, (route: any) => route.continue());
        
        await page.route(API_ENDPOINTS.normalizedFinancials(ID), route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    statement_id: 'mock-norm-stmt-2023',
                    fiscal_year: 2023,
                    normalized_revenue: 2000000.0,
                    normalized_ebitda: 400000.0,
                    normalized_net_income: 240000.0,
                    normalized_working_capital: 160000.0,
                    normalized_cash_flow: 300000.0,
                    adjustments: [],
                    confidence_score: 0.92,
                    normalization_date: '2024-01-15T10:00:00Z',
                    source_standard: 'LOCAL',
                    applied_standard: 'IFRS',
                    exchange_rate_used: 1.0,
                    exchange_rate_date: '2024-01-15'
                })
            })
        );
        
        await page.route(API_ENDPOINTS.normalization(ID), route => 
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Error' }) })
        );
        
        await page.route(`**/api/v1/cases/${ID}`, (route: any) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: 15000 });
        const calcBtn = page.locator('[data-testid="normalization-recalculate-btn"]');
        await expect(calcBtn).toBeVisible({ timeout: 15000 });
        await calcBtn.evaluate((b) => (b as HTMLElement).click());
        await expect(page.locator('snack-bar-container, .mat-mdc-snack-bar-container')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// D — Bloc 5 Scoring : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 5 Scoring API 500', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
    });

    test('GET /score 500 → composant racine visible, spinner absent, error-banner visible', async ({ page }) => {
        await page.route(API_ENDPOINTS.score(ID), route =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
        );
        await page.goto(`/cases/${ID}/scoring-mcc`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="scoring-loading-spinner"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="scoring-load-error"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="scoring-main-content"]')).not.toBeVisible();
    });

    test('POST /recommendation 500 → formulaire override reste accessible', async ({ page }) => {
        // Mock aligné sur ScoringResultSchema réel (Batch 1)
        await page.route(API_ENDPOINTS.score(ID), route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID,
                    global_score: 3.2,
                    final_risk_class: 'MODERATE',
                    system_calculated_score: 3.2,
                    system_risk_class: 'MODERATE',
                    base_risk_class: 'MODERATE',
                    is_overridden: false,
                    risk_profile: 'BALANCED',
                    pillars: [
                        { id: 'liquidity',     name: 'Liquidity',     score: 3.0, weight: 0.2, sub_ratios: [] },
                        { id: 'solvency',      name: 'Solvency',      score: 3.0, weight: 0.2, sub_ratios: [] },
                        { id: 'profitability', name: 'Profitability', score: 3.0, weight: 0.2, sub_ratios: [] },
                        { id: 'capacity',      name: 'Capacity',      score: 3.0, weight: 0.2, sub_ratios: [] },
                        { id: 'quality',       name: 'Quality',       score: 3.0, weight: 0.2, sub_ratios: [] },
                    ],
                    smart_recommendations: [],
                    cross_analysis_alerts: [],
                    overrides_applied: [],
                    trends_summary: {},
                    synergy_index: null,
                    synergy_bonus: null,
                    computed_at: '2026-01-01T00:00:00Z',
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/recommendation`);
        await page.goto(`/cases/${ID}/scoring-mcc`);
        await expect(page.locator('[data-testid="scoring-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-override-zone"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// E — Bloc 6 IA Prediction : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 6 IA Prediction API 500', () => {
    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
    });

    test('GET /ia/predict 500 → composant racine visible (fallback mock IA)', async ({ page }) => {
        await mockApi500(page, API_ENDPOINTS.iaPredict(ID));
        await page.goto(`/cases/${ID}/ia`);
        await expect(page.locator('[data-testid="ia-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /ia/simulate 500 → what-if placeholder toujours visible', async ({ page }) => {
        // Mock aligné sur IAPredictionResult réel (Batch 1)
        await page.route(API_ENDPOINTS.iaPredict(ID), route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID,
                    ia_score: 72.5,
                    ia_risk_class: 'MODERATE',
                    model_version: 'e2e-stub-v1.0',
                    predicted_at: '2026-01-01T00:00:00Z',
                    threshold_info: {},
                    predicted_score: 0.725,
                    confidence_interval: { lower: 0.70, upper: 0.75 },
                    model_performance: { auc_roc: 0.85, precision: 0.80, recall: 0.82, f1_score: 0.81, ks_statistic: 0.40 },
                    features_importance: [],
                    shap_values: [],
                    data_quality_score: 0.95,
                    disclaimer: 'test disclaimer'
                })
            })
        );
        await page.route('**/api/v1/ia/models/active**', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_MODEL) })
        );
        await mockApi500(page, API_ENDPOINTS.iaSimulate(ID));
        await page.goto(`/cases/${ID}/ia`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="ia-loading-spinner"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="ia-simulation-placeholder"]')).toBeVisible({ timeout: 15000 });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// F — Bloc 8 Stress : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 8 Stress API 500', () => {

    test('GET /stress 500 → composant racine visible (fallback mock stress)', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.route(`**/api/v1/cases/${ID}/stress**`, route =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
        );
        await page.goto(`/cases/${ID}/stress`);
        await expect(page.locator('[data-testid="stress-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="stress-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /stress/run 500 → composant reste stable', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/stress/run`);
        // Mock GET stress aligné sur StressResultSchema réel (Batch 3) — champs minimaux
        await page.route(`**/api/v1/cases/${ID}/stress**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({
                    status: 200, contentType: 'application/json', body: JSON.stringify({
                        contract_value: 5000000.0,
                        contract_months: 24,
                        annual_ca_avg: 2000000.0,
                        exposition_pct: 0.25,
                        backlog_value: 0.0,
                        bank_guarantee: false,
                        bank_guarantee_amount: 0.0,
                        credit_lines_confirmed: 500000.0,
                        cash_available: 800000.0,
                        working_capital_requirement_estimate: 300000.0,
                        advance_payment_pct: 0.10,
                        payment_milestones: [],
                        stress_60d_result: 'SOLVENT',
                        stress_90d_result: 'SOLVENT',
                        stress_60d_cash_position: 650000.0,
                        stress_90d_cash_position: 500000.0,
                        score_capacity: 3.2,
                        capacity_conclusion: 'Capacité satisfaisante',
                        monthly_flows: [],
                        scenarios_results: {},
                        data_alerts: [],
                    })
                });
            return route.continue();
        });
        await page.goto(`/cases/${ID}/stress`);
        await expect(page.locator('[data-testid="stress-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="stress-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// G — Bloc 9 Expert : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 9 Expert API 500', () => {

    test('GET /cases/:id 500 sur /expert → isLoading false, expert-root visible', async ({ page }) => {
        await mockApi500(page, `/api/v1/cases/${ID}`);
        await page.goto(`/cases/${ID}/expert`);
        await expect(page.locator('[data-testid="expert-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="expert-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /expert/submit 500 → bouton Submit reste accessible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await mockApi500(page, `/cases/${ID}/expert/submit`);
        await page.goto(`/cases/${ID}/expert`);
        await expect(page.locator('[data-testid="expert-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="expert-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="expert-submit-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// H — Bloc 10 Rapport : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 10 Rapport API 500', () => {

    test('GET /report 500 → composant racine visible, état d\'erreur affiché', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/report`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-error-state"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /report/build 500 → composant reste stable sans crash', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) });
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Build failed' }) });
        });
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const generateBtn = page.locator('[data-testid="rapport-generate-btn"]');
        await expect(generateBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await generateBtn.click();
        await page.waitForTimeout(1500);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });

    test('POST /export/pdf 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, route => {
            if (route.request().method() === 'GET') {
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_BASE) });
            }
            if (route.request().url().includes('/export/pdf')) {
                return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Export failed' }) });
            }
            return route.continue();
        });
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const pdfBtn = page.locator('[data-testid="rapport-export-pdf-btn"]');
        await expect(pdfBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await pdfBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });

    test('POST /export/word 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, route => {
            if (route.request().method() === 'GET') {
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_BASE) });
            }
            if (route.request().url().includes('/export/word')) {
                return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Export failed' }) });
            }
            return route.continue();
        });
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const wordBtn = page.locator('[data-testid="rapport-export-word-btn"]');
        await expect(wordBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await wordBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// I — Bloc 12 Consortium : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 12 Consortium API 500', () => {

    test('GET /consortium 500 → catchError actif : spinner absent, consortium-root visible', async ({ page }) => {
        await mockCaseDetail(page, ID, { ...MOCK_CASE_BASE, case_type: 'CONSORTIUM' });
        await page.route(`**/api/v1/cases/${ID}/consortium**`, (route: any) =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
        );
        await page.goto(`/cases/${ID}/consortium`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="consortium-load-error"]')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('[data-testid="consortium-loading-spinner"]')).not.toBeVisible();
    });

    test('POST /consortium/aggregate 500 → composant reste stable', async ({ page }) => {
        await mockCaseDetail(page, ID, { ...MOCK_CASE_BASE, case_type: 'CONSORTIUM' });
        await page.route(`**/api/v1/cases/${ID}/consortium**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(MOCK_CONSORTIUM_DATA),
                });
            return route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'Aggregation failed' }),
            });
        });
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page.locator('[data-testid="consortium-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="consortium-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const forceBtn = page.locator('[data-testid="consortium-recalculate-btn"]');
        await expect(forceBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await forceBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="consortium-root"]')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// J — Dashboard : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Dashboard API 500', () => {

    test('GET /dashboard/stats 500 → page ne crash pas', async ({ page }) => {
        await mockApi500(page, `/dashboard/stats`);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
        await expect(page.locator('app-dashboard')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET /cases 500 sur dashboard → page reste accessible', async ({ page }) => {
        await mockApi500(page, `/cases`);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
        await expect(page.locator('app-dashboard')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// K — Cases List : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Cases List API 500', () => {

    test('GET /cases 500 → la liste des dossiers ne crash pas', async ({ page }) => {
        await mockApi500(page, `/api/v1/cases`);
        await page.goto('/cases');
        await expect(page).toHaveURL(/\/cases/, { timeout: TIMEOUTS.navigation });
        await expect(page.locator('body')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// L — Admin IA : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Admin IA API 500', () => {

    test('GET /ia/admin 500 → composant racine reste visible', async ({ page }) => {
        await mockApi500(page, `/ia/admin`);
        await page.goto('/admin-ia');
        await expect(page.locator('[data-testid="admin-ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET /ia/models 500 → Model Registry section reste visible', async ({ page }) => {
        await mockApi500(page, `/ia/models`);
        await page.goto('/admin-ia');
        await expect(page.locator('[data-testid="admin-ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// M — Bloc 1b Gate : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 1b Gate API 500', () => {

    test("POST /gate/evaluate 500 → bouton d'évaluation reste accessible", async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({...MOCK_CASE_BASE, status: 'PENDING_GATE', gate_decision: null}) })
        );
        await mockApi500(page, `/cases/${ID}/gate/evaluate`);
        await page.goto(`/cases/${ID}/gate`);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="gate-evaluate-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await page.locator('[data-testid="gate-evaluate-btn"]').click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible();
    });
});
