/**
 * e2e/global-setup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright globalSetup — runs ONCE before the entire test suite.
 *
 * Responsibilities:
 *   1. Authenticate against the real backend API (POST /auth/login)
 *   2. Save the browser storage state (JWT token as Bearer header) to
 *      e2e/.auth/user.json so all tests reuse it — zero login repetition.
 *
 * The auth flow uses the OAuth2PasswordRequestForm format expected by
 * finaces-api/app/api/auth.py: form-encoded { username, password }.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_USER, API_BASE_URL, FRONTEND_BASE_URL } from './fixtures/test-data';

const AUTH_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

export default async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('\n[global-setup] Starting E2E authentication...');

  // ── 1. Ensure .auth directory exists ──────────────────────────────────────
  const authDir = path.dirname(AUTH_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // ── 2. Call the backend login endpoint directly (no browser needed) ───────
  //    POST /auth/login — OAuth2PasswordRequestForm (application/x-www-form-urlencoded)
  const formData = new URLSearchParams({
    username: TEST_USER.email,    // Backend expects "username" = email
    password: TEST_USER.password,
  });

  let accessToken: string;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Login failed: HTTP ${response.status} — ${body}\n` +
        `Make sure the backend is running and seed_e2e.py has been executed.`
      );
    }

    const data = (await response.json()) as { access_token: string; token_type: string };
    accessToken = data.access_token;
    console.log(`[global-setup] ✅ Login successful for: ${TEST_USER.email}`);
  } catch (err) {
    console.error('[global-setup] ❌ Authentication failed:', err);
    throw err;
  }

  // ── 3. Save storage state: inject JWT into sessionStorage ─────────────────
  //    AuthService (auth.service.ts) stores the token in:
  //      sessionStorage.setItem('finaces_token', token)
  //    The JWT interceptor reads: authService.getToken() → sessionStorage.getItem('finaces_token')
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: FRONTEND_BASE_URL,
  });

  const page = await context.newPage();

  // Navigate to the frontend to ensure the correct origin is set
  await page.goto(FRONTEND_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  // Inject the token into localStorage so Playwright's storageState captures it
  // (sessionStorage is ignored by storageState by default)
  await page.evaluate((token: string) => {
    localStorage.setItem('finaces_token_e2e_bridge', token);
  }, accessToken);

  // Save context state (localStorage + cookies)
  await context.storageState({ path: AUTH_STATE_PATH });

  await browser.close();
  console.log(`[global-setup] ✅ Storage state saved to: ${AUTH_STATE_PATH}`);
}
