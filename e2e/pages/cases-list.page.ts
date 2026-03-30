import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Cases List Page Object
 * Handles browsing, filtering, and searching for evaluation cases.
 */
export class CasesListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly casesTable: Locator;
  readonly caseRow: (caseId: string) => Locator;
  readonly caseNewBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('cases-list-search-input');
    this.casesTable = page.getByTestId('cases-list-table');
    this.caseRow = (caseId: string) =>
      page.locator(`[data-testid="cases-list-row"]:has-text("${caseId}")`);
    this.caseNewBtn = page.getByTestId('cases-list-new-case-btn');
  }

  async goto() {
    await this.page.goto(`${FRONTEND_BASE_URL}/cases`);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Debounce wait
    await this.page.waitForTimeout(500);
  }

  async resumeStep(caseId: string, stepName: string) {
    const row = this.caseRow(caseId);
    await expect(row).toBeVisible();
    const resumeBtn = row.getByRole('button', { name: /Resume/i });
    await resumeBtn.click();
  }

  async expectCaseInList(caseId: string) {
    await expect(this.caseRow(caseId)).toBeVisible();
  }
}
