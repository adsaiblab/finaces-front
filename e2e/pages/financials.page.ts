import { Page, Locator, expect } from '@playwright/test';

/**
 * Financials Page Object
 * Handles data entry for Balance Sheet, Income Statement, and Cash Flow.
 */
export class FinancialsPage {
  readonly page: Page;
  readonly runNormalizationBtn: Locator;
  readonly yearPills: Locator;
  readonly yearPill: (year: number | string) => Locator;
  readonly tabItem: (label: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.runNormalizationBtn = page.getByTestId('financials-run-normalization-btn');
    this.yearPills = page.getByTestId('financials-year-pill');
    this.yearPill = (year: number | string) => 
      page.getByTestId('financials-year-pill').filter({ hasText: `${year}` });
    this.tabItem = (label: string) => 
      page.getByRole('tab', { name: label });
  }

  async selectYear(year: number | string) {
    const pill = this.yearPill(year);
    await expect(pill).toBeVisible();
    await pill.click();
  }

  async switchTab(label: string) {
    const tab = this.tabItem(label);
    await expect(tab).toBeVisible();
    await tab.click();
  }

  async runNormalization() {
    await expect(this.runNormalizationBtn).toBeVisible();
    await expect(this.runNormalizationBtn).toBeEnabled();
    await this.runNormalizationBtn.click();
  }

  async fillBalanceSheetField(label: string, value: string | number) {
    // Finds by label in current BS tab
    const row = this.page.locator(`tr:has-text("${label}")`);
    const input = row.getByRole('textbox');
    await input.fill(`${value}`);
    await input.press('Tab'); // Trigger blur/change
  }
}
