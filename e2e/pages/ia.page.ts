import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * IA Analytics Page Object
 * Handles AI predicted scores and What-If simulations.
 */
export class IaAnalyticsPage {
  readonly page: Page;
  readonly aiScoreGauge: Locator;
  readonly whatIfRunBtn: Locator;
  readonly proceedToTensionBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.aiScoreGauge = page.getByTestId('ai-score-gauge');
    this.whatIfRunBtn = page.getByTestId('btn-what-if-run');
    this.proceedToTensionBtn = page.getByTestId('btn-proceed-to-tension');
  }

  async verifyAiPredictionVisible() {
    await expect(this.aiScoreGauge).toBeVisible();
  }

  async proceedToTension() {
    await this.proceedToTensionBtn.click();
    await this.page.waitForURL(/.*\/tension/);
  }
}
