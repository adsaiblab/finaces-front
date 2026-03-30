import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Expert Review Page Object
 * Handles final conclusion submission and case closing.
 */
export class ExpertPage {
  readonly page: Page;
  readonly conclusionTextarea: Locator;
  readonly submitReviewBtn: Locator;
  readonly closeCaseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.conclusionTextarea = page.getByTestId('textarea-expert-conclusion');
    this.submitReviewBtn = page.getByTestId('btn-submit-expert-review');
    this.closeCaseBtn = page.getByTestId('btn-close-case');
  }

  async submitReview(text: string) {
    await this.conclusionTextarea.fill(text);
    await this.submitReviewBtn.click();
    // Wait for submission success indicator (button disabled or toast)
    await expect(this.closeCaseBtn).toBeEnabled();
  }

  async closeCase() {
    await this.closeCaseBtn.click();
    await this.page.waitForURL(/.*\/rapport/);
  }
}
