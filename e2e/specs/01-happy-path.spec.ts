import { test, expect } from '@playwright/test';
import { NormalizationPage } from '../pages/normalization.page';
import { RatiosPage } from '../pages/ratios.page';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { RapportPage } from '../pages/rapport.page';

// ─── CONSTANTES DE TEST ──────────────────────────────────────────────────────
// Utiliser un caseId existant dans votre environnement de test.
// Si vous utilisez storageState pour l'auth, ce caseId doit appartenir à l'user connecté.
const TEST_CASE_ID = 'TEST-CASE-001';

// ─── MOCK PAYLOADS ───────────────────────────────────────────────────────────
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

const MOCK_IA_PREDICTION = {
    case_id: TEST_CASE_ID,
    predicted_score: 68,
    predicted_risk_class: 'B',
    model_version: 'v2.1-mock',
    model_performance: { accuracy: 0.87, precision: 0.85, recall: 0.88 },
    confidence_interval: { lower: 62.5, upper: 73.5 },
    shap_values: { features: [] },
};

const MOCK_TENSION = {
    case_id: TEST_CASE_ID,
    scenarios: [],
    status: 'COMPUTED',
};

const MOCK_STRESS = {
    case_id: TEST_CASE_ID,
    stress_results: [],
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
};

// ─── HELPER : Setup de tous les mocks API pour un cas donné ──────────────────
async function setupApiMocks(page: any, caseId: string) {
    // Bloc 3 - Normalization
    await page.route(`**/api/v1/cases/${caseId}/normalization**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NORMALIZATION) })
    );
    // Bloc 4 - Ratios
    await page.route(`**/api/v1/cases/${caseId}/ratios**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RATIOS) })
    );
    // Bloc 5 - Scoring MCC
    await page.route(`**/api/v1/cases/${caseId}/scoring**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
    );
    // Bloc 6 - IA Prediction (peut être /prediction, /ia, /ai — on couvre large)
    await page.route(`**/api/v1/cases/${caseId}/prediction**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) })
    );
    await page.route(`**/api/v1/cases/${caseId}/ia**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_PREDICTION) })
    );
    // Bloc 7 - Tension
    await page.route(`**/api/v1/cases/${caseId}/tension**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TENSION) })
    );
    // Bloc 8 - Stress
    await page.route(`**/api/v1/cases/${caseId}/stress**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STRESS) })
    );
    // Bloc 9 - Expert
    await page.route(`**/api/v1/cases/${caseId}/expert**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXPERT) })
    );
    // Bloc 10 - Rapport (génération + récupération)
    await page.route(`**/api/v1/cases/${caseId}/report**`, (route: any) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RAPPORT) })
    );
    // Wildcard sécurité : capture tout autre appel vers ce case pour éviter les 404/400 bloquants
    await page.route(`**/api/v1/cases/${caseId}/**`, (route: any) => {
        // Laisser passer les routes déjà mockées, intercepter le reste
        route.continue();
    });
}

// ─── SUITE HAPPY PATH ────────────────────────────────────────────────────────
test.describe('Happy Path — FinaCES V1.2 E2E (Blocs 3→10)', () => {

    // L'utilisateur doit être authentifié. Assurez-vous que playwright.config.ts
    // pointe vers un storageState valide (ex: e2e/auth/session.json).
    test.use({ storageState: 'e2e/auth/session.json' });

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

    test('Bloc 5 — Scoring MCC : la page se charge et affiche le score global et la risk class', async ({ page }) => {
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
    });

    test('Bloc 8 — Stress Test : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const stressPage = new StressPage(page);

        await page.goto(`/cases/${TEST_CASE_ID}/stress`);
        await stressPage.expectPageLoaded();
    });

    test('Bloc 9 — Expert Opinion : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const expertPage = new ExpertPage(page);

        await page.goto(`/cases/${TEST_CASE_ID}/expert`);
        await expertPage.expectPageLoaded();
    });

    test('Bloc 10 — Rapport Final : le composant racine est visible', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const rapportPage = new RapportPage(page);

        await page.goto(`/cases/${TEST_CASE_ID}/rapport`);
        await rapportPage.expectPageLoaded();
    });

    // ─── TEST INTÉGRÉ : Vérification de la chaîne de navigation (minimal) ────
    test('Navigation chain — Scoring vers IA via bouton Proceed (avec mock)', async ({ page }) => {
        await setupApiMocks(page, TEST_CASE_ID);
        const scoringPage = new ScoringPage(page);
        const iaPage = new IaPage(page);

        // Navigation directe au scoring (évite la dépendance aux étapes précédentes)
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await scoringPage.expectScoringDisplayed();

        // Click sur "Proceed to AI Analysis" — le mock /prediction est déjà en place
        await scoringPage.clickProceedToIA();

        // Vérification que l'on atterrit bien sur la page IA
        await iaPage.expectPageLoaded();
        await iaPage.expectPredictionDisplayed();
    });

});