/**
 * e2e/pages/rapport.page.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object — Bloc 10 Rapport Final
 * Mis à jour Session 4 Jour 2 : enrichissement complet helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Page, Locator, expect } from '@playwright/test';

export class RapportPage {
    readonly page: Page;

    // ── Structure principale ──────────────────────────────────────────────────
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly statusText: Locator;

    // ── Actions bar ───────────────────────────────────────────────────────────
    readonly actionsBar: Locator;
    readonly generateBtn: Locator;
    readonly finalizeBtn: Locator;
    readonly exportWordBtn: Locator;
    readonly exportPdfBtn: Locator;
    readonly dashboardBtn: Locator;

    // ── Progression ───────────────────────────────────────────────────────────
    readonly buildProgress: Locator;
    readonly completenessBlock: Locator;
    readonly progressPct: Locator;
    readonly finalizedBadge: Locator;

    // ── Sections / chapitres ──────────────────────────────────────────────────
    readonly sectionsContainer: Locator;
    readonly chapter1: Locator;
    readonly chapter2: Locator;
    readonly chapter3: Locator;
    readonly chapter4: Locator;
    readonly chapter5: Locator;

    // ── Blocs de données ──────────────────────────────────────────────────────
    readonly mccScoreDisplay: Locator;
    readonly finalRecommendationValue: Locator;
    readonly conclusionEmpty: Locator;
    readonly aiSection: Locator;
    readonly tensionSection: Locator;
    readonly stressSection: Locator;

    // ── Audit trail ───────────────────────────────────────────────────────────
    readonly auditTrailSection: Locator;
    readonly auditExportCsvBtn: Locator;
    readonly auditTrailList: Locator;

    constructor(page: Page) {
        this.page = page;

        this.root = page.getByTestId('rapport-root');
        this.loadingSpinner = page.getByTestId('rapport-loading-spinner');
        this.header = page.getByTestId('rapport-header');
        this.statusText = page.getByTestId('rapport-status-text');

        this.actionsBar = page.getByTestId('rapport-actions-bar');
        this.generateBtn = page.getByTestId('rapport-generate-btn');
        this.finalizeBtn = page.getByTestId('rapport-finalize-btn');
        this.exportWordBtn = page.getByTestId('rapport-export-word-btn');
        this.exportPdfBtn = page.getByTestId('rapport-export-pdf-btn');
        this.dashboardBtn = page.getByTestId('rapport-dashboard-btn');

        this.buildProgress = page.getByTestId('rapport-build-progress');
        this.completenessBlock = page.getByTestId('rapport-completeness-block');
        this.progressPct = page.getByTestId('rapport-progress-pct');
        this.finalizedBadge = page.getByTestId('rapport-finalized-badge');

        this.sectionsContainer = page.getByTestId('rapport-sections-container');
        this.chapter1 = page.getByTestId('rapport-chapter-1');
        this.chapter2 = page.getByTestId('rapport-chapter-2');
        this.chapter3 = page.getByTestId('rapport-chapter-3');
        this.chapter4 = page.getByTestId('rapport-chapter-4');
        this.chapter5 = page.getByTestId('rapport-chapter-5');

        this.mccScoreDisplay = page.getByTestId('rapport-mcc-score-display');
        this.finalRecommendationValue = page.getByTestId('rapport-final-recommendation-value');
        this.conclusionEmpty = page.getByTestId('rapport-conclusion-empty');
        this.aiSection = page.getByTestId('rapport-ai-section');
        this.tensionSection = page.getByTestId('rapport-tension-section');
        this.stressSection = page.getByTestId('rapport-stress-section');

        this.auditTrailSection = page.getByTestId('rapport-audit-trail-section');
        this.auditExportCsvBtn = page.getByTestId('rapport-audit-export-csv-btn');
        this.auditTrailList = page.getByTestId('rapport-audit-trail-list');
    }

    // ── Assertions de base ────────────────────────────────────────────────────

    async expectPageLoaded() {
        await expect(this.root).toBeVisible({ timeout: 15_000 });
    }

    async expectStructureDisplayed() {
        await expect(this.sectionsContainer).toBeVisible();
        await expect(this.chapter1).toBeVisible();
        await expect(this.chapter2).toBeVisible();
        await expect(this.chapter3).toBeVisible();
        await expect(this.chapter4).toBeVisible();
        await expect(this.chapter5).toBeVisible();
    }

    async expectGenerateBtnVisible() {
        await expect(this.generateBtn).toBeVisible();
        await expect(this.generateBtn).toBeEnabled();
    }

    async expectGenerateBtnNotVisible() {
        await expect(this.generateBtn).not.toBeVisible();
    }

    async expectExportBtnsVisible() {
        await expect(this.exportPdfBtn).toBeVisible();
        await expect(this.exportWordBtn).toBeVisible();
    }

    async expectStatusText(text: string) {
        await expect(this.statusText).toContainText(text);
    }

    async expectProgressDisplayed(pct: string) {
        await expect(this.completenessBlock).toBeVisible();
        await expect(this.progressPct).toContainText(pct);
    }

    async expectFinalizedBadgeVisible() {
        await expect(this.finalizedBadge).toBeVisible();
    }

    async expectConclusionEmpty() {
        await expect(this.conclusionEmpty).toBeVisible();
    }

    async expectFinalRecommendation(value: string) {
        await expect(this.finalRecommendationValue).toContainText(value);
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    async clickGenerate() {
        await expect(this.generateBtn).toBeVisible();
        await expect(this.generateBtn).toBeEnabled();
        await this.generateBtn.click();
    }

    async clickExportPdf() {
        await expect(this.exportPdfBtn).toBeVisible();
        await this.exportPdfBtn.click();
    }

    async clickExportWord() {
        await expect(this.exportWordBtn).toBeVisible();
        await this.exportWordBtn.click();
    }

    async clickFinalize() {
        await expect(this.finalizeBtn).toBeVisible();
        await this.finalizeBtn.click();
    }

    async clickReturnToDashboard() {
        await expect(this.dashboardBtn).toBeVisible();
        await this.dashboardBtn.click();
    }
}