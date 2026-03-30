/**
 * e2e/playwright.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright configuration for FinaCES E2E integration tests.
 *
 * Stack:
 *   - Frontend : Angular 21, ng serve → http://localhost:4200
 *   - Backend  : FastAPI,   uvicorn  → http://localhost:8000
 *   - Browser  : Chromium (Session 1 — expand in later sessions if needed)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

// Path where globalSetup stores the authenticated session
const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

export default defineConfig({
  // ── Test discovery ──────────────────────────────────────────────────────
  testDir: './e2e/specs',
  testMatch: '**/*.spec.ts',

  // ── Parallelism ─────────────────────────────────────────────────────────
  // Run files in parallel; tests within a file run sequentially (important
  // for the happy-path which is a sequential stateful flow).
  fullyParallel: false,
  workers: 1, // Sequential in Session 1 — safe for stateful E2E flow

  // ── Retries ─────────────────────────────────────────────────────────────
  retries: 1, // 1 retry on flaky failures

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
    storageState: AUTH_STATE_PATH,

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record trace on first retry (useful for debugging)
    trace: 'on-first-retry',

    // Video recording on failure
    video: 'retain-on-failure',

    // Default navigation timeout
    navigationTimeout: 10_000,

    // Default action timeout
    actionTimeout: 10_000,
  },

  // ── Global timeout per test ─────────────────────────────────────────────
  timeout: 60_000, // 60s — generous for computations (scoring, IA, PDF export)

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
