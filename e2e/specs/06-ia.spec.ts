import { test, expect } from '../fixtures/auth.fixture';
import { IaPage } from '../pages/ia.page';
import { TensionPage } from '../pages/tension.page';
import { TEST_CASE, TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

// ─── IAPredictionResult (interface legacy consommée par le template) ────────
// Le composant cast le forkJoin résultat via "as unknown as IAPredictionResult"
// → le mock doit fournir les champs que le TEMPLATE accède réellement :
//   - predicted_score, predicted_risk_class, confidence_interval
//   - model_performance, disclaimer, shap_values.features, feature_importance
const MOCK_IA = {
    case_id:              TEST_CASE_ID,
    model_version:        'e2e-stub-v1.0',
    prediction_timestamp: '2024-01-15T10:00:00Z',
    predicted_score:      2.4,
    predicted_risk_class: 'HIGH',
    confidence_interval:  { lower: 2.1, upper: 2.7 },
    model_performance:    { auc_roc: 0.89, accuracy: 0.85, f1_score: 0.82 },
    disclaimer:           'Ce score est fourni à titre indicatif uniquement.',
    feature_importance:   [],
    shap_values: {
        base_value:         3.0,
        total_contribution: -0.6,
        features: [
            { feature_name: 'Dette / Capitaux propres', feature_value: '4.2',  shap_value:  0.8, direction: 'positive', magnitude: 0.8 },
            { feature_name: 'Marge EBITDA',             feature_value: '8.4%', shap_value: -0.5, direction: 'negative', magnitude: 0.5 },
            { feature_name: 'Cash-flow operationnel',   feature_value: '1.2M', shap_value:  0.3, direction: 'positive', magnitude: 0.3 },
        ],
    },
};

// IAModelInfo — aligné sur l'interface du service ia.service.ts
const MOCK_MODEL = {
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

// WhatIfResult — aligné sur l'interface réelle (predicted_score_if, predicted_class_if)
const MOCK_IA_SIMULATION = {
    scenario_name:       'e2e-what-if-scenario',
    predicted_score_if:  3.1,
    predicted_class_if:  'MODERATE',
    delta_score:         0.7,
    feature_impacts:     [],
};

const MOCK_TENSION_BASE = {
    mcc_score: 3.2,
    ia_score: 72.5,
    delta: 0.2,
    pillars: [],
};

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 6 IA Prediction', () => {

    test.beforeEach(async ({ page }) => {
        // ÉTAPE 1 — Tous les mocks AVANT goto()
        await page.route(API_ENDPOINTS.iaPredict(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/ia/models/active**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MODEL) })
        );
        await page.route(API_ENDPOINTS.iaSimulate(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA_SIMULATION) })
        );

        // ÉTAPE 2 — Navigation APRÈS les mocks
        await page.goto(`/cases/${TEST_CASE_ID}/ia`);

        // ÉTAPE 3 — Attendre stabilisation réseau
        await page.waitForLoadState('networkidle');

        // ÉTAPE 4 — Attendre le composant racine du bloc (root container) + disclaimer IA (données chargées)
        await expect(page.getByTestId('ia-root')).toBeVisible({ timeout: TIMEOUTS.navigation });
        await expect(page.getByTestId('ia-disclaimer-banner')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('La page IA se charge et affiche la carte de score predit', async ({ page }) => {
        const iaPage = new IaPage(page);
        await expect(iaPage.predictedScoreCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('Le disclaimer IA est affiche', async ({ page }) => {
        const iaPage = new IaPage(page);
        await expect(iaPage.disclaimerBanner).toBeVisible();
    });

    test('La carte SHAP est visible', async ({ page }) => {
        const iaPage = new IaPage(page);
        await expect(iaPage.shapChartCard).toBeVisible();
    });

    test('Le placeholder de simulation est visible (avant simulation)', async ({ page }) => {
        const iaPage = new IaPage(page);
        await expect(iaPage.simulationPlaceholder).toBeVisible();
    });

    // -----------------------------------------------------------------------
    // What-if : route réelle = POST /ia/cases/{case_id}/simulate
    // Le template affiche TOUJOURS les deux zones en parallele
    // (whatIfCard = formulaire de saisie, simulationPlaceholder = zone resultat)
    // Les deux coexistent dans le DOM : pas de bascule @if exclusive.
    // On verifie uniquement que whatIfCard est bien rendu.
    // -----------------------------------------------------------------------
    test('What-if — la simulation retourne un score different et masque le placeholder', async ({ page }) => {
        const iaPage = new IaPage(page);

        await expect(iaPage.mainContent).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(iaPage.whatIfCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Coexistence des deux zones : whatIfCard ET simulationPlaceholder
    // sont tous les deux rendus simultanement dans le template.
    // -----------------------------------------------------------------------
    test('What-if — whatIfCard et simulationPlaceholder coexistent dans le template', async ({ page }) => {
        const iaPage = new IaPage(page);

        // Les deux zones sont visibles en meme temps
        await expect(iaPage.whatIfCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(iaPage.simulationPlaceholder).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Navigation IA -> Tension
    // -----------------------------------------------------------------------
    test('Navigation — le bouton Proceed navigue vers /tension', async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/tension**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_TENSION_BASE) })
        );
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: TEST_CASE_ID }) })
        );

        const iaPage = new IaPage(page);
        const tensionPage = new TensionPage(page);

        await expect(iaPage.predictedScoreCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });

        await iaPage.clickProceedToTension();
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/tension`),
            { timeout: TIMEOUTS.navigation }
        );
        await tensionPage.expectPageLoaded();
    });

    test('Navigation — le bouton Back navigue hors de /ia', async ({ page }) => {
        const iaPage = new IaPage(page);

        await expect(iaPage.predictedScoreCard).toBeVisible({ timeout: TIMEOUTS.apiResponse });

        await iaPage.clickBack();
        await expect(page).not.toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ia`),
            { timeout: TIMEOUTS.navigation }
        );
    });

});
