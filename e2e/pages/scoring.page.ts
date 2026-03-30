import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Scoring MCC Page Object
 * Handles global score display and transition to AI Analysis.
 */
export class ScoringPage {
  readonly page: Page;
  readonly globalScoreGauge: Locator;
  readonly riskClassBadge: Locator;
  readonly proceedToAiBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.globalScoreGauge = page.getByTestId('global-score-gauge');
    this.riskClassBadge = page.getByTestId('risk-class-badge');
    this.proceedToAiBtn = page.getByTestId('btn-proceed-to-ai');
  }

  async verifyGlobalScoreVisible() {
    await expect(this.globalScoreGauge).toBeVisible();
  }

  async proceedToAi() {
    await this.proceedToAiBtn.click();
    await this.page.waitForURL(/.*\/ia-prediction/);
  }
}
