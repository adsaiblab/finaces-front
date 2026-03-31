/**
 * e2e/pages/expert.page.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object — Bloc 9 Expert Review
 * Mis à jour Session 4 Jour 2 : enrichissement complet des locators et helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Page, Locator, expect } from '@playwright/test';

export class ExpertPage {
    readonly page: Page;

    // ── Structure principale ──────────────────────────────────────────────────
    // root est conditionnel à !isLoading() — sa présence confirme le chargement complet
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly phaseBadge: Locator;
    readonly backBtn: Locator;

    // ── Formulaire ────────────────────────────────────────────────────────────
    readonly reviewForm: Locator;
    readonly qualitativeNotes: Locator;
    readonly riskOverride: Locator;
    readonly validationDecision: Locator;
    readonly mccConditions: Locator;
    readonly decisionRecap: Locator;

    // ── Conclusion ────────────────────────────────────────────────────────────
    readonly conclusionSection: Locator;
    readonly conclusionTextarea: Locator;

    // ── Actions bar ───────────────────────────────────────────────────────────
    readonly actionsBar: Locator;
    readonly submitBtn: Locator;
    readonly closeCaseBtn: Locator;
    readonly editReviewBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.root = page.getByTestId('expert-root');
        this.loadingSpinner = page.getByTestId('expert-loading-spinner');
        this.header = page.getByTestId('expert-header');
        this.phaseBadge = page.getByTestId('expert-phase-badge');
        this.backBtn = page.getByTestId('expert-back-btn');

        this.reviewForm = page.getByTestId('expert-review-form');
        this.qualitativeNotes = page.getByTestId('expert-qualitative-notes');
        this.riskOverride = page.getByTestId('expert-risk-override');
        this.validationDecision = page.getByTestId('expert-validation-decision');
        this.mccConditions = page.getByTestId('expert-mcc-conditions');
        this.decisionRecap = page.getByTestId('expert-decision-recap');

        this.conclusionSection = page.getByTestId('expert-conclusion-section');
        this.conclusionTextarea = page.getByTestId('expert-conclusion-textarea');

        this.actionsBar = page.getByTestId('expert-actions-bar');
        this.submitBtn = page.getByTestId('expert-submit-btn');
        this.closeCaseBtn = page.getByTestId('expert-close-case-btn');
        this.editReviewBtn = page.getByTestId('expert-edit-review-btn');
    }

    // ── Assertions de base ────────────────────────────────────────────────────

    async expectPageLoaded() {
        // root est conditionnel à !isLoading() — attendre sa présence confirme le chargement complet
        await expect(this.root).toBeVisible({ timeout: 15_000 });
    }

    async expectFormDisplayed() {
        await expect(this.reviewForm).toBeVisible();
        await expect(this.conclusionSection).toBeVisible();
        await expect(this.submitBtn).toBeVisible();
    }

    async expectAllSectionsVisible() {
        await expect(this.decisionRecap).toBeVisible();
        await expect(this.qualitativeNotes).toBeVisible();
        await expect(this.riskOverride).toBeVisible();
        await expect(this.validationDecision).toBeVisible();
        await expect(this.mccConditions).toBeVisible();
        await expect(this.conclusionSection).toBeVisible();
        await expect(this.actionsBar).toBeVisible();
    }

    async expectPhaseBadgeVisible() {
        await expect(this.phaseBadge).toBeVisible();
        await expect(this.phaseBadge).toContainText('EXPERT REVIEW PHASE');
    }

    async expectSubmitDisabledWhenFormEmpty() {
        await expect(this.submitBtn).toBeDisabled();
    }

    async expectSubmitDisabledWhenAlreadySubmitted() {
        await expect(this.submitBtn).toBeDisabled();
    }

    async expectEditReviewBtnVisibleAfterSubmit() {
        await expect(this.editReviewBtn).toBeVisible();
        await expect(this.editReviewBtn).toBeEnabled();
    }

    async expectCloseCaseBtnEnabled() {
        await expect(this.closeCaseBtn).toBeEnabled();
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    async fillConclusion(text: string) {
        await expect(this.conclusionTextarea).toBeVisible();
        await this.conclusionTextarea.fill(text);
    }

    async clickBack() {
        await expect(this.backBtn).toBeVisible();
        await this.backBtn.click();
    }

    async clickSubmit() {
        await expect(this.submitBtn).toBeVisible();
        await expect(this.submitBtn).toBeEnabled();
        await this.submitBtn.click();
    }

    async clickEditReview() {
        await expect(this.editReviewBtn).toBeEnabled();
        await this.editReviewBtn.click();
    }

    async clickCloseCase() {
        await expect(this.closeCaseBtn).toBeEnabled();
        await this.closeCaseBtn.click();
    }
}