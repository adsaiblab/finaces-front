/**
 * e2e/pages/consortium.page.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object — Bloc 12 Consortium
 * Session 4 Jour 2
 *
 * data-testid="consortium-members-table" est sur le <tbody>.
 * Les <tr> comptés sont donc uniquement les lignes de données (pas de header).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Page, Locator, expect } from '@playwright/test';

export class ConsortiumPage {
    readonly page: Page;

    // ── Structure principale ────────────────────────────────────────────────────────
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;

    // ── Données combinées ───────────────────────────────────────────────────────
    readonly combinedScore: Locator;

    // ── Table membres ───────────────────────────────────────────────────────────
    // data-testid="consortium-members-table" est sur <tbody>, donc
    // les <tr> enfants sont uniquement les lignes de données (pas de <thead>).
    readonly membersTable: Locator;

    // ── Alertes / validations ─────────────────────────────────────────────────────
    readonly participationError: Locator;
    readonly leaderBlockingError: Locator;
    readonly notInitializedMsg: Locator;

    // ── Actions ──────────────────────────────────────────────────────────────────
    readonly addMemberBtn: Locator;
    readonly recalculateBtn: Locator;
    readonly continueBtn: Locator;

    constructor(page: Page) {
        this.page = page;

        this.root = page.getByTestId('consortium-root');
        this.loadingSpinner = page.getByTestId('consortium-loading-spinner');
        this.header = page.getByTestId('consortium-header');

        this.combinedScore = page.getByTestId('consortium-combined-score');

        this.membersTable = page.getByTestId('consortium-members-table');

        this.participationError = page.getByTestId('consortium-participation-error');
        this.leaderBlockingError = page.getByTestId('consortium-leader-blocking-error');
        this.notInitializedMsg = page.getByTestId('consortium-not-initialized-msg');

        this.addMemberBtn = page.getByTestId('consortium-add-member-btn');
        this.recalculateBtn = page.getByTestId('consortium-recalculate-btn');
        this.continueBtn = page.getByTestId('consortium-continue-btn');
    }

    // ── Assertions de base ───────────────────────────────────────────────────────

    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15_000 });
    }

    async expectDataDisplayed() {
        await expect(this.combinedScore).toBeVisible();
        await expect(this.membersTable).toBeVisible();
    }

    async expectMembersCount(count: number) {
        // data-testid est sur <tbody> — les <tr> enfants sont les lignes de données uniquement
        // Pas de +1 : pas de header row dans le tbody
        const rows = this.membersTable.locator('tr');
        await expect(rows).toHaveCount(count);
    }

    async expectParticipationErrorVisible() {
        await expect(this.participationError).toBeVisible();
    }

    async expectLeaderBlockingErrorVisible() {
        await expect(this.leaderBlockingError).toBeVisible();
    }

    async expectNotInitializedVisible() {
        await expect(this.notInitializedMsg).toBeVisible();
    }

    async expectContinueBtnEnabled() {
        await expect(this.continueBtn).toBeEnabled();
    }

    async expectContinueBtnDisabled() {
        await expect(this.continueBtn).toBeDisabled();
    }

    async expectRecalculateBtnEnabled() {
        await expect(this.recalculateBtn).toBeEnabled();
    }

    // ── Actions ──────────────────────────────────────────────────────────────────

    async clickAddMember() {
        await expect(this.addMemberBtn).toBeVisible();
        await expect(this.addMemberBtn).toBeEnabled();
        await this.addMemberBtn.click();
    }

    async clickRecalculate() {
        await expect(this.recalculateBtn).toBeEnabled();
        await this.recalculateBtn.click();
    }

    async clickContinue() {
        await expect(this.continueBtn).toBeEnabled();
        await this.continueBtn.click();
    }
}
