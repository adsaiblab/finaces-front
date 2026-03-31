/**
 * e2e/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

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
        // NOTE: JWT sessionStorage injection is handled by auth.fixture.ts
        // via page.addInitScript() at runtime (after global-setup writes token.txt).
        // DO NOT read token.txt here — playwright.config.ts is evaluated
        // BEFORE global-setup, so token.txt does not exist yet at this point.
      },
    },
  ],

  outputDir: '../playwright-results',
});
