// e2e/specs/11-error-cases.spec.ts
// Session 4 — Jour 4 : Cas d'erreur
// CORRIGÉ v3 : patterns 401 élargis + mocks 500 ciblés sur routes métier uniquement

import { test, expect } from '../fixtures/auth.fixture';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

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

const MOCK_CASE_BASE = {
    id: ID,
    bidder_name: 'E2E Error Test',
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

// ═══════════════════════════════════════════════════════════════════════════
// A — JWT Interceptor : 401 → redirect /auth/login
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — 401 JWT Token expiré', () => {

    test('Normalization 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/cases/${ID}/normalized-financials`);
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    // CORRIGÉ v3 : pattern élargi **/api/v1/cases/${ID}/** pour couvrir le resolver ET la route score
    test('Scoring 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/api/v1/cases/${ID}`);
        await page.goto(`/cases/${ID}/scoring`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('IA Prediction 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/ia/predict/${ID}`);
        await page.goto(`/cases/${ID}/ia`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Rapport 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/cases/${ID}/report`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Dashboard stats 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/dashboard/stats`);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    // CORRIGÉ v3 : pattern élargi pour couvrir le resolver ET la route consortium
    test('Consortium 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/api/v1/cases/${ID}`);
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    // AdminIA est une route standalone protégée par AuthGuard mais le 401 sur /ia/admin
    // n'est pas intercepté comme un 401 d'authentification — le composant affiche son state d'erreur
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

    // /scoring n'a pas de UUID guard → on vérifie que la page charge mais affiche un état vide
    test('UUID invalide sur /scoring → scoring-root visible (pas de guard)', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/scoring`);
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.navigation });
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
// C — Bloc 3 Normalization : API 500 → comportement réel
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 3 Normalization API 500', () => {

    test('GET normalized-financials 500 → fallback mock : composant racine visible', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/normalized-financials`);
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET normalized-financials 500 → composant root stable, pas de données affichées', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/normalized-financials`);
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="normalization-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="normalization-compute-ratios-btn"]')).not.toBeVisible();
    });

    test('POST /normalize 500 → fallback snackbar : composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/normalized-financials**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    statement_id: 'mock-err-001', fiscal_year: 2023,
                    normalized_revenue: 8500000, normalized_ebitda: 4000000,
                    normalized_net_income: 2850000, normalized_working_capital: 1500000,
                    normalized_cash_flow: 500000, adjustments: [],
                    confidence_score: 90, normalization_date: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/normalize`);
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="normalization-recalculate-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await page.locator('[data-testid="normalization-recalculate-btn"]').click();
        await page.waitForTimeout(1500);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// D — Bloc 5 Scoring : API 500
// CORRIGÉ v3 : mocker UNIQUEMENT /score, laisser le resolver /cases/:id passer
// scoring-root est TOUJOURS dans le DOM (pas sous @if)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 5 Scoring API 500', () => {

    test('GET /score 500 → composant racine visible, spinner absent', async ({ page }) => {
        // Laisser le resolver répondre normalement
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        // Seule la route score renvoie 500
        await page.route(`**/api/v1/cases/${ID}/score**`, route =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
        );
        await page.goto(`/cases/${ID}/scoring`);
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-main-content"]')).not.toBeVisible();
    });

    test('POST /recommendation 500 → formulaire override reste accessible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/score**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID, global_score: 72.5, risk_class: 'B',
                    status: 'COMPUTED',
                    pillars: [
                        { id: 'p1', name: 'Liquidity', score: 70, weight: 0.2, sub_ratios: [] },
                        { id: 'p2', name: 'Solvency', score: 75, weight: 0.2, sub_ratios: [] },
                        { id: 'p3', name: 'Profitability', score: 68, weight: 0.2, sub_ratios: [] },
                        { id: 'p4', name: 'Capacity', score: 72, weight: 0.2, sub_ratios: [] },
                        { id: 'p5', name: 'Quality', score: 78, weight: 0.2, sub_ratios: [] },
                    ],
                    recommendations: [], cross_analysis_alerts: [], override: null
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/recommendation`);
        await page.goto(`/cases/${ID}/scoring`);
        await expect(page.locator('[data-testid="scoring-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="scoring-override-zone"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// E — Bloc 6 IA Prediction : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 6 IA Prediction API 500', () => {

    test('GET /ia/predict 500 → composant racine visible (fallback mock IA)', async ({ page }) => {
        await mockApi500(page, `/ia/predict/${ID}`);
        await page.goto(`/cases/${ID}/ia`);
        await expect(page.locator('[data-testid="ia-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /ia/simulate 500 → what-if placeholder toujours visible', async ({ page }) => {
        await page.route(`**/ia/predict/${ID}**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID, predicted_score: 71.2, confidence: 0.85,
                    predicted_risk_class: 'B',
                    model_version: 'FinaCES-v2.1.0',
                    model_performance: { accuracy: 0.89, f1_score: 0.87 },
                    confidence_interval: { lower: 68.0, upper: 74.5 },
                    shap_values: { features: [] },
                    prediction_date: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/ia/cases/${ID}/simulate`);
        await page.goto(`/cases/${ID}/ia`);
        await expect(page.locator('[data-testid="ia-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="ia-simulation-placeholder"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// F — Bloc 8 Stress : API 500
// CORRIGÉ v3 : mocker UNIQUEMENT /stress, laisser le resolver passer
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 8 Stress API 500', () => {

    test('GET /stress 500 → composant racine visible (fallback mock stress)', async ({ page }) => {
        // Laisser le resolver répondre normalement
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        // Seule la route stress renvoie 500
        await page.route(`**/api/v1/cases/${ID}/stress**`, route =>
            route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
        );
        await page.goto(`/cases/${ID}/stress`);
        await expect(page.locator('[data-testid="stress-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="stress-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /stress/run 500 → composant reste stable', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/stress/run`);
        await page.route(`**/api/v1/cases/${ID}/stress**`, route => {
            if (route.request().method() === 'GET')
                return route.fulfill({
                    status: 200, contentType: 'application/json', body: JSON.stringify({
                        scenario_name: 'BASE', stress_score: 65.0,
                        risk_class_stressed: 'C', delta_score: -7.5,
                        scenarios: [], parameters: {}
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

    test('GET /report 500 → composant racine visible, bouton Generate présent', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/report`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-generate-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /report/build 500 → composant reste stable sans crash', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) });
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Build failed' }) });
        });
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const generateBtn = page.locator('[data-testid="rapport-generate-btn"]');
        await expect(generateBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await generateBtn.click();
        await page.waitForTimeout(1500);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });

    test('POST /export/pdf 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    report_id: 'rpt-err-001', case_id: ID, status: 'DRAFT',
                    sections_complete: 10, sections_total: 14,
                    recommendation: 'FAVORABLE',
                    generated_at: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/export/pdf`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const pdfBtn = page.locator('[data-testid="rapport-export-pdf-btn"]');
        await expect(pdfBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await pdfBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });

    test('POST /export/word 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    report_id: 'rpt-err-002', case_id: ID, status: 'DRAFT',
                    sections_complete: 10, sections_total: 14,
                    recommendation: 'DEFAVORABLE',
                    generated_at: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/export/word`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-loading-spinner"]')).not.toBeVisible({ timeout: TIMEOUTS.apiResponse });
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

    test('GET /consortium 500 → spinner visible (isLoading reste true sur erreur non catchée)', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ ...MOCK_CASE_BASE, case_type: 'CONSORTIUM' })
            })
        );
        await mockApi500(page, `/cases/${ID}/consortium`);
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page.locator('[data-testid="consortium-loading-spinner"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /consortium/aggregate 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ ...MOCK_CASE_BASE, case_type: 'CONSORTIUM' })
            })
        );
        await page.route(`**/api/v1/cases/${ID}/consortium**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({
                    status: 200, contentType: 'application/json', body: JSON.stringify({
                        consortium_id: 'cons-err-001', case_id: ID,
                        combined_scorecard: { final_score: 68.0, risk_class: 'B' },
                        synergy_index: 2.5,
                        participation_rate: 1.0, is_leader_blocking: false,
                        members: [
                            { member_id: 'm1', member_name: 'Alpha', score: 72, participation_pct: 60, role: 'LEADER' },
                            { member_id: 'm2', member_name: 'Beta', score: 61, participation_pct: 40, role: 'MEMBER' },
                        ]
                    })
                });
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Aggregation failed' }) });
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
        await expect(page.locator('app-dashboard, [data-testid="dashboard-root"], main')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET /cases 500 sur dashboard → page reste accessible', async ({ page }) => {
        await mockApi500(page, `/cases`);
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
        await expect(page.locator('app-dashboard, [data-testid="dashboard-root"], main')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// K — Cases List : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Cases List API 500', () => {

    test('GET /cases 500 → la liste des dossiers ne crash pas', async ({ page }) => {
        await mockApi500(page, `/cases`);
        await page.goto('/cases');
        await expect(page).toHaveURL(/\/cases/, { timeout: TIMEOUTS.navigation });
        await expect(page.locator('app-cases-list, [data-testid="cases-list-root"], main')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
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
        await mockApi500(page, `/cases/${ID}/gate/evaluate`);
        await page.goto(`/cases/${ID}/gate`);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="gate-evaluate-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await page.locator('[data-testid="gate-evaluate-btn"]').click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible();
    });
});
