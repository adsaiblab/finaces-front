import { Page, Locator, expect } from '@playwright/test';

export class ExpertPage {
    readonly page: Page;
    // root n'est visible QUE quand isLoading() === false (structure @if du template)
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly phaseBadge: Locator;
    readonly backBtn: Locator;
    readonly reviewForm: Locator;
    readonly conclusionTextarea: Locator;
    readonly conclusionSection: Locator;
    readonly submitBtn: Locator;
    readonly closeCaseBtn: Locator;
    readonly editReviewBtn: Locator;
    readonly actionsBar: Locator;

    constructor(page: Page) {
        this.page = page;
        this.root = page.getByTestId('expert-root');
        this.loadingSpinner = page.getByTestId('expert-loading-spinner');
        this.header = page.getByTestId('expert-header');
        this.phaseBadge = page.getByTestId('expert-phase-badge');
        this.backBtn = page.getByTestId('expert-back-btn');
        this.reviewForm = page.getByTestId('expert-review-form');
        this.conclusionSection = page.getByTestId('expert-conclusion-section');
        this.conclusionTextarea = page.getByTestId('expert-conclusion-textarea');
        this.submitBtn = page.getByTestId('expert-submit-btn');
        this.closeCaseBtn = page.getByTestId('expert-close-case-btn');
        this.editReviewBtn = page.getByTestId('expert-edit-review-btn');
        this.actionsBar = page.getByTestId('expert-actions-bar');
    }

    async expectPageLoaded() {
        // root est conditionnel à !isLoading() — attendre sa présence confirme le chargement complet
        await expect(this.root).toBeVisible({ timeout: 15000 });
    }

    async expectFormDisplayed() {
        await expect(this.reviewForm).toBeVisible();
        await expect(this.conclusionSection).toBeVisible();
        await expect(this.submitBtn).toBeVisible();
    }

    async fillConclusion(text: string) {
        await expect(this.conclusionTextarea).toBeVisible();
        await this.conclusionTextarea.fill(text);
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }
}