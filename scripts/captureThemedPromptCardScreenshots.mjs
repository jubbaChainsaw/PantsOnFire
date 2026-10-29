/**
 * Capture themed prompt card reveal screenshots for web-verify.
 * Usage:
 *   npm run build
 *   npx vite preview --host 127.0.0.1 --port 4177 &
 *   PREVIEW_URL=http://127.0.0.1:4177 node scripts/captureThemedPromptCardScreenshots.mjs
 *
 * For Gangsters 18+ art, build preview with VITE_E2E_FORCE_ADULT_MODE=1.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/assets/ui/neon/web-verify');
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:4177';

const CAPTURES = [
  { slug: 'pirates', theme: 'Pirates', adult: false },
  { slug: 'cowboys', theme: 'Cowboys', adult: false },
  { slug: 'gangsters-18', theme: 'Gangsters', adult: true },
];

async function waitForAppShell(page) {
  await page.locator('[data-testid="app-shell-ready"]').waitFor({
    state: 'attached',
    timeout: 90_000,
  });
  await page.locator('[data-testid="startup-loading-overlay"]').waitFor({
    state: 'detached',
    timeout: 90_000,
  });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

function applyThemeSeed({ themeName }) {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem('imposter-theme-v3', themeName);
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'themed-card-verify',
      displayName: 'Card Verify',
      tierId: 'local_liar',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
  );
}

async function reachFlippedPromptCard(page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click({
    timeout: 30_000,
  });
  await page.getByTestId('start-match').click({ timeout: 30_000 });
  await page.getByTestId('intro-skip').click({ timeout: 30_000 });
  await page.getByTestId('rules-continue').click({ timeout: 30_000 });

  await page.getByTestId('round-type-prompt').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.getByTestId('round-type-prompt').click();

  const randomCategory = page.getByTestId('choose-category-random');
  if (await randomCategory.isVisible().catch(() => false)) {
    await randomCategory.click({ timeout: 15_000 });
  } else {
    await page.locator('[data-testid^="category-"]').first().click({ timeout: 15_000 });
  }

  await page.getByTestId('host-intro-skip').click({ timeout: 30_000 }).catch(async () => {
    await page.getByTestId('rules-continue').click({ timeout: 15_000 }).catch(() => {});
  });

  await page.getByTestId('reveal-ready').waitFor({ state: 'visible', timeout: 45_000 });
  await page.getByTestId('reveal-ready').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('themed-prompt-card').waitFor({
    state: 'visible',
    timeout: 20_000,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const capture of CAPTURES) {
    const onlySlug = String(process.env.THEME_CAPTURE_SLUG || '').trim();
    if (onlySlug && capture.slug !== onlySlug) continue;
    if (capture.adult && process.env.VITE_E2E_FORCE_ADULT_MODE !== '1') {
      console.warn(
        `Skipping ${capture.slug}: rebuild preview with VITE_E2E_FORCE_ADULT_MODE=1 for 18+ card art.`,
      );
      continue;
    }

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(applyThemeSeed, { themeName: capture.theme });
    await page.goto('/');
    await waitForAppShell(page);
    await reachFlippedPromptCard(page);

    const card = page.getByTestId('themed-prompt-card');
    const file = path.join(
      OUT_DIR,
      `web-verify-themed-prompt-${capture.slug}-desktop-1280x800.png`,
    );
    await card.screenshot({ path: file });
    console.log('wrote', file);
    await context.close();
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
