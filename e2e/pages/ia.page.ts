import { Page, Locator, expect, Response } from '@playwright/test';

/**
 * IA Page Object (Bloc 6)
 * Only asserts elements that exist OUTSIDE @if(predictionData()) blocks.
 * ia-main-content, ia-predicted-score-card, ia-shap-chart-card,
 * ia-back-btn, ia-proceed-tension-btn are ALL inside @if(predictionData()).
 * ia-disclaimer-banner is ALWAYS rendered (outside any @if).
 */
export class IaPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly disclaimerBanner: Locator;
    readonly modelPerformanceBadge: Locator;
    readonly mainContent: Locator;
    readonly predictedScoreCard: Locator;
    readonly simulationPlaceholder: Locator;
    readonly shapChartCard: Locator;
    readonly whatIfCard: Locator;
    readonly backBtn: Locator;
    readonly proceedTensionBtn: Locator;
    readonly errorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root                  = page.getByTestId('ia-root');
        this.loadingSpinner        = page.getByTestId('ia-loading-spinner');
        this.disclaimerBanner      = page.getByTestId('ia-disclaimer-banner');
        this.modelPerformanceBadge = page.getByTestId('ia-model-performance-badge');
        this.mainContent           = page.getByTestId('ia-main-content');
        this.predictedScoreCard    = page.getByTestId('ia-predicted-score-card');
        this.simulationPlaceholder = page.getByTestId('ia-simulation-placeholder');
        this.shapChartCard         = page.getByTestId('ia-shap-chart-card');
        this.whatIfCard            = page.getByTestId('ia-whatif-card');
        this.backBtn               = page.getByTestId('ia-back-btn');
        this.proceedTensionBtn     = page.getByTestId('ia-proceed-tension-btn');
        this.errorBanner           = page.getByTestId('ia-error-banner');
    }

    /** Root div is ALWAYS rendered — safe to assert immediately. */
    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    /**
     * Pass a responsePromise created BEFORE page.goto() to avoid race condition.
     * The forkJoin fires both /ia/predict/:id and /ia/models/active simultaneously.
     * Waiting for the predict response is sufficient to know both resolved.
     *
     * Usage:
     *   const resp = page.waitForResponse(r => r.url().includes('ia/predict'));
     *   await page.goto(...);
     *   await iaPage.expectPredictionDisplayed(resp);
     */
    async expectPredictionDisplayed(responsePromise?: Promise<Response>) {
        await expect(this.disclaimerBanner).toBeVisible({ timeout: 10000 });
        if (responsePromise) await responsePromise;
        await expect(this.mainContent).toBeVisible({ timeout: 10000 });
        await expect(this.predictedScoreCard).toBeVisible({ timeout: 10000 });
    }

    async clickProceedToTension() {
        await expect(this.proceedTensionBtn).toBeVisible({ timeout: 10000 });
        await this.proceedTensionBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible({ timeout: 10000 });
        await this.backBtn.click();
    }
}
