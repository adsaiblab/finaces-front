import { Page, Locator, expect } from '@playwright/test';

/**
 * Scoring MCC Page Object (Bloc 5)
 * Only asserts elements that exist OUTSIDE @if(scoringData()) blocks.
 * scoring-main-content, scoring-global-score-card, scoring-risk-class-card,
 * scoring-back-btn, scoring-proceed-ia-btn are ALL inside @if(scoringData()).
 */
export class ScoringPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly statusBadge: Locator;
    readonly mainContent: Locator;
    readonly globalScoreCard: Locator;
    readonly riskClassCard: Locator;
    readonly pillarsGrid: Locator;
    readonly overrideZone: Locator;
    readonly backBtn: Locator;
    readonly proceedIaBtn: Locator;
    readonly errorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root            = page.getByTestId('scoring-root');
        this.loadingSpinner  = page.getByTestId('scoring-loading-spinner');
        this.statusBadge     = page.getByTestId('scoring-status-badge');
        this.mainContent     = page.getByTestId('scoring-main-content');
        this.globalScoreCard = page.getByTestId('scoring-global-score-card');
        this.riskClassCard   = page.getByTestId('scoring-risk-class-card');
        this.pillarsGrid     = page.getByTestId('scoring-pillars-grid');
        this.overrideZone    = page.getByTestId('scoring-override-zone');
        this.backBtn         = page.getByTestId('scoring-back-btn');
        this.proceedIaBtn    = page.getByTestId('scoring-proceed-ia-btn');
        this.errorBanner     = page.getByTestId('scoring-error-banner');
    }

    /** Root div is ALWAYS rendered — safe to assert immediately. */
    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    /**
     * Wait for the /score API mock then assert main-content which is
     * inside @if(scoringData()).
     */
    async expectScoringDisplayed() {
        await this.page.waitForResponse(
            (r) => r.url().includes('/score') && r.status() === 200,
            { timeout: 10000 }
        );
        await expect(this.mainContent).toBeVisible({ timeout: 10000 });
        await expect(this.globalScoreCard).toBeVisible({ timeout: 10000 });
    }

    async clickProceedToIA() {
        await expect(this.proceedIaBtn).toBeVisible({ timeout: 10000 });
        await this.proceedIaBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible({ timeout: 10000 });
        await this.backBtn.click();
    }
}
