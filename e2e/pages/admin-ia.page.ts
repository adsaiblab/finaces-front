/**
 * e2e/pages/admin-ia.page.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object — Admin IA (MLOps Center)
 * Session 4 Jour 2 — Nouveau fichier
 *
 * Route : /admin-ia (sous AppLayoutComponent, authGuard requis)
 * Service : AdminIaService.getDashboardData() — 100% mock interne (Observable<delay>)
 * Aucun appel API réel → pas de page.route() nécessaire dans les specs
 *
 * NOTE : les data-testid doivent être ajoutés dans :
 * - src/app/features/admin-ia/admin-ia.component.html
 * - src/app/features/admin-ia/components/model-list/model-list.component.html
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { Page, Locator, expect } from '@playwright/test';

export class AdminIaPage {
    readonly page: Page;

    // ── Structure principale ──────────────────────────────────────────────────
    readonly root: Locator;
    readonly loadingSpinner: Locator;
    readonly header: Locator;
    readonly disclaimerBanner: Locator;

    // ── Dashboard grid ────────────────────────────────────────────────────────
    readonly dashboardGrid: Locator;

    // ── Model list ────────────────────────────────────────────────────────────
    readonly modelList: Locator;
    readonly modelsTable: Locator;

    constructor(page: Page) {
        this.page = page;

        this.root = page.getByTestId('admin-ia-root');
        this.loadingSpinner = page.getByTestId('admin-ia-loading-spinner');
        this.header = page.getByTestId('admin-ia-header');
        this.disclaimerBanner = page.getByTestId('admin-ia-disclaimer-banner');

        this.dashboardGrid = page.getByTestId('admin-ia-dashboard-grid');

        this.modelList = page.getByTestId('admin-ia-model-list');
        this.modelsTable = page.getByTestId('admin-ia-models-table');
    }

    // ── Assertions de base ────────────────────────────────────────────────────

    async expectPageLoaded() {
        // Le composant n'a pas de @if(!isLoading()) sur la div racine
        // On attend la disparition du spinner ET la présence du titre
        await expect(this.loadingSpinner).not.toBeVisible({ timeout: 15_000 });
        await expect(this.header).toBeVisible();
    }

    async expectDashboardDisplayed() {
        await expect(this.dashboardGrid).toBeVisible();
        await expect(this.modelList).toBeVisible();
    }

    async expectDisclaimerVisible() {
        await expect(this.disclaimerBanner).toBeVisible();
        await expect(this.disclaimerBanner).toContainText('Disclaimer');
    }

    async expectModelsTableVisible() {
        await expect(this.modelsTable).toBeVisible();
    }

    async expectActiveModelPresent() {
        // Le mock contient toujours MOD-001 en statut ACTIVE
        await expect(this.modelsTable).toContainText('ACTIVE');
    }
}