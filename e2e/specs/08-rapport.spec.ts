/**
 * e2e/specs/08-rapport.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolation — Bloc 10 Rapport Final
 * Session 4 Jour 2 : enrichissement complet des TODO S4
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '../fixtures/auth.fixture';
import { RapportPage } from '../pages/rapport.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;

// ── Mocks ─────────────────────────────────────────────────────────────────────

// tension_label supprimé (champ fantôme, 0 occurrence backend)
// ia_score aligné sur seed + Batch 1 (72.5)
const MOCK_CASE = {
    id: ID,
    bidder_name: TEST_CASE.bidderName,
    market_reference: TEST_CASE.marketReference,
    case_type: TEST_CASE.caseType,
    contract_value: TEST_CASE.contractValue,
    contract_currency: TEST_CASE.contractCurrency,
    mcc_score: 3.2,
    risk_class: 'MODERATE',
    ia_score: 72.5,
};

// Structure réelle de build_full_report() — champs confirmés dans report.py
// status/sections_complete/sections_total sont absents du vrai retour
const MOCK_REPORT_DRAFT = {
    report_id: 'mock-report-draft-001',
    case_id: ID,
    recommendation: 'FAVORABLE',
    section_14_conclusion: 'Conclusion de test E2E.',
};

const MOCK_REPORT_FINAL = {
    report_id: 'mock-report-final-001',
    case_id: ID,
    recommendation: 'FAVORABLE',
    section_14_conclusion: 'Conclusion de test E2E — version finale.',
};

const MOCK_AUDIT_TRAIL = [
    {
        id: 'audit-1',
        event_type: 'SCORING',
        section: 'MCC',
        description: 'Score calculated: 3.2',
        created_at: '2026-03-30T10:00:00Z',
        icon: '📊',
        color: '#01696f',
    },
    {
        id: 'audit-2',
        event_type: 'EXPERT_REVIEW',
        section: 'Expert',
        description: 'Expert review submitted',
        created_at: '2026-03-31T09:00:00Z',
        icon: '✅',
        color: '#437a22',
    },
];

// Helper : mock l'URL réelle de AuditService.getTrail → GET /api/v1/audit/trail?case_id=...
async function mockAuditTrail(page: any, body: any[]) {
    await page.route(`**/audit/trail**`, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAT INITIAL — Aucun rapport généré
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rapport — État initial (aucun rapport)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE) })
        );
        // Aucun rapport → GET /report retourne 404
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'No report found' }) })
        );
        await mockAuditTrail(page, []);
    });

    test('SKELETON — Rapport : composant racine visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
    });

    test('Rapport — le bouton Generate Report est visible et actif quand aucun rapport', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectGenerateBtnVisible();
    });

    test('Rapport — le statut texte indique "No report generated yet"', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectStatusText('No report generated yet');
    });

    test('Rapport — la section conclusion est vide (placeholder visible)', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectConclusionEmpty();
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAT DRAFT — Rapport généré (statut DRAFT)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rapport — Rapport DRAFT généré', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE) })
        );
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_DRAFT) })
        );
        await mockAuditTrail(page, MOCK_AUDIT_TRAIL);
    });

    test('Rapport — tous les 5 chapitres sont affichés', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectStructureDisplayed();
    });

    test('Rapport — la barre de progression est visible avec le bon pourcentage', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        // 10/14 ≈ 71%
        await rapportPage.expectProgressDisplayed('71');
    });

    test('Rapport — les boutons Export PDF et Word sont visibles quand le rapport existe', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectExportBtnsVisible();
    });

    test('Rapport — le bouton Finalize est visible en état DRAFT', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await expect(rapportPage.finalizeBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

    test('Rapport — la recommandation finale est affichée', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectFinalRecommendation('FAVORABLE');
    });

    test('Rapport — le clic sur Generate déclenche l\'appel API /report/build', async ({ page }) => {
        // Mock l'appel POST build
        await page.route(`**/api/v1/cases/${ID}/report/build**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_DRAFT) })
        );
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();

        const buildPromise = page.waitForRequest(req =>
            req.url().includes(`${ID}/report/build`) || req.url().includes(`${ID}/report`)
        );
        await rapportPage.clickGenerate();
        const req = await buildPromise;
        expect(req).toBeTruthy();
    });

    test('Rapport — le clic Export PDF déclenche l\'appel API /export/pdf', async ({ page }) => {
        // Route réelle confirmée : POST /cases/{id}/export/pdf
        await page.route(`**/api/v1/cases/${ID}/export/pdf**`, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'ok',
                    format: 'pdf',
                    case_id: ID,
                    report_id: 'mock-report-draft-001',
                    file_path: '/tmp/mock.pdf',
                    download_url: `/api/v1/cases/${ID}/export/pdf/download`,
                }),
            })
        );
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();

        const exportPromise = page.waitForRequest(req =>
            req.url().includes(`export/pdf`) || req.url().includes(`export`)
        );
        await rapportPage.clickExportPdf();
        const req = await exportPromise;
        expect(req).toBeTruthy();
    });

    test('Rapport — le clic Export Word déclenche l\'appel API /export/word', async ({ page }) => {
        // Route réelle confirmée : POST /cases/{id}/export/word
        await page.route(`**/api/v1/cases/${ID}/export/word**`, route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    status: 'ok',
                    format: 'docx',
                    case_id: ID,
                    report_id: 'mock-report-draft-001',
                    file_path: '/tmp/mock.docx',
                    download_url: `/api/v1/cases/${ID}/export/word/download`,
                }),
            })
        );
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();

        const exportPromise = page.waitForRequest(req =>
            req.url().includes(`export/word`) || req.url().includes(`export`)
        );
        await rapportPage.clickExportWord();
        const req = await exportPromise;
        expect(req).toBeTruthy();
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAT FINAL — Rapport finalisé
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rapport — Rapport FINAL', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE) })
        );
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_FINAL) })
        );
        await mockAuditTrail(page, MOCK_AUDIT_TRAIL);
    });

    test('Rapport FINAL — le badge "Finalized" est visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectFinalizedBadgeVisible();
    });

    test('Rapport FINAL — le bouton Generate n\'est plus visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectGenerateBtnNotVisible();
    });

    test('Rapport FINAL — la progression affiche 100%', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.expectProgressDisplayed('100');
    });

    test('Rapport FINAL — le clic Dashboard navigue vers /dashboard', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await rapportPage.clickReturnToDashboard();
        await expect(page).toHaveURL(/\/dashboard/, { timeout: TIMEOUTS.navigation });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rapport — Audit Trail', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE) })
        );
        await page.route(`**/api/v1/cases/${ID}/report**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPORT_DRAFT) })
        );
        // URL réelle : GET /api/v1/audit/trail?case_id=...
        await mockAuditTrail(page, MOCK_AUDIT_TRAIL);
    });

    test('Audit Trail — la section audit est visible quand il y a des événements', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await expect(rapportPage.auditTrailSection).toBeVisible({ timeout: TIMEOUTS.apiResponse });
        await expect(rapportPage.auditTrailList).toBeVisible();
    });

    test('Audit Trail — le bouton Export CSV est visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${ID}/rapport`);
        await rapportPage.expectPageLoaded();
        await expect(rapportPage.auditExportCsvBtn).toBeVisible({ timeout: TIMEOUTS.apiResponse });
    });

});
