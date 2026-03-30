import { Page, Locator, expect } from '@playwright/test';
import { FRONTEND_BASE_URL } from '../fixtures/test-data';

/**
 * Rapport Page Object
 * Handles report generation, finalization, and export.
 */
export class RapportPage {
  readonly page: Page;
  readonly buildBtn: Locator;
  readonly finalizeBtn: Locator;
  readonly exportPdfBtn: Locator;
  readonly finalScore: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buildBtn = page.getByTestId('btn-build-report');
    this.finalizeBtn = page.getByTestId('btn-finalize-report');
    this.exportPdfBtn = page.getByTestId('btn-export-pdf');
    this.finalScore = page.getByTestId('final-mcc-score');
  }

  async buildReport() {
    await this.buildBtn.click();
    // Wait for rebuild option (indicates build finished)
    await expect(this.buildBtn).toContainText(/Rebuild|Generate/);
  }

  async finalize() {
    if (await this.finalizeBtn.isVisible()) {
      await this.finalizeBtn.click();
    }
  }

  async downloadPdf() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportPdfBtn.click(),
    ]);
    return download.path();
  }

  async verifyFinalScore(expected: string | number) {
    await expect(this.finalScore).toContainText(expected.toString());
  }
}
