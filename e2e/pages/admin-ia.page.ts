import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * AI Admin Page Object
 * Handles MLOps monitoring, drift alerts, and model explainability.
 */
export class AdminIaPage {
  readonly page: Page;
  readonly modelRows: Locator;
  readonly alertItems: Locator;
  readonly shapFeatureNames: Locator;
  readonly shapFeatureScores: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modelRows = page.getByTestId('model-row');
    this.alertItems = page.getByTestId('monitoring-alert-item');
    this.shapFeatureNames = page.getByTestId('shap-feature-name');
    this.shapFeatureScores = page.getByTestId('shap-feature-score');
  }

  async goto() {
    await this.page.goto(`${FRONTEND_BASE_URL}/admin-ia`);
  }

  async verifyModelActive(version: string) {
    const row = this.modelRows.filter({ hasText: version });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('model-status')).toContainText('ACTIVE');
  }

  async verifyDriftAlertsAvailable() {
    await expect(this.alertItems.first()).toBeVisible();
  }

  async verifyShapExplanations() {
    await expect(this.shapFeatureNames.first()).toBeVisible();
    await expect(this.shapFeatureScores.first()).toBeVisible();
  }
}
