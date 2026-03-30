import { Page, Locator, expect } from '@playwright/test';

/**
 * Scoring MCC Page Object (Bloc 5)
 * Verifies MCC score display, risk class, pillars and navigation.
 */
export class ScoringPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly statusBadge: Locator;
    readonly globalScoreCard: Locator;
    readonly riskClassCard: Locator;
    readonly pillarsGrid: Locator;
    readonly overrideZone: Locator;
    readonly mainContent: Locator;
    readonly errorBanner: Locator;
    readonly backBtn: Locator;
    readonly proceedIaBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('scoring-root');
        this.loadingSpinner = page.getByTestId('scoring-loading-spinner');
        this.statusBadge = page.getByTestId('scoring-status-badge');
        this.globalScoreCard = page.getByTestId('scoring-global-score-card');
        this.riskClassCard = page.getByTestId('scoring-risk-class-card');
        this.pillarsGrid = page.getByTestId('scoring-pillars-grid');
        this.overrideZone = page.getByTestId('scoring-override-zone');
        this.mainContent = page.getByTestId('scoring-main-content');
        this.errorBanner = page.getByTestId('scoring-error-banner');
        this.backBtn = page.getByTestId('scoring-back-btn');
        this.proceedIaBtn = page.getByTestId('scoring-proceed-ia-btn');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible();
    }

    async expectScoringDisplayed() {
        await expect(this.mainContent).toBeVisible();
        await expect(this.globalScoreCard).toBeVisible();
        await expect(this.riskClassCard).toBeVisible();
    }

    async clickProceedToIA() {
        await expect(this.proceedIaBtn).toBeVisible();
        await this.proceedIaBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}