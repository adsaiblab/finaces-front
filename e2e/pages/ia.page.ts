import { Page, Locator, expect } from '@playwright/test';

/**
 * IA Prediction Page Object (Bloc 6)
 * Verifies AI prediction score, SHAP chart, what-if simulation area.
 */
export class IaPage {
    readonly page: Page;
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly disclaimerBanner: Locator;
    readonly modelPerformanceBadge: Locator;
    readonly predictedScoreCard: Locator;
    readonly simulationPlaceholder: Locator;
    readonly simulationCard: Locator;
    readonly shapChartCard: Locator;
    readonly whatIfCard: Locator;
    readonly mainContent: Locator;
    readonly errorBanner: Locator;
    readonly backBtn: Locator;
    readonly proceedTensionBtn: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('ia-root');
        this.loadingSpinner = page.getByTestId('ia-loading-spinner');
        this.disclaimerBanner = page.getByTestId('ia-disclaimer-banner');
        this.modelPerformanceBadge = page.getByTestId('ia-model-performance-badge');
        this.predictedScoreCard = page.getByTestId('ia-predicted-score-card');
        this.simulationPlaceholder = page.getByTestId('ia-simulation-placeholder');
        this.simulationCard = page.getByTestId('ia-simulation-card');
        this.shapChartCard = page.getByTestId('ia-shap-chart-card');
        this.whatIfCard = page.getByTestId('ia-whatif-card');
        this.mainContent = page.getByTestId('ia-main-content');
        this.errorBanner = page.getByTestId('ia-error-banner');
        this.backBtn = page.getByTestId('ia-back-btn');
        this.proceedTensionBtn = page.getByTestId('ia-proceed-tension-btn');
    }

    async expectPageLoaded() {
        await expect(this.root).toBeVisible();
    }

    async expectPredictionDisplayed() {
        await expect(this.mainContent).toBeVisible();
        await expect(this.predictedScoreCard).toBeVisible();
    }

    async clickProceedToTension() {
        await expect(this.proceedTensionBtn).toBeVisible();
        await this.proceedTensionBtn.click();
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}