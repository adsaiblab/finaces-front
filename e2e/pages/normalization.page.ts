import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Normalization Page Object
 * Handles financial data normalization and ratio computation.
 */
export class NormalizationPage {
  readonly page: Page;
  readonly recalculateBtn: Locator;
  readonly computeRatiosBtn: Locator;
  readonly fiscalYearBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recalculateBtn = page.getByTestId('btn-recalculate');
    this.computeRatiosBtn = page.getByTestId('btn-compute-ratios');
    this.fiscalYearBadge = page.getByTestId('fiscal-year-badge');
  }

  async goto(caseId: string) {
    await this.page.goto(`${FRONTEND_BASE_URL}/cases/${caseId}/normalization`);
  }

  async recalculate() {
    await this.recalculateBtn.click();
    // Wait for spinner to disappear (implicit in click if button is disabled during recalculate)
    await expect(this.recalculateBtn).toBeEnabled();
  }

  async computeRatios() {
    await expect(this.computeRatiosBtn).toBeEnabled();
    await this.computeRatiosBtn.click();
  }

  async verifyFiscalYear(year: number) {
    await expect(this.fiscalYearBadge).toContainText(year.toString());
  }
}
