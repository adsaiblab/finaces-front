/**
 * playwright.config.ts  (root of finaces-front)
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright configuration for FinaCES E2E integration tests.
 *
 * Stack:
 *   - Frontend : Angular 21, ng serve → http://localhost:4200
 *   - Backend  : FastAPI,   uvicorn  → http://localhost:8000
 *   - Browser  : Chromium
 *
 * Run:
 *   npm run e2e           → headless
 *   npm run e2e:headed    → with visible browser
 *   npm run e2e:ui        → Playwright UI mode
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Path where globalSetup stores the authenticated session
const AUTH_STATE_PATH = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────────────
  testDir: './e2e/specs',
  testMatch: '**/*.spec.ts',

  // ── Parallelism ─────────────────────────────────────────────────────────
  // Sequential: the happy-path is a stateful flow and isolation specs share
  // the same test case in the DB — parallel execution would cause race conditions.
  fullyParallel: false,
  workers: 1,

  // ── Retries ─────────────────────────────────────────────────────────────
  retries: 1,

  // ── Reporters ───────────────────────────────────────────────────────────
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // ── Global setup (runs once before all tests) ───────────────────────────
  globalSetup: './e2e/global-setup.ts',

  // ── Shared settings for all tests ───────────────────────────────────────
  use: {
    // Base URL — Angular dev server
    baseURL: 'http://localhost:4200',

    // Reuse the authenticated session stored by global-setup
    // (JWT in sessionStorage under key 'finaces_token')
    storageState: AUTH_STATE_PATH,

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record trace on first retry (useful for debugging CI failures)
    trace: 'on-first-retry',

    // Video recording on failure
    video: 'retain-on-failure',

    // Default navigation timeout
    navigationTimeout: 10_000,

    // Default action timeout (click, fill, etc.)
    actionTimeout: 10_000,
  },

  // ── Global timeout per test ─────────────────────────────────────────────
  // 60s — generous for heavy computations (scoring, IA prediction, PDF export)
  timeout: 60_000,

  // ── Browser configuration ────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // ── Output directories ───────────────────────────────────────────────────
  outputDir: 'playwright-results',
});
