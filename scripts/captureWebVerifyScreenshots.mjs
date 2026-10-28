/**
 * Capture PR website verification screenshots (join-only build).
 * Usage: node scripts/captureWebVerifyScreenshots.mjs
 * Expects preview on PREVIEW_URL (default http://127.0.0.1:4176).
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/assets/ui/neon/web-verify');
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:4176';

const VIEWS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

async function clearClientState(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function seedLocalFibber(page) {
  await page.addInitScript(() => {
    localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
    localStorage.setItem(
      'imposter-account-session-v2',
      JSON.stringify({
        userId: 'verify-local-user',
        displayName: 'Web Verify',
        tierId: 'fibber',
        addonTwistTruth: false,
        unlockedThemePackIds: [],
        authProvider: 'local',
      }),
    );
  });
}

async function shot(page, name, viewportKey) {
  const suffix = viewportKey === 'desktop' ? 'desktop-1280x800' : 'mobile-390x844';
  const file = path.join(OUT_DIR, `web-verify-${name}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('wrote', file);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const [viewportKey, viewport] of Object.entries(VIEWS)) {
    const context = await browser.newContext({ viewport, baseURL: PREVIEW_URL });
    const page = await context.newPage();

    // Landing (signed in, website player notice)
    await seedLocalFibber(page);
    await page.goto('/');
    await page.getByTestId('web-player-notice-home').waitFor({ state: 'visible', timeout: 60_000 });
    await shot(page, 'landing', viewportKey);

    // Blocked create / host messaging (same screen, ensure notice in view)
    await page.getByText(/Creating games, hosting lobbies/i).scrollIntoViewIfNeeded();
    await shot(page, 'blocked-create', viewportKey);

    // Join by code deep link
    await page.goto('/?join=LIAR7');
    await page.getByRole('button', { name: 'Continue' }).waitFor({ state: 'visible', timeout: 30_000 });
    await shot(page, 'join-code', viewportKey);

    // Store + device notice (shop variant)
    await seedLocalFibber(page);
    await page.goto('/?pofScreen=store');
    await page.getByTestId('web-player-notice-shop').waitFor({ state: 'visible', timeout: 60_000 });
    await shot(page, 'store', viewportKey);

    await context.close();
  }

  // Sign in / register (account gate, cloud panel when lobby auth is up)
  for (const [viewportKey, viewport] of Object.entries(VIEWS)) {
    const context = await browser.newContext({ viewport, baseURL: PREVIEW_URL });
    const page = await context.newPage();
    await clearClientState(page);
    await page.goto('/');
    await page.getByRole('heading', { name: /Sign in to play/i }).waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    const cloudHeading = page.getByText('Cloud account', { exact: false });
    if (await cloudHeading.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await cloudHeading.scrollIntoViewIfNeeded();
    }
    await shot(page, 'sign-in', viewportKey);
    await context.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
