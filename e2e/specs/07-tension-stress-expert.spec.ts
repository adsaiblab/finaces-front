import { test, expect } from '../fixtures/auth.fixture';
import { TensionPage } from '../pages/tension.page';
import { StressPage } from '../pages/stress.page';
import { ExpertPage } from '../pages/expert.page';
import { TEST_CASE } from '../fixtures/test-data';

const TEST_CASE_ID = TEST_CASE.id;

test.describe('Isolation — Blocs 7/8/9 Tension, Stress, Expert', () => {

    test('SKELETON — Bloc 7 Tension : composant racine visible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/tension**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scenarios: [] }) })
        );
        const tensionPage = new TensionPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/tension`);
        await tensionPage.expectPageLoaded();
    });

    test('SKELETON — Bloc 8 Stress : composant racine visible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/stress**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ stress_results: [] }) })
        );
        const stressPage = new StressPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/stress`);
        await stressPage.expectPageLoaded();
    });

    test('SKELETON — Bloc 9 Expert : composant racine visible', async ({ page }) => {
        await page.route(`**/api/v1/cases/${TEST_CASE_ID}/expert**`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recommendation: 'FAVORABLE' }) })
        );
        const expertPage = new ExpertPage(page);
        await page.goto(`/cases/${TEST_CASE_ID}/expert`);
        await expertPage.expectPageLoaded();
    });

    // TODO S4 : ajouter data-testid dans templates + enrichir Page Objects
});
