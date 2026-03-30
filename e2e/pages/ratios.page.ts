import { Page, Locator, expect } from '@playwright/test';

/**
 * Ratios Page Object (Bloc 4)
 * Verifies financial ratios display and scoring launch trigger.
 */
export class RatiosPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly launchScoringBtn: Locator;
    readonly launchScoringFooterBtn: Locator;
    readonly mainContent: Locator;
    readonly errorBanner: Locator;
    readonly backBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('ratios-root');
        this.loadingSpinner = page.getByTestId('ratios-loading-spinner');
        this.launchScoringBtn = page.getByTestId('ratios-launch-scoring-btn');
        this.launchScoringFooterBtn = page.getByTestId('ratios-launch-scoring-footer-btn');
        this.mainContent = page.getByTestId('ratios-main-content');
        this.errorBanner = page.getByTestId('ratios-error-banner');
        this.backBtn = page.getByTestId('ratios-back-btn');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible();
    }

    async expectRatiosDisplayed() {
        await expect(this.mainContent).toBeVisible();
    }

    async clickLaunchScoring() {
        await expect(this.launchScoringFooterBtn).toBeVisible();
        await expect(this.launchScoringFooterBtn).toBeEnabled();
        await this.launchScoringFooterBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}