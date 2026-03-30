import { Page, Locator, expect } from '@playwright/test';

/**
 * Gate Page Object
 * Handles document verification and processing logic.
 */
export class GatePage {
  readonly page: Page;
  readonly evaluateBtn: Locator;
  readonly sealBtn: Locator;
  readonly goToFinancialsBtn: Locator;
  readonly checklistItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.evaluateBtn = page.getByTestId('gate-evaluate-btn');
    this.sealBtn = page.getByTestId('gate-seal-btn');
    this.goToFinancialsBtn = page.getByTestId('gate-go-to-financials-btn');
    this.checklistItems = page.getByTestId('gate-checklist-item');
  }

  async runEvaluation() {
    await expect(this.evaluateBtn).toBeVisible();
    await this.evaluateBtn.click();
    // Wait for evaluation to complete (IA processing)
    await expect(this.evaluateBtn).not.toBeVisible({ timeout: 30000 });
  }

  async sealAndContinue() {
    await expect(this.sealBtn).toBeVisible();
    await this.sealBtn.click();
    await expect(this.goToFinancialsBtn).toBeVisible();
    await this.goToFinancialsBtn.click();
  }

  async expectChecklistProgress(minimumCount: number) {
    const count = await this.checklistItems.count();
    expect(count).toBeGreaterThanOrEqual(minimumCount);
  }
}
async function uploadFile(page: Page, filePath: string) {
  // Common helper for document-column dropzone
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.locator('.dropzone-box').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);
}
