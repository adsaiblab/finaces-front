import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Tension Page Object
 * Handles coherence checks and analyst final decision.
 */
export class TensionPage {
  readonly page: Page;
  readonly tensionBanner: Locator;
  readonly decisionForm: Locator;
  readonly submitDecisionBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tensionBanner = page.getByTestId('tension-banner');
    this.decisionForm = page.getByTestId('analyst-decision-form');
    // The button might be inside the form component
    this.submitDecisionBtn = page.locator('button[type="submit"]'); 
  }

  async verifyTensionBannerVisible() {
    await expect(this.tensionBanner).toBeVisible();
  }

  async submitDecision(decision: 'APPROVE' | 'REJECT' | 'FURTHER_INFO') {
    // Select the decision (assuming a radio group or select inside analyst-decision-form)
    // Note: If the component uses mat-radio-group or similar, we target it
    await this.page.click(`text=${decision}`);
    await this.submitDecisionBtn.click();
    await this.page.waitForURL(/.*\/stress-test/);
  }
}
