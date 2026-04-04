/**
 * e2e/global-setup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Playwright globalSetup — runs ONCE before the entire test suite.
 *
 * STRATÉGIE AUTH (critique) :
 *   AuthService stocke le JWT dans sessionStorage['finaces_token'].
 *   storageState de Playwright ne capture PAS sessionStorage.
 *   Solution : appel API direct → injection dans sessionStorage via
 *   page.evaluate() → sauvegarde enrichie du storageState JSON avec
 *   un champ 'sessionStorageEntries' custom lu par auth.fixture.ts.
 *
 *   Pour les tests sans fixture (test.use({ storageState })), on utilise
 *   un addInitScript injecté par playwright.config.ts via
 *   une variable d'env E2E_TOKEN écrite dans .auth/token.txt.
 *
 * RÉSOLUTION E2E_CASE_ID :
 *   Le case_id est un UUID généré dynamiquement par seed_e2e.py.
 *   Après le login, on appelle GET /cases?search=E2E-TEST-DOSSIER-001
 *   pour récupérer l'UUID réel et l'assigner à process.env['E2E_CASE_ID'].
 *   Les fixtures/test-data.ts lisent process.env['E2E_CASE_ID'] en priorité
 *   avec un UUID fallback si le seed n'a pas été lancé.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_USER, API_BASE_URL, FRONTEND_BASE_URL } from './fixtures/test-data';

const AUTH_DIR = path.join(__dirname, '.auth');
const AUTH_STATE_PATH = path.join(AUTH_DIR, 'user.json');
const TOKEN_PATH = path.join(AUTH_DIR, 'token.txt');

export default async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('\n[global-setup] Starting E2E authentication...');

  // ── 1. Ensure .auth directory exists ─────────────────────────────────────────
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // ── 2. Call the backend login endpoint directly ────────────────────────────
  const formData = new URLSearchParams({
    username: TEST_USER.email,
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
        `➜ Make sure the backend is running and seed_e2e.py has been executed.\n` +
        `➜ API URL: ${API_BASE_URL}`
      );
    }

    const data = (await response.json()) as { access_token: string; token_type: string };
    accessToken = data.access_token;
    console.log(`[global-setup] ✅ JWT obtained for: ${TEST_USER.email}`);
  } catch (err) {
    console.error('[global-setup] ❌ Authentication failed:', err);
    throw err;
  }

  // ── 2b. Resolve E2E_CASE_ID from backend ───────────────────────────────────
  // GET /cases?search=... fait un ILIKE — on filtre ensuite sur market_reference exact.
  // Bloc non-bloquant : si la route échoue, le fallback UUID de test-data.ts s'applique.
  try {
    const caseRes = await fetch(
      `${API_BASE_URL}/cases?search=E2E-TEST-DOSSIER-001`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (caseRes.ok) {
      const cases = (await caseRes.json()) as Array<{
        id: string;
        market_reference: string;
      }>;
      // Correspondance exacte pour éviter les faux positifs du ILIKE
      const targetCase = cases.find(
        (c) => c.market_reference === 'E2E-TEST-DOSSIER-001'
      );
      if (targetCase) {
        process.env['E2E_CASE_ID'] = targetCase.id;
        console.log(`[global-setup] ✅ E2E_CASE_ID resolved: ${targetCase.id}`);
      } else {
        console.warn(
          '[global-setup] ⚠️ E2E_CASE_ID not found in /cases response — ' +
          'using fallback UUID from test-data.ts. ' +
          'Run scripts/seed_e2e.py first.'
        );
      }
    } else {
      console.warn(
        `[global-setup] ⚠️ GET /cases returned HTTP ${caseRes.status} — ` +
        'E2E_CASE_ID not resolved, falling back to test-data.ts default.'
      );
    }
  } catch (err) {
    console.warn('[global-setup] ⚠️ Could not resolve E2E_CASE_ID:', err);
  }

  // ── 3. Sauvegarder le token brut pour usage par addInitScript ────────────────
  fs.writeFileSync(TOKEN_PATH, accessToken, 'utf-8');
  console.log(`[global-setup] ✅ Token saved to: ${TOKEN_PATH}`);

  // ── 4. Lancer un browser headless pour injecter dans sessionStorage ──────────
  //    storageState ne capture pas sessionStorage → on utilise page.evaluate
  //    pour injecter, puis on sauvegarde localStorage+cookies (storageState
  //    standard) ET on enrichit le JSON avec sessionStorage manuellement.
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: FRONTEND_BASE_URL });
  const page = await context.newPage();

  // Naviguer vers la racine pour établir l'origine correcte
  await page.goto(FRONTEND_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15_000 });

  // Injecter le token dans sessionStorage (ce qu'Angular lit)
  await page.evaluate((token: string) => {
    sessionStorage.setItem('finaces_token', token);
  }, accessToken);

  // Également dans localStorage comme fallback
  await page.evaluate((token: string) => {
    localStorage.setItem('finaces_token', token);
    localStorage.setItem('finaces_token_e2e_bridge', token);
  }, accessToken);

  // Sauvegarder le storageState standard (localStorage + cookies)
  await context.storageState({ path: AUTH_STATE_PATH });

  // ── 5. Enrichir le storageState JSON avec sessionStorage ────────────────────
  //    On lit le fichier généré, on y ajoute les entries sessionStorage
  //    pour que auth.fixture.ts puisse les rejouer via addInitScript.
  const storageStateRaw = fs.readFileSync(AUTH_STATE_PATH, 'utf-8');
  const storageStateJson = JSON.parse(storageStateRaw);

  // Ajouter sessionStorage entries dans le JSON (champ custom)
  storageStateJson.sessionStorageEntries = [
    { origin: FRONTEND_BASE_URL, key: 'finaces_token', value: accessToken },
  ];

  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(storageStateJson, null, 2));

  await browser.close();
  console.log(`[global-setup] ✅ Enriched storageState saved to: ${AUTH_STATE_PATH}`);
  console.log(`[global-setup] ✅ sessionStorage['finaces_token'] injected in state.`);
}
