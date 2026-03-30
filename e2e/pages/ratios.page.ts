import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Ratios Page Object
 * Handles Launch Scoring process.
 */
export class RatiosPage {
  readonly page: Page;
  readonly launchScoringBtn: Locator;
  readonly ratiosContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.launchScoringBtn = page.getByTestId('btn-launch-scoring');
    this.ratiosContainer = page.getByTestId('ratios-container');
  }

  async launchScoring() {
    await expect(this.ratiosContainer).toBeVisible();
    await this.launchScoringBtn.click();
    // Wait for the next stage (Scoring MCC) URL
    await this.page.waitForURL(/.*\/scoring-mcc/);
  }
}
