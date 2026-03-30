/**
 * e2e/specs/00-health.spec.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Session 1 — Health Check
 *
 * Validates that both the backend (FastAPI) and the frontend (Angular)
 * are reachable before running any other E2E test.
 * These tests do NOT require authentication.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import { API_BASE_URL, FRONTEND_BASE_URL } from '../fixtures/test-data';

test.describe('00 — Health Check', () => {
  // Health tests don't need the authenticated storageState
  test.use({ storageState: { cookies: [], origins: [] } });

  test('backend API is reachable and returns OK', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`, {
      timeout: 10_000,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'OK');
  });

  test('frontend Angular app is reachable', async ({ page }) => {
    const response = await page.goto(FRONTEND_BASE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });

    // Accept 200 (app served) or 304 (cached)
    expect(response?.status()).toBeLessThan(400);
    expect(response?.ok() || response?.status() === 304).toBeTruthy();
  });
});
