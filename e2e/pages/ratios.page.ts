import { Page, Locator, expect } from '@playwright/test';

/**
 * Ratios Page Object (Bloc 4)
 * Only asserts elements that exist OUTSIDE @if(ratioSet()) blocks.
 * ratios-main-content, ratios-back-btn, ratios-launch-scoring-footer-btn
 * are ALL inside @if(ratioSet()) — use waitForResponse before asserting them.
 */
export class RatiosPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly launchScoringBtn: Locator;
    readonly mainContent: Locator;
    readonly backBtn: Locator;
    readonly launchScoringFooterBtn: Locator;
    readonly errorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root                  = page.getByTestId('ratios-root');
        this.loadingSpinner        = page.getByTestId('ratios-loading-spinner');
        this.launchScoringBtn      = page.getByTestId('ratios-launch-scoring-btn');
        this.mainContent           = page.getByTestId('ratios-main-content');
        this.backBtn               = page.getByTestId('ratios-back-btn');
        this.launchScoringFooterBtn = page.getByTestId('ratios-launch-scoring-footer-btn');
        this.errorBanner           = page.getByTestId('ratios-error-banner');
    }

    /** Root div is ALWAYS rendered — safe to assert immediately. */
    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    /**
     * ratios-launch-scoring-btn is in the <header> OUTSIDE @if(ratioSet())
     * so it renders immediately. We just wait for the API mock first to let
     * Angular update ratioSet() and unlock the button.
     */
    async expectRatiosDisplayed() {
        await this.page.waitForResponse(
            (r) => r.url().includes('ratios/compute') && r.status() === 200,
            { timeout: 10000 }
        );
        await expect(this.launchScoringBtn).toBeVisible({ timeout: 10000 });
        await expect(this.mainContent).toBeVisible({ timeout: 10000 });
    }

    async clickLaunchScoring() {
        await expect(this.launchScoringBtn).toBeEnabled({ timeout: 10000 });
        await this.launchScoringBtn.click();
    }
}
