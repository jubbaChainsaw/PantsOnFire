/**
 * Capture Double Take (pairs) round verification screenshots.
 * Usage:
 *   VITE_E2E_FORCE_ROUND_TYPE=pairs VITE_E2E_FAST_TIMERS=1 npm run build
 *   npx vite preview --host 127.0.0.1 --port 4177
 *   PREVIEW_URL=http://127.0.0.1:4177 node scripts/captureDoubleTakeScreenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/assets/ui/neon/web-verify');
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:4177';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, suffix: 'desktop-1280x800' },
  mobile: { width: 390, height: 844, suffix: 'mobile-390x844' },
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
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

function applyHostSeed() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'double-take-verify',
      displayName: 'Host Verify',
      tierId: 'local_liar',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
  );
  localStorage.setItem(
    'imposter-enabled-picture-packs-v1',
    JSON.stringify({ 'picture-pairs-v1': true }),
  );
}

async function shot(page, name, viewportKey) {
  const suffix = VIEWPORTS[viewportKey].suffix;
  const file = path.join(OUT_DIR, `web-verify-double-take-${name}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('wrote', file);
}

async function waitForCardFront(page) {
  await page.getByTestId('double-take-square-card').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="double-take-square-card"]')?.getAttribute('data-card-face') ===
      'front',
    null,
    { timeout: 20_000 },
  );
  await page.waitForTimeout(900);
}

async function reachFirstPlayerReveal(page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
  await page.getByTestId('start-match').click({ timeout: 30_000 });
  await page.getByTestId('intro-skip').click({ timeout: 30_000 });
  await page.getByTestId('rules-continue').click({ timeout: 30_000 });

  await page.getByTestId('round-type-pairs').waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByTestId('round-type-pairs').click();

  await page.getByTestId('host-intro-skip').click({ timeout: 30_000 }).catch(async () => {
    await page.getByTestId('rules-continue').click({ timeout: 15_000 }).catch(() => {});
  });

  await page.getByTestId('reveal-ready').waitFor({ state: 'visible', timeout: 45_000 });
  await page.getByTestId('reveal-ready').click();
  await waitForCardFront(page);
}

async function passPhoneReveals(page) {
  for (let step = 0; step < 12; step += 1) {
    if (await page.getByTestId('discussion-continue').isVisible().catch(() => false)) {
      return;
    }
    if (await page.getByTestId('reveal-ready').isVisible().catch(() => false)) {
      await page.getByTestId('reveal-ready').click();
      await waitForCardFront(page);
    }
    if (await page.getByTestId('reveal-next').isVisible().catch(() => false)) {
      await page.getByTestId('reveal-next').click();
      await page.waitForTimeout(400);
    }
  }
}

async function completeLocalVoting(page) {
  for (let i = 0; i < 24; i += 1) {
    const submit = page.getByTestId('submit-votes');
    if (await submit.isEnabled().catch(() => false)) {
      await submit.click();
      return;
    }
    const voteBtn = page.locator('[data-testid^="vote-for-"]').first();
    if (await voteBtn.isVisible().catch(() => false)) {
      await voteBtn.click();
      await page.waitForTimeout(200);
      continue;
    }
    await page.waitForTimeout(300);
  }
  await page.getByTestId('submit-votes').click({ timeout: 15_000 });
}

async function advanceLiarRevealToPairsPanel(page) {
  for (let i = 0; i < 6; i += 1) {
    if (await page.getByTestId('double-take-pairs-reveal').isVisible().catch(() => false)) {
      return;
    }
    const next = page.getByRole('button', { name: /Next line/i });
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(800);
      continue;
    }
    await page.waitForTimeout(1200);
  }
  await page.getByTestId('double-take-pairs-reveal').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

async function capturePlayerReveals(page, viewportKey) {
  await reachFirstPlayerReveal(page);
  await shot(page, 'truth-player-reveal', viewportKey);

  await page.getByTestId('reveal-next').click({ timeout: 15_000 });
  await page.waitForTimeout(500);
  await page.getByTestId('reveal-ready').click({ timeout: 15_000 });
  await waitForCardFront(page);
  await shot(page, 'liar-player-reveal', viewportKey);
}


async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  for (const [viewportKey, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({
      viewport,
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(applyHostSeed);
    await page.goto('/');
    await waitForAppShell(page);

    if (viewportKey === 'desktop') {
      await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
      await page.getByTestId('start-match').click({ timeout: 30_000 });
      await page.getByTestId('intro-skip').click({ timeout: 30_000 });
      await page.getByTestId('rules-continue').click({ timeout: 30_000 });
      await page.getByTestId('round-type-pairs').waitFor({ state: 'visible', timeout: 30_000 });
      await shot(page, 'mode-select', viewportKey);
    }

    await page.goto('/');
    await waitForAppShell(page);
    await capturePlayerReveals(page, viewportKey);

    if (viewportKey === 'desktop') {
      await page.goto('/');
      await waitForAppShell(page);
      await reachFirstPlayerReveal(page);
      await passPhoneReveals(page);
      await page.getByTestId('discussion-continue').click({ timeout: 20_000 });
      await completeLocalVoting(page);
      await advanceLiarRevealToPairsPanel(page);
      await shot(page, 'end-round-pair-reveal-liar-screen', viewportKey);
      await page.getByRole('button', { name: /Continue/i }).click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      await page.getByTestId('double-take-pairs-reveal').waitFor({
        state: 'visible',
        timeout: 20_000,
      });
      await shot(page, 'end-round-pair-reveal-results', viewportKey);
    }

    await context.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
