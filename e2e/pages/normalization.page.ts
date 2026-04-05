import { Page, Locator, expect, Response } from '@playwright/test';

/**
 * Normalization Page Object (Bloc 3)
 * Only asserts elements that exist OUTSIDE @if(normalizedData()) blocks.
 * Elements inside @if are only rendered after the API signal is set.
 */
export class NormalizationPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly statusBadge: Locator;
    readonly fiscalYearDisplay: Locator;
    readonly recalculateBtn: Locator;
    readonly adjustmentsSection: Locator;
    readonly backBtn: Locator;
    readonly computeRatiosBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root               = page.getByTestId('normalization-root');
        this.loadingSpinner     = page.getByTestId('normalization-loading-spinner');
        this.statusBadge        = page.getByTestId('normalization-status-badge');
        this.fiscalYearDisplay  = page.getByTestId('normalization-fiscal-year-display');
        this.recalculateBtn     = page.getByTestId('normalization-recalculate-btn');
        this.adjustmentsSection = page.getByTestId('normalization-adjustments-section');
        this.backBtn            = page.getByTestId('normalization-back-btn');
        this.computeRatiosBtn   = page.getByTestId('normalization-compute-ratios-btn');
    }

    /** Root div is ALWAYS rendered — safe to assert immediately. */
    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    /**
     * statusBadge is inside @if(normalizedData()).
     * Pass a responsePromise created BEFORE page.goto() to avoid the race
     * condition where the response arrives before waitForResponse is registered.
     *
     * Usage:
     *   const resp = page.waitForResponse(r => r.url().includes('normalized-financials'));
     *   await page.goto(...);
     *   await normPage.expectNormalizedBadgeVisible(resp);
     */
    async expectNormalizedBadgeVisible(responsePromise: Promise<Response>) {
        await responsePromise;
        await expect(this.statusBadge).toBeVisible({ timeout: 10000 });
        await expect(this.statusBadge).toContainText('NORMALIZED');
    }

    async clickComputeRatios() {
        await expect(this.computeRatiosBtn).toBeVisible({ timeout: 10000 });
        await expect(this.computeRatiosBtn).toBeEnabled();
        // Dispatch JS click directement pour contourner le header sticky mat-mdc-table-sticky
        // qui intercepte les pointer events au-dessus du footer fixe
        await this.computeRatiosBtn.evaluate((el: HTMLElement) => el.click());
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible({ timeout: 10000 });
        // Dispatch JS click directement pour contourner le header sticky mat-mdc-table-sticky
        await this.backBtn.evaluate((el: HTMLElement) => el.click());
    }
}
