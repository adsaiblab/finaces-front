import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Consortium Page Object
 * Handles multi-bidder management and structural synergy.
 */
export class ConsortiumPage {
  readonly page: Page;
  readonly addMemberBtn: Locator;
  readonly recalculateBtn: Locator;
  readonly validateBtn: Locator;
  readonly finalScoreBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addMemberBtn = page.getByTestId('btn-add-member');
    this.recalculateBtn = page.getByTestId('btn-recalculate-consortium');
    this.validateBtn = page.getByTestId('btn-validate-consortium');
    this.finalScoreBadge = page.getByTestId('consortium-final-score');
  }

  async addMember(name: string, share: number) {
    await this.addMemberBtn.click();
    // Assuming a dialog pops up
    await this.page.fill('input[placeholder="Company Name"]', name);
    await this.page.fill('input[type="number"]', share.toString());
    await this.page.click('button:has-text("Save")');
  }

  async validateStructuralAnalysis() {
    await expect(this.validateBtn).toBeEnabled();
    await this.validateBtn.click();
    await this.page.waitForURL(/.*\/stress-test/);
  }
}
