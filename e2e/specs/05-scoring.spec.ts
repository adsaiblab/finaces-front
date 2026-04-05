import { test, expect } from '../fixtures/auth.fixture';
import { ScoringPage } from '../pages/scoring.page';
import { IaPage } from '../pages/ia.page';
import { TEST_CASE, TIMEOUTS, API_ENDPOINTS } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

// ScoringMccSchema — aligné sur l'interface réelle du composant
const MOCK_SCORING = {
    case_id:            TEST_CASE_ID,
    global_score:       3.2,
    risk_class:         'MODERATE',
    calculation_date:   '2024-01-15T10:00:00Z',
    status:             'COMPUTED',       // ← CRITIQUE : utilisé par le template pour le badge
    cross_analysis_alerts: [],
    recommendations: [
        {
            id:      'rec-001',
            type:    'WARNING',
            message: 'Surveiller la trésorerie',
        },
    ],
    pillars: [
        {
            id:          'liquidity',
            name:        'Liquidité',
            score:       3.0,
            weight:      0.25,
            trend:       'STABLE',         // ← 'IMPROVING' | 'STABLE' | 'DETERIORATING' | null
            status:      'FAIR',           // ← 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL'
            key_drivers: ['Ratio courant satisfaisant'],
            signals:     ['Ratio courant satisfaisant'],
            detail_text: 'Liquidité correcte',
        },
        {
            id:          'solvency',
            name:        'Solvabilité',
            score:       3.0,
            weight:      0.25,
            trend:       'STABLE',
            status:      'FAIR',
            key_drivers: ['Endettement maîtrisé'],
            signals:     ['Endettement maîtrisé'],
            detail_text: 'Solvabilité correcte',
        },
    ],
};

const MOCK_SCORING_OVERRIDE = {
    ...MOCK_SCORING,
    global_score: 3.8,
    risk_class:   'HIGH',
    status:       'OVERRIDDEN',   // ← CRITIQUE : 'SURCLASSÉ MANUELLEMENT' dans le template
    override: {
        original_score:      3.2,
        new_score:           3.8,
        original_risk_class: 'MODERATE',
        new_risk_class:      'HIGH',
        reason:              'Override justifié — secteur stratégique',
        author:              'Analyste senior',
        timestamp:           '2024-01-15T11:00:00Z',
    },
};

// IAPredictionOut — aligné sur l'interface du service ia.service.ts
const MOCK_IA = {
    id:                      'mock-ia-pred-001',
    case_id:                 TEST_CASE_ID,
    ia_score:                2.4,
    ia_risk_class:           'HIGH',
    ia_probability_default:  0.18,
    threshold_info:          'Score > 2.0 → RISQUE ÉLEVÉ',
    predicted_at:            '2024-01-15T10:00:00Z',
    explanations: {
        top_features: [
            { feature_name: 'Dette / Capitaux propres', feature_value: 4.2,  shap_value:  0.8, impact: 0.8, direction: 'positive', magnitude: 'HIGH'     },
            { feature_name: 'Marge EBITDA',             feature_value: 0.084, shap_value: -0.5, impact: 0.5, direction: 'negative', magnitude: 'MODERATE' },
        ],
        explanation_method: 'SHAP',
        base_value:         3.0,
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

// ---------------------------------------------------------------------------
// ETAT NOMINAL
// ---------------------------------------------------------------------------
test.describe('Isolation — Bloc 5 Scoring MCC', () => {

    test.beforeEach(async ({ page }) => {
        // ÉTAPE 1 — Tous les mocks AVANT goto()
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING) })
        );

        // ÉTAPE 2 — Navigation APRÈS les mocks
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);

        // ÉTAPE 3 — Attendre stabilisation réseau
        await page.waitForLoadState('networkidle');

        // ÉTAPE 4 — Attendre le composant racine du bloc (root container) + badge de statut (données chargées)
        await expect(page.getByTestId('scoring-root')).toBeVisible({ timeout: TIMEOUTS.navigation });
        await expect(page.getByTestId('scoring-status-badge')).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('Le Score Global et la Risk Class sont affiches', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await expect(scoringPage.globalScoreCard).toBeVisible();
        await expect(scoringPage.riskClassCard).toBeVisible();
    });

    // Le template Angular affiche "CALCULÉ AUTOMATIQUEMENT" quand status === 'COMPUTED'
    test('Le badge de statut CALCULE AUTOMATIQUEMENT est affiche', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await expect(scoringPage.statusBadge).toContainText('CALCULÉ AUTOMATIQUEMENT');
    });

    test('La grille des pilliers est visible', async ({ page }) => {
        const scoringPage = new ScoringPage(page);
        await expect(scoringPage.pillarsGrid).toBeVisible();
    });

    test('Override — la zone override est visible et le mock retourne status OVERRIDE', async ({ page }) => {
        const scoringPage = new ScoringPage(page);

        await page.route(API_ENDPOINTS.score(TEST_CASE_ID) + '?override=true', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING_OVERRIDE) })
        );

        // Re-navigation nécessaire car on a changé le mock de l'URL avec les params
        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc?override=true`);
        await page.waitForLoadState('networkidle');

        await expect(scoringPage.overrideZone).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Le template affiche "SURCLASSÉ MANUELLEMENT" quand status === 'OVERRIDDEN'
    // Valeur exacte du template : data.status === 'OVERRIDDEN' ? 'SURCLASSÉ MANUELLEMENT'
    // -----------------------------------------------------------------------
    test('Override — le badge SURCLASSE MANUELLEMENT est affiche quand override est actif (mock direct)', async ({ page }) => {
        const scoringPage = new ScoringPage(page);

        await page.unroute(API_ENDPOINTS.score(TEST_CASE_ID));
        await page.route(API_ENDPOINTS.score(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SCORING_OVERRIDE) })
        );

        await page.goto(`/cases/${TEST_CASE_ID}/scoring-mcc`);
        await page.waitForLoadState('networkidle');

        // Le template affiche "SURCLASSÉ MANUELLEMENT" (valeur exacte du DOM Angular)
        await expect(scoringPage.statusBadge).toContainText('SURCLASSÉ MANUELLEMENT', { timeout: TIMEOUTS.apiResponse });
    });

    // -----------------------------------------------------------------------
    // Navigation Scoring -> IA
    // -----------------------------------------------------------------------
    test('Navigation — le bouton Proceed navigue vers /ia', async ({ page }) => {
        await page.route(API_ENDPOINTS.iaPredict(TEST_CASE_ID), route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_IA) })
        );
        await page.route(`**/api/v1/ia/models/active**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_MODEL) })
        );

        const scoringPage = new ScoringPage(page);
        const iaPage = new IaPage(page);

        // Enregistrer la réponse IA AVANT de cliquer
        const iaResp = page.waitForResponse(
            (r: any) => r.url().includes('ia/predict') && r.status() === 200
        );
        await scoringPage.clickProceedToIA();

        // Attendre la navigation et la stabilisation réseau
        await expect(page).toHaveURL(
            new RegExp(`/cases/${TEST_CASE_ID}/ia`),
            { timeout: TIMEOUTS.navigation }
        );
        await page.waitForLoadState('networkidle');

        // Attendre le composant racine IA (toujours visible, pas conditionnel)
        await iaPage.expectPageLoaded();

        // Attendre que la réponse IA ait bien été reçue
        await iaResp;

        // Vérifier que le contenu principal IA est rendu (dans @if(!isLoading() && !predictionError()))
        await expect(iaPage.mainContent).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

});
