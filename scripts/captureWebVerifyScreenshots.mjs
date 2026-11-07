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

async function waitForAppShell(page) {
  await page.locator('[data-testid="app-shell-ready"]').waitFor({
    state: 'attached',
    timeout: 90_000,
  });
  await page.locator('[data-testid="startup-loading-overlay"]').waitFor({
    state: 'detached',
    timeout: 90_000,
  });
  await page.waitForTimeout(400);
}

async function assertNoBrokenNeonIcons(page) {
  const broken = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')];
    return imgs
      .filter((img) => {
        const src = img.currentSrc || img.src || '';
        if (!src.includes('/assets/ui/neon/')) return false;
        return img.naturalWidth === 0;
      })
      .map((img) => img.src);
  });
  if (broken.length) {
    throw new Error(`Broken neon images: ${broken.join(', ')}`);
  }
}

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

    await seedLocalFibber(page);
    await page.goto('/');
    await waitForAppShell(page);
    await page.getByTestId('web-player-notice-home').waitFor({ state: 'visible', timeout: 30_000 });
    await assertNoBrokenNeonIcons(page);
    await shot(page, 'landing', viewportKey);

    await page.getByText(/Creating games, hosting lobbies/i).scrollIntoViewIfNeeded();
    await shot(page, 'blocked-create', viewportKey);

    await page.goto('/?join=LIAR7');
    await waitForAppShell(page);
    await page.getByRole('button', { name: 'Continue' }).waitFor({ state: 'visible', timeout: 30_000 });
    await assertNoBrokenNeonIcons(page);
    await shot(page, 'join-code', viewportKey);

    await seedLocalFibber(page);
    await page.goto('/?pofScreen=store');
    await waitForAppShell(page);
    await page.getByTestId('web-player-notice-shop').waitFor({ state: 'visible', timeout: 30_000 });
    const accessSection = page.getByTestId('store-section-access');
    if ((await accessSection.getAttribute('data-expanded')) !== 'true') {
      await accessSection.locator('button').first().click();
    }
    await page.getByText('£9.99').first().waitFor({ state: 'visible', timeout: 20_000 });
    await assertNoBrokenNeonIcons(page);
    await shot(page, 'store', viewportKey);

    await context.close();
  }

  for (const [viewportKey, viewport] of Object.entries(VIEWS)) {
    const context = await browser.newContext({ viewport, baseURL: PREVIEW_URL });
    const page = await context.newPage();
    await clearClientState(page);
    await page.goto('/');
    await waitForAppShell(page);
    await page.getByRole('heading', { name: /Sign in to play/i }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    await assertNoBrokenNeonIcons(page);
    await shot(page, 'sign-in', viewportKey);
    await context.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
