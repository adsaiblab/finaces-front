import { Page, Locator, expect } from '@playwright/test';

export class StressPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly mainContent: Locator;
    readonly paramsPanel: Locator;
    readonly resultsPanel: Locator;
    readonly runSimulationBtn: Locator;
    readonly backBtn: Locator;
    readonly proceedExpertBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('stress-root');
        this.loadingSpinner = page.getByTestId('stress-loading-spinner');
        this.header = page.getByTestId('stress-header');
        this.mainContent = page.getByTestId('stress-main-content');
        this.paramsPanel = page.getByTestId('stress-params-panel');
        this.resultsPanel = page.getByTestId('stress-results-panel');
        this.runSimulationBtn = page.getByTestId('stress-run-simulation-btn');
        this.backBtn = page.getByTestId('stress-back-btn');
        this.proceedExpertBtn = page.getByTestId('stress-proceed-expert-btn');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    async expectLayoutDisplayed() {
        await expect(this.mainContent).toBeVisible();
        await expect(this.paramsPanel).toBeVisible();
        await expect(this.resultsPanel).toBeVisible();
    }

    async clickRunSimulation() {
        await expect(this.runSimulationBtn).toBeVisible();
        await expect(this.runSimulationBtn).toBeEnabled();
        await this.runSimulationBtn.click();
    }

    async clickProceedToExpert() {
        await expect(this.proceedExpertBtn).toBeVisible();
        await this.proceedExpertBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}