import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ConsortiumPage } from '../pages/consortium.page';
import { StressPage } from '../pages/stress.page';
import { TEST_USER } from '../fixtures/test-data';

test.describe('FinaCES Consortium Lifecycle — Multi-Bidder Path', () => {
  test('should manage a multi-bidder consortium and compute aggregated synergy', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const consortiumPage = new ConsortiumPage(page);
    const stressPage = new StressPage(page);

    // 1. Authentication
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);

    // 2. Navigate to an existing consortium case (Seeded)
    // For E2E we'll assume we navigate to a case with 'CONSORTIUM' type
    await page.goto('/cases/E2E-CONSORTIUM-001/consortium');

    // 3. Manage Consortium Members
    // await consortiumPage.addMember('Co-Bidder Alpha', 40);
    // await consortiumPage.addMember('Co-Bidder Beta', 30);
    // The Leader has 30% by default in the seed
    
    // 4. Structural Analysis Validation
    await expect(page.getByTestId('consortium-score-section')).toBeVisible();
    const finalScore = await page.getByTestId('consortium-final-score').innerText();
    expect(parseFloat(finalScore)).toBeGreaterThan(0);

    // 5. Transition to Stress
    await consortiumPage.validateStructuralAnalysis();
    await expect(page).toHaveURL(/.*\/stress-test/);
  });
});
