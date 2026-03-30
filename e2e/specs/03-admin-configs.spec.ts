import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { AdminIaPage } from '../pages/admin-ia.page';
import { IaAnalyticsPage } from '../pages/ia.page';
import { TEST_USER, TEST_CASE } from '../fixtures/test-data';

test.describe('FinaCES AI Operations — MLOps & Explainability', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
  });

  test('should validate AI Model Registry and Drift Alerts (IaDashboardData)', async ({ page }) => {
    const adminIaPage = new AdminIaPage(page);
    await adminIaPage.goto();

    // 1. Model Registry (IaModelInfo)
    await adminIaPage.verifyModelActive('v2.4.1-xgboost');
    
    // 2. Explainability (IaFeatureImportance / SHAP)
    await adminIaPage.verifyShapExplanations();
    await expect(page.getByTestId('shap-feature-score').first()).toContainText(/[+-]\d+/);

    // 3. MLOps Monitoring (IaMonitoringAlert)
    await adminIaPage.verifyDriftAlertsAvailable();
    const alertLabel = await page.getByTestId('alert-type-label').first().innerText();
    expect(alertLabel).toMatch(/DATA_DRIFT|CONCEPT_DRIFT|ANOMALY/);
  });

  test('should execute a What-If Scenario Simulation', async ({ page }) => {
    const iaPage = new IaAnalyticsPage(page);
    // Navigate to an existing IA prediction (Seeded)
    await page.goto(`/cases/${TEST_CASE.marketReference}/ia-prediction`);

    // 1. Ensure original prediction is visible
    await iaPage.verifyAiPredictionVisible();

    // 2. Perform a What-If adjustment
    // Target the first feature row to move the slider
    const featureRow = page.getByTestId('what-if-feature-row').first();
    await expect(featureRow).toBeVisible();
    
    // Click 'Run Simulation'
    const simulateBtn = page.getByTestId('btn-what-if-run');
    await simulateBtn.click();

    // 3. Verify scenario completion (Success toast or score change)
    await expect(page.getByText(/Simulation complete|Simulation applied/i)).toBeVisible();
  });
});
