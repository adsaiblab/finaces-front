/**
 * e2e/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');
const TOKEN_PATH = path.join(__dirname, '.auth', 'token.txt');

function getToken(): string {
  try {
    return fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf-8').trim() : '';
  } catch {
    return '';
  }
}

const E2E_TOKEN = getToken();

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.spec.ts',

  fullyParallel: false,
  workers: 1,
  retries: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: '../playwright-report', open: 'never' }],
  ],

  globalSetup: './global-setup.ts',

  use: {
    baseURL: 'http://localhost:4200',
    storageState: AUTH_STATE_PATH,

    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },

  timeout: 60_000,

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE_PATH,
        // ⭐ CLEF DE VOÛTE : injecte finaces_token dans sessionStorage
        // AVANT chaque navigation, AVANT qu'Angular s'initialise.
        // Sans ça, authGuard (production build) voit sessionStorage vide
        // et redirige vers /auth/login → page blanche → tous les tests échouent.
        ...(E2E_TOKEN
          ? {
              initScripts: [
                {
                  content: `sessionStorage.setItem('finaces_token', ${JSON.stringify(E2E_TOKEN)});`,
                },
              ],
            }
          : {}),
      },
    },
  ],

  outputDir: '../playwright-results',
});
