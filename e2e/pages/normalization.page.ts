import { Page, Locator, expect } from '@playwright/test';

/**
 * Normalization Page Object (Bloc 3)
 * Verifies IFRS normalization data display and navigation.
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
        this.root = page.getByTestId('normalization-root');
        this.loadingSpinner = page.getByTestId('normalization-loading-spinner');
        this.statusBadge = page.getByTestId('normalization-status-badge');
        this.fiscalYearDisplay = page.getByTestId('normalization-fiscal-year-display');
        this.recalculateBtn = page.getByTestId('normalization-recalculate-btn');
        this.adjustmentsSection = page.getByTestId('normalization-adjustments-section');
        this.backBtn = page.getByTestId('normalization-back-btn');
        this.computeRatiosBtn = page.getByTestId('normalization-compute-ratios-btn');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible();
    }

    async expectNormalizedBadgeVisible() {
        await expect(this.statusBadge).toBeVisible();
        await expect(this.statusBadge).toContainText('NORMALIZED');
    }

    async clickComputeRatios() {
        await expect(this.computeRatiosBtn).toBeVisible();
        await expect(this.computeRatiosBtn).toBeEnabled();
        await this.computeRatiosBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}