/**
 * e2e/fixtures/auth.fixture.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixture Playwright qui ré-injecte le JWT dans sessionStorage avant chaque test.
 *
 * Pourquoi : storageState ne rejoue PAS sessionStorage. AuthService lit
 * exclusivement sessionStorage['finaces_token']. Sans cette fixture, Angular
 * reçoit getToken() === null → redirect /auth/login → test échoue.
 *
 * Utilisation dans les specs :
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   // Puis utiliser normalement { page } — le token est déjà injecté.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_PATH = path.join(__dirname, '../.auth/token.txt');
const AUTH_STATE_PATH = path.join(__dirname, '../.auth/user.json');

// Lire le token généré par global-setup
function getStoredToken(): string {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `[auth.fixture] Token file not found: ${TOKEN_PATH}\n` +
      `➜ Run global-setup first: npx playwright test --config=e2e/playwright.config.ts`
    );
  }
  return fs.readFileSync(TOKEN_PATH, 'utf-8').trim();
}

// Extension du type de fixtures
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // 'page' standard enrichi avec injection sessionStorage
  page: async ({ page }, use) => {
    const token = getStoredToken();

    // addInitScript s'exécute AVANT tout script de la page (y compris Angular)
    // → sessionStorage est peuplé avant que authGuard ne vérifie isAuthenticated()
    await page.addInitScript((t: string) => {
      sessionStorage.setItem('finaces_token', t);
    }, token);

    await use(page);
  },

  // Fixture nommée pour les specs qui importent explicitement authenticatedPage
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },
});

export { expect };