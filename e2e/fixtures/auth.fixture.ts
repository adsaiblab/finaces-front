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
   * The storageState from playwright.config.ts is automatically applied
   * by Playwright to every new browser context — so this fixture
   * simply returns the default `page` under a semantic name.
   */
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },
});

export { expect };
