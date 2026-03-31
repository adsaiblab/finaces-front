/**
 * e2e/fixtures/auth.fixture.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixture Playwright qui ré-injecte le JWT dans sessionStorage avant chaque test.
 *
 * Pourquoi : storageState ne rejoue PAS sessionStorage. AuthService lit
 * exclusivement sessionStorage['finaces_token']. Sans cette fixture, authGuard
 * (en production build) redirige toujours vers /auth/login.
 *
 * NOTE : playwright.config.ts injecte déjà le token via initScripts au niveau
 * projet. Cette fixture est un filet de sécurité supplémentaire pour les
 * tests qui utilisent explicitement { page } depuis cet import.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_PATH = path.join(__dirname, '../.auth/token.txt');

function getStoredToken(): string {
  try {
    return fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf-8').trim() : '';
  } catch {
    return '';
  }
}

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  page: async ({ page }, use) => {
    const token = getStoredToken();
    if (token) {
      // addInitScript s'exécute AVANT tout script de la page (y compris Angular)
      // → sessionStorage est peuplé avant que authGuard ne vérifie isAuthenticated()
      await page.addInitScript((t: string) => {
        sessionStorage.setItem('finaces_token', t);
      }, token);
    }
    await use(page);
  },

  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },
});

export { expect };
