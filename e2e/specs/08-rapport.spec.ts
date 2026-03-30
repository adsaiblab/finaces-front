import { test, expect } from '@playwright/test';
import { RapportPage } from '../pages/rapport.page';

const TEST_CASE_ID = 'TEST-CASE-001';

test.describe('Isolation — Bloc 10 Rapport Final', () => {
    test.use({ storageState: 'e2e/auth/session.json' });

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/report**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ report_url: '/reports/mock.pdf', status: 'GENERATED' }) })
        );
    });

    test('SKELETON — Rapport : composant racine visible', async ({ page }) => {
        const rapportPage = new RapportPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/rapport`);
        await rapportPage.expectPageLoaded();
    });

    // TODO S4 (MISSION 2) : ajouter data-testid dans bloc10-rapport template
    // TODO S4 : test génération rapport (bouton générer + mock réponse)
    // TODO S4 : test téléchargement PDF
    // TODO S4 : test statut "GENERATED" affiché
});