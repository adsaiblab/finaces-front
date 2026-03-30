import { Page, Locator, expect } from '@playwright/test';

export class TensionPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly mainContent: Locator;
    readonly tensionBanner: Locator;
    readonly tensionComparison: Locator;
    readonly pillarsTable: Locator;
    readonly analystDecision: Locator;
    readonly errorBanner: Locator;
    readonly backBtn: Locator;
    readonly decisionPendingLabel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('tension-root');
        this.loadingSpinner = page.getByTestId('tension-loading-spinner');
        this.header = page.getByTestId('tension-header');
        this.mainContent = page.getByTestId('tension-main-content');
        this.tensionBanner = page.getByTestId('tension-banner');
        this.tensionComparison = page.getByTestId('tension-comparison');
        this.pillarsTable = page.getByTestId('tension-pillars-table');
        this.analystDecision = page.getByTestId('tension-analyst-decision');
        this.errorBanner = page.getByTestId('tension-error-banner');
        this.backBtn = page.getByTestId('tension-back-btn');
        this.decisionPendingLabel = page.getByTestId('tension-decision-pending-label');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    async expectContentDisplayed() {
        await expect(this.mainContent).toBeVisible();
        await expect(this.tensionBanner).toBeVisible();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}