/**
 * e2e/fixtures/auth.fixture.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright test extension providing a pre-authenticated page.
 *
 * Usage in specs:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   test('my test', async ({ authenticatedPage }) => { ... });
 *
 * The `authenticatedPage` fixture:
 *   - Inherits the storageState set in playwright.config.ts (from global-setup)
 *   - Provides a `Page` object already "logged in" via sessionStorage token
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test as base, expect, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Provides a page with the JWT already in sessionStorage.
   * We copy it from localStorage (where it was saved by global-setup)
   * into sessionStorage where AuthService expects it.
   */
  authenticatedPage: async ({ page }, use) => {
    // Inject the bridge script before the page loads
    await page.addInitScript(() => {
      const token = localStorage.getItem('finaces_token_e2e_bridge');
      if (token) {
        sessionStorage.setItem('finaces_token', token);
      }
    });

    await use(page);
  },
});

export { expect };
