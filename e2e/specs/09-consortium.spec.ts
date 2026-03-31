/**
 * e2e/specs/09-consortium.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Isolation — Bloc 12 Consortium
 * Session 4 Jour 2
 *
 * URL réelles :
 *   GET /api/v1/cases/:id        → CaseService.getCaseDetail
 *   GET /api/v1/cases/:id/consortium  → ConsortiumService.getConsortium
 *
 * NOTE : le template actuel n'a PAS de data-testid pour les boutons
 * recalculate/continue/members-table. Les tests qui les utilisent
 * passeront UNIQUEMENT après ajout des data-testid dans le template.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '../fixtures/auth.fixture';
import { ConsortiumPage } from '../pages/consortium.page';
import { TEST_CASE, TIMEOUTS } from '../fixtures/test-data';

const ID = TEST_CASE.id;

// ── Mocks ─────────────────────────────────────────────────────────────────────

const MOCK_CASE_CONSORTIUM = {
    id: ID,
    bidder_name: 'Groupement de Test E2E',
    market_reference: TEST_CASE.marketReference,
    case_type: 'CONSORTIUM',
    contract_value: TEST_CASE.contractValue,
    contract_currency: TEST_CASE.contractCurrency,
    mcc_score: 3.45,
    risk_class: 'MODERATE',
};

const MOCK_CASE_SINGLE = {
    ...MOCK_CASE_CONSORTIUM,
    case_type: 'SINGLE',
};

const MOCK_CONSORTIUM = {
    joint_venture_type: 'SOLIDAIRE',
    synergy_index: 0.5,
    weakest_member_id: 'member-2',
    combined_scorecard: {
        final_score: 3.45,
        risk_class: 'MODERATE',
    },
    members: [
        {
            member_id: 'member-1',
            member_name: 'TechCorp Leader',
            role: 'LEADER',
            participation_pct: 60,
            score: 3.8,
            risk_class: 'LOW',
            status: 'ACTIVE',
        },
        {
            member_id: 'member-2',
            member_name: 'OpsLink Partner',
            role: 'MEMBER',
            participation_pct: 40,
            score: 2.1,
            risk_class: 'HIGH',
            status: 'ACTIVE',
        },
    ],
};

const MOCK_CONSORTIUM_LEADER_BLOCKING = {
    ...MOCK_CONSORTIUM,
    members: [
        {
            member_id: 'member-1',
            member_name: 'Weak Leader',
            role: 'LEADER',
            participation_pct: 60,
            score: 1.2, // < 1.5 → bloquant
            risk_class: 'VERY_HIGH',
            status: 'ACTIVE',
        },
        {
            member_id: 'member-2',
            member_name: 'OpsLink Partner',
            role: 'MEMBER',
            participation_pct: 40,
            score: 3.5,
            risk_class: 'LOW',
            status: 'ACTIVE',
        },
    ],
};

// Helper : mock l'URL réelle → GET /api/v1/cases/:id/consortium
async function mockConsortium(page: any, body: any) {
    await page.route(`**/cases/${ID}/consortium`, route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAT NOMINAL — Consortium valide (participation = 100%)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Consortium — État nominal (participation 100%)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_CONSORTIUM) })
        );
        await mockConsortium(page, MOCK_CONSORTIUM);
    });

    test('SKELETON — Consortium : composant racine visible', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
    });

    test('Consortium — le score combiné et la table membres sont affichés', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectDataDisplayed();
    });

    test('Consortium — la table affiche 2 membres', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectMembersCount(2);
    });

    test('Consortium — le bouton Force Aggregation est actif (participation = 100%)', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectRecalculateBtnEnabled();
    });

    test('Consortium — le bouton Validate est actif (participation = 100%, leader non bloquant)', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectContinueBtnEnabled();
    });

    test('Consortium — aucune alerte de participation n\'est visible', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await expect(consortiumPage.participationError).not.toBeVisible();
    });

    test('Consortium — le clic sur Validate navigue vers /stress', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.clickContinue();
        await expect(page).toHaveURL(new RegExp(`/cases/${ID}/stress`), { timeout: TIMEOUTS.navigation });
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAT BLOQUANT — Leader avec score critique
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Consortium — Leader bloquant (score < 1.5)', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_CONSORTIUM) })
        );
        await mockConsortium(page, MOCK_CONSORTIUM_LEADER_BLOCKING);
    });

    test('Consortium — l\'alerte "leader bloquant" est visible', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectLeaderBlockingErrorVisible();
    });

    test('Consortium — le bouton Validate est désactivé quand leader bloquant', async ({ page }) => {
        const consortiumPage = new ConsortiumPage(page);
        await page.goto(`/cases/${ID}/consortium`);
        await consortiumPage.expectPageLoaded();
        await consortiumPage.expectContinueBtnDisabled();
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// GUARD — Case non-CONSORTIUM redirigé
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Consortium — Guard : case type SINGLE', () => {

    test.beforeEach(async ({ page }) => {
        await page.route(`**/api/v1/cases/${ID}`, route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_CASE_SINGLE) })
        );
    });

    test('Consortium — un case SINGLE est redirigé hors de /consortium', async ({ page }) => {
        await page.goto(`/cases/${ID}/consortium`);
        // Le consortiumGuard redirige vers /cases/:id ou /dashboard
        // On vérifie juste que l'URL n'est plus /consortium
        await expect(page).not.toHaveURL(new RegExp(`/cases/${ID}/consortium`), { timeout: TIMEOUTS.navigation });
    });

});
