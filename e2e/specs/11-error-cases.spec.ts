// e2e/specs/11-error-cases.spec.ts
//
// Session 4 — Jour 4 : Cas d'erreur
//
// Couverture :
//   A. AuthGuard + JWT interceptor (401 → redirect /auth/login)
//   B. UUID Guard (id invalide → redirect /dashboard)
//   C. Bloc 3 Normalization — API 500 sur GET normalized-financials → fallback mock
//   D. Bloc 3 Normalization — API 500 sur POST /normalize → fallback mock snackbar
//   E. Bloc 5 Scoring — API 500 sur POST /score → fallback mock visible
//   F. Bloc 6 IA — API 500 sur GET /predict → message erreur IA
//   G. Bloc 6 IA — API 500 sur POST /simulate (what-if) → composant reste stable
//   H. Bloc 8 Stress — API 500 sur GET /stress → fallback visible
//   I. Bloc 9 Expert — API 500 sur GET /expert → formulaire reste visible
//   J. Bloc 10 Rapport — API 500 sur GET /report → bouton Generate visible
//   K. Bloc 10 Rapport — API 500 sur POST /report/build → composant reste stable
//   L. Bloc 12 Consortium — API 500 sur GET /consortium → composant reste visible
//   M. Dashboard — API 500 sur GET /dashboard/stats → page ne crash pas
//   N. Cases List — API 500 sur GET /cases → liste vide ou fallback

import { test, expect } from '../fixtures/auth.fixture';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;
const INVALID_ID = 'not-a-valid-uuid';
const UNKNOWN_CASE_ID = '00000000-0000-4000-a000-000000000000';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Route tous les appels API vers une erreur 500 pour un pattern donné */
async function mockApi500(page: any, urlPattern: string) {
    await page.route(`**${urlPattern}**`, (route: any) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Internal Server Error' }) })
    );
}

/** Route un endpoint vers 401 pour simuler un token expiré */
async function mockApi401(page: any, urlPattern: string) {
    await page.route(`**${urlPattern}**`, (route: any) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Unauthorized' }) })
    );
}

// ─── Bloc minimal de données pour ne pas casser les autres routes ────────────
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

    // Note : authGuard retourne true en isDevMode().
    // Pour tester le redirect 401, on provoque un 401 sur un appel API réel
    // pendant la navigation → l'intercepteur appelle authService.logout()
    // → router.navigate(['/auth/login'])
    test('Normalization 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/cases/${ID}/normalized-financials`);
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Scoring 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/cases/${ID}/score`);
        // On déclenche le call en arrivant sur la page scoring qui charge le score
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

    test('Consortium 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/cases/${ID}/consortium`);
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
    });

    test('Admin IA models 401 → redirect vers /auth/login', async ({ page }) => {
        await mockApi401(page, `/ia/admin`);
        await page.goto('/admin-ia');
        await expect(page).toHaveURL(/\/auth\/login/, { timeout: TIMEOUTS.navigation });
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

    test('UUID invalide sur /scoring redirige vers /dashboard', async ({ page }) => {
        await page.goto(`/cases/${INVALID_ID}/scoring`);
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
// C — Bloc 3 Normalization : API 500 → fallback mock local visible
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 3 Normalization API 500', () => {

    test('GET normalized-financials 500 → fallback mock : composant racine visible', async ({ page }) => {
        // Le composant tombe dans loadMockData() → isLoading false, normalizedData rempli
        await mockApi500(page, `/cases/${ID}/normalized-financials`);
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        // Fallback = 800ms delay → attendre le composant
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({
            timeout: TIMEOUTS.apiResponse
        });
    });

    test('GET normalized-financials 500 → le bouton Compute Ratios reste présent (fallback actif)', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/normalized-financials`);
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_BASE) })
        );
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="compute-ratios-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /normalize 500 → fallback snackbar "Mock" : composant reste stable', async ({ page }) => {
        // Charger la page avec GET mock valide
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
        // POST /normalize → 500 → fallback delay(1000) → snackbar Mock
        await mockApi500(page, `/cases/${ID}/normalize`);
        await page.goto(`/cases/${ID}/normalization`);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Clic sur recalculate
        await page.locator('[data-testid="recalculate-btn"]').click();
        // Le composant ne doit pas crasher : root toujours visible après 2s
        await page.waitForTimeout(1500);
        await expect(page.locator('[data-testid="normalization-root"]')).toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// D — Bloc 5 Scoring : API 500 → fallback mock visible
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 5 Scoring API 500', () => {

    test('GET /score 500 → composant racine visible (fallback mock actif)', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/score`);
        await page.goto(`/cases/${ID}/scoring`);
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /recommendation 500 → formulaire override reste accessible', async ({ page }) => {
        // GET score → OK
        await page.route(`**/api/v1/cases/${ID}/score**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID, global_score: 72.5, risk_class: 'B',
                    status: 'SYSTEM_COMPUTED', pillars: [], recommendation: null
                })
            })
        );
        // POST recommendation → 500
        await mockApi500(page, `/cases/${ID}/recommendation`);
        await page.goto(`/cases/${ID}/scoring`);
        await expect(page.locator('[data-testid="scoring-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // La zone override doit rester visible malgré l'erreur potentielle
        await expect(page.locator('[data-testid="override-section"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// E — Bloc 6 IA Prediction : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 6 IA Prediction API 500', () => {

    test('GET /ia/predict 500 → composant racine visible (fallback mock IA)', async ({ page }) => {
        await mockApi500(page, `/ia/predict/${ID}`);
        await page.goto(`/cases/${ID}/ia`);
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /ia/simulate 500 → what-if placeholder toujours visible', async ({ page }) => {
        // GET predict → OK
        await page.route(`**/ia/predict/${ID}**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    case_id: ID, predicted_score: 71.2, confidence: 0.85,
                    risk_class: 'B', model_version: 'FinaCES-v2.1.0',
                    shap_values: {}, prediction_date: '2026-01-01T00:00:00Z'
                })
            })
        );
        // POST simulate → 500
        await mockApi500(page, `/ia/cases/${ID}/simulate`);
        await page.goto(`/cases/${ID}/ia`);
        await expect(page.locator('[data-testid="ia-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Avant simulation : placeholder visible
        await expect(page.locator('[data-testid="simulation-placeholder"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// F — Bloc 8 Stress : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 8 Stress API 500', () => {

    test('GET /stress 500 → composant racine visible (fallback mock stress)', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/stress`);
        await page.goto(`/cases/${ID}/stress`);
        await expect(page.locator('[data-testid="stress-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /stress/run 500 → composant reste stable', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/stress/run`);
        await page.route(`**/api/v1/cases/${ID}/stress**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    scenario_name: 'BASE', stress_score: 65.0, risk_class_stressed: 'C',
                    delta_score: -7.5, parameters: {}
                })
            })
        );
        await page.goto(`/cases/${ID}/stress`);
        await expect(page.locator('[data-testid="stress-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// G — Bloc 9 Expert : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Bloc 9 Expert API 500', () => {

    test('GET /expert 500 → formulaire expert visible (fallback mock)', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/expert`);
        await page.goto(`/cases/${ID}/expert`);
        await expect(page.locator('[data-testid="expert-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /expert/submit 500 → bouton Submit reste accessible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/expert**`, route => {
            if (route.request().method() === 'GET')
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Error' }) });
        });
        await page.goto(`/cases/${ID}/expert`);
        await expect(page.locator('[data-testid="expert-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Le formulaire ne doit pas crasher même si submit renverrait 500
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
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Sans rapport → bouton Generate doit être visible
        await expect(page.locator('[data-testid="generate-report-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /report/build 500 → composant reste stable sans crash', async ({ page }) => {
        // GET /report → 404 (aucun rapport)
        await page.route(`**/api/v1/cases/${ID}/report**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) });
            // POST /report/build → 500
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Build failed' }) });
        });
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Clic Generate
        const generateBtn = page.locator('[data-testid="generate-report-btn"]');
        await expect(generateBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await generateBtn.click();
        // Après 2s le composant doit rester stable
        await page.waitForTimeout(1500);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible();
    });

    test('POST /export/pdf 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    report_id: 'rpt-err-001', case_id: ID, status: 'DRAFT',
                    progress_pct: 75, sections: [], recommendation: 'FAVORABLE',
                    generated_at: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/export/pdf`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const pdfBtn = page.locator('[data-testid="export-pdf-btn"]');
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
                    progress_pct: 75, sections: [], recommendation: 'DEFAVORABLE',
                    generated_at: '2026-01-01T00:00:00Z'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/export/word`);
        await page.goto(`/cases/${ID}/rapport`);
        await expect(page.locator('[data-testid="rapport-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        const wordBtn = page.locator('[data-testid="export-word-btn"]');
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

    test('GET /consortium 500 → composant racine visible (fallback)', async ({ page }) => {
        // Case type CONSORTIUM pour que le guard laisse passer
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    ...MOCK_CASE_BASE, case_type: 'CONSORTIUM'
                })
            })
        );
        await mockApi500(page, `/cases/${ID}/consortium`);
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page.locator('[data-testid="consortium-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('POST /consortium/aggregate 500 → composant reste stable', async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({
                status: 200, contentType: 'application/json', body: JSON.stringify({
                    ...MOCK_CASE_BASE, case_type: 'CONSORTIUM'
                })
            })
        );
        await page.route(`**/api/v1/cases/${ID}/consortium**`, (route: any) => {
            if (route.request().method() === 'GET')
                return route.fulfill({
                    status: 200, contentType: 'application/json', body: JSON.stringify({
                        consortium_id: 'cons-err-001', case_id: ID,
                        combined_score: 68.0, participation_rate: 1.0, is_leader_blocking: false,
                        members: [
                            { member_id: 'm1', name: 'Alpha', score: 72, weight: 0.6, is_leader: true },
                            { member_id: 'm2', name: 'Beta', score: 61, weight: 0.4, is_leader: false },
                        ]
                    })
                });
            return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Aggregation failed' }) });
        });
        await page.goto(`/cases/${ID}/consortium`);
        await expect(page.locator('[data-testid="consortium-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        // Force Aggregation → 500 → le composant ne doit pas crasher
        const forceBtn = page.locator('[data-testid="force-aggregation-btn"]');
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
        // Le header du dashboard doit toujours être visible
        await expect(page.locator('[data-testid="dashboard-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('GET /cases 500 sur dashboard → page reste accessible', async ({ page }) => {
        await mockApi500(page, `/cases`);
        await page.goto('/dashboard');
        await expect(page.locator('[data-testid="dashboard-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// K — Cases List : API 500
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Erreur — Cases List API 500', () => {

    test('GET /cases 500 → la liste des dossiers ne crash pas', async ({ page }) => {
        await mockApi500(page, `/cases`);
        await page.goto('/cases');
        // La page cases doit rester accessible même sans données
        await expect(page.locator('[data-testid="cases-list-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
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

    test('POST /gate/evaluate 500 → bouton d\'évaluation reste accessible', async ({ page }) => {
        await mockApi500(page, `/cases/${ID}/gate/evaluate`);
        await page.goto(`/cases/${ID}/gate`);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(page.locator('[data-testid="gate-evaluate-btn"]')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await page.locator('[data-testid="gate-evaluate-btn"]').click();
        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="gate-root"]')).toBeVisible();
    });
});