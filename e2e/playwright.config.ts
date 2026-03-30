/**
 * e2e/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');
const TOKEN_PATH = path.join(__dirname, '.auth', 'token.txt');

// Lire le token si disponible (sera undefined au premier lancement, c'est OK)
function getTokenForInitScript(): string {
  try {
    return fs.existsSync(TOKEN_PATH) ? fs.readFileSync(TOKEN_PATH, 'utf-8').trim() : '';
  } catch {
    return '';
  }
}

const E2E_TOKEN = getTokenForInitScript();

export default defineConfig({
  // playwright.config.ts est dans e2e/ → chemins RELATIFS à e2e/
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

    // storageState rejoue localStorage + cookies (pas sessionStorage)
    storageState: AUTH_STATE_PATH,

    // ⭐ CLEF DE VOÛTE : addInitScript injecte le JWT dans sessionStorage
    // avant chaque navigation, AVANT qu'Angular s'initialise.
    // Sans ça, authGuard redirige toujours vers /auth/login.
    ...(E2E_TOKEN
      ? {
        contextOptions: {
          // Note : on passe par auth.fixture.ts pour les specs qui en ont besoin,
          // et par storageState enrichi pour les autres.
        },
      }
      : {}),

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
        // storageState par projet (surcharge le use global si nécessaire)
        storageState: AUTH_STATE_PATH,
      },
      // setupFilePath injecte addInitScript pour TOUS les tests de ce projet
      // → pas besoin d'importer auth.fixture dans chaque spec
      setup: undefined,
    },
  ],

  outputDir: '../playwright-results',
});