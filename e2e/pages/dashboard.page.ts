import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Dashboard Page Object
 * Handles navigation to new cases and finding recent cases.
 */
export class DashboardPage {
  readonly page: Page;
  readonly newCaseBtn: Locator;
  readonly recentCasesTable: Locator;
  readonly recentCaseLink: (caseId: string) => Locator;

  constructor(page: Page) {
    this.page = page;
    this.newCaseBtn = page.getByTestId('dashboard-new-case-btn');
    this.recentCasesTable = page.getByTestId('dashboard-recent-cases-table');
    this.recentCaseLink = (caseId: string) =>
      page.locator(`[data-testid="dashboard-recent-case-row"]:has-text("${caseId.substring(0, 8)}")`)
          .getByTestId('dashboard-recent-case-link');
  }

  async goto() {
    await this.page.goto(`${FRONTEND_BASE_URL}/dashboard`);
  }

  async createNewCase() {
    await this.newCaseBtn.click();
  }

  async openRecentCase(caseId: string) {
    const link = this.recentCaseLink(caseId);
    await expect(link).toBeVisible();
    await link.click();
  }
}
