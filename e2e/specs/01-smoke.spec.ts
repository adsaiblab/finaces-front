import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { CasesListPage } from '../pages/cases-list.page';
import { TEST_CASE } from '../fixtures/test-data';

test.describe('Session 2 — Page Objects Smoke Test', () => {
  test('Dashboard and Cases List navigation works with Page Objects', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    const casesList = new CasesListPage(authenticatedPage);

    // 1. Dashboard
    await dashboard.goto();
    await expect(dashboard.newCaseBtn).toBeVisible();
    await expect(dashboard.recentCasesTable).toBeVisible();

    // 2. Cases List
    await casesList.goto();
    await expect(casesList.casesTable).toBeVisible();
    
    // Search for our seeded test case
    await casesList.search(TEST_CASE.marketReference);
    await expect(casesList.caseRow(TEST_CASE.marketReference)).toBeVisible();
  });
});
