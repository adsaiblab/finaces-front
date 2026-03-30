import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Stress Test Page Object
 * Handles cash flow simulations and transition to expert review.
 */
export class StressPage {
  readonly page: Page;
  readonly runSimulationBtn: Locator;
  readonly proceedToExpertBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.runSimulationBtn = page.getByTestId('btn-run-simulation');
    this.proceedToExpertBtn = page.getByTestId('btn-proceed-to-expert');
  }

  async runSimulation() {
    await this.runSimulationBtn.click();
    // Wait for simulation to finish (spinner inside button)
    await expect(this.runSimulationBtn).toBeEnabled({ timeout: 15000 });
  }

  async proceedToExpert() {
    await this.proceedToExpertBtn.click();
    await this.page.waitForURL(/.*\/expert-review/);
  }
}
