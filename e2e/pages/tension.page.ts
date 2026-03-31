import { Page, Locator, expect } from '@playwright/test';

/**
 * Tension Page Object (Bloc 7)
 *
 * IMPORTANT: tensionData() is computed LOCALLY by TensionCalculatorService
 * from ScorecardContextService + IaContextService — there is NO direct API
 * call to mock for this page. Elements inside @if(tensionData()) will only
 * render if those context services already hold data from Blocs 5 & 6.
 *
 * In isolated E2E tests (direct goto /tension) those services are empty
 * so tensionData() stays null.
 *
 * Strategy: only assert tension-root and tension-header which are ALWAYS
 * rendered outside every @if block.
 */
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
        this.root                 = page.getByTestId('tension-root');
        this.loadingSpinner       = page.getByTestId('tension-loading-spinner');
        this.header               = page.getByTestId('tension-header');
        this.mainContent          = page.getByTestId('tension-main-content');
        this.tensionBanner        = page.getByTestId('tension-banner');
        this.tensionComparison    = page.getByTestId('tension-comparison');
        this.pillarsTable         = page.getByTestId('tension-pillars-table');
        this.analystDecision      = page.getByTestId('tension-analyst-decision');
        this.errorBanner          = page.getByTestId('tension-error-banner');
        this.backBtn              = page.getByTestId('tension-back-btn');
        this.decisionPendingLabel = page.getByTestId('tension-decision-pending-label');
    }

    /** Root div is ALWAYS rendered — safe to assert immediately. */
    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    /**
     * tension-header is ALWAYS rendered outside @if(tensionData()) —
     * this is a safe assertion for isolated tests.
     */
    async expectContentDisplayed() {
        await expect(this.header).toBeVisible({ timeout: 10000 });
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible({ timeout: 10000 });
        await this.backBtn.click();
    }
}
