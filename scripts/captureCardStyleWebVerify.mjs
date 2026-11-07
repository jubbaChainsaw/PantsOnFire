/**
 * Card style + Double Take font verification shots for public/assets/ui/neon/web-verify/.
 *
 *   npm run build
 *   npx vite preview --host 127.0.0.1 --port 4177 &
 *   PREVIEW_URL=http://127.0.0.1:4177 node scripts/captureCardStyleWebVerify.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('public/assets/ui/neon/web-verify');
const PREVIEW_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:4177';
const THEME = 'Pirates';

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

function baseLocalStorage(themeName, { altUnlocked = false, cardStyleByTheme = {} } = {}) {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem('imposter-theme-v3', themeName);
  const authProvider = altUnlocked ? 'supabase' : 'local';
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'card-style-verify',
      displayName: 'Verify',
      tierId: 'local_liar',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider,
      unlockedAltCardThemeKeys: altUnlocked ? [themeName] : [],
    }),
  );
  if (altUnlocked) {
    localStorage.setItem(
      'imposter-player-profile-v1',
      JSON.stringify({
        version: 1,
        stats: {
          gamesPlayed: 0,
          gamesHosted: 0,
          gamesHostedCompleted: 1,
          gamesWon: 0,
          timesLiar: 0,
          timesLiarNotCaught: 0,
          timesLiarCaught: 0,
          timesAccusedInnocent: 0,
          votesCorrect: 0,
          votesIncorrect: 0,
          themesPlayed: {},
          roundTypesPlayed: {},
        },
        recentGames: [],
        achievementProgress: {},
        unlockedAchievementIds: [],
        unlockedDefaultBackSlugs: [],
        achievementUnlockedThemeNames: [],
        selectedDefaultBackSlug: 'classic',
        referralUnlockToastPending: false,
        unlockedAltCardThemeKeys: [themeName],
      }),
    );
  }
  localStorage.setItem(
    'imposter-theme-alt-card-unlocks-v1',
    JSON.stringify(altUnlocked ? [themeName] : []),
  );
  localStorage.setItem(
    'imposter-theme-card-style-by-theme-v1',
    JSON.stringify(cardStyleByTheme),
  );
}

async function openSetup(page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
  await page.getByTestId('theme-card-style-picker').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

async function reachFlippedPromptCard(page) {
  await page.getByTestId('start-match').click({ timeout: 30_000 });
  await page.getByTestId('intro-skip').click({ timeout: 30_000 });
  await page.getByTestId('rules-continue').click({ timeout: 30_000 });
  await page.getByTestId('round-type-choice-grid').waitFor({
    state: 'visible',
    timeout: 30_000,
  });
  await page.getByTestId('round-type-prompt').click({ timeout: 30_000 });
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
  await page.getByTestId('themed-prompt-card').waitFor({ state: 'visible', timeout: 20_000 });
}

async function reachDoubleTakeReveal(page) {
  await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
  await page.getByTestId('start-match').click({ timeout: 30_000 });
  await page.getByTestId('intro-skip').click({ timeout: 30_000 });
  await page.getByTestId('rules-continue').click({ timeout: 30_000 });
  await page.getByTestId('round-type-pairs').click({ timeout: 30_000 });
  await page.getByTestId('choose-category-random').click({ timeout: 30_000 }).catch(async () => {
    await page.locator('[data-testid^="category-"]').first().click();
  });
  await page.getByTestId('host-intro-skip').click({ timeout: 30_000 }).catch(() => {});
  await page.getByTestId('reveal-ready').waitFor({ state: 'visible', timeout: 45_000 });
  await page.getByTestId('reveal-ready').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('double-take-reveal-label').waitFor({
    state: 'visible',
    timeout: 20_000,
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(baseLocalStorage, { themeName: THEME, altUnlocked: false });
    await page.goto('/');
    await waitForAppShell(page);
    await openSetup(page);
    await page.screenshot({
      path: path.join(OUT_DIR, 'web-verify-card-style-picker-locked-1280x800.png'),
      fullPage: false,
    });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
      localStorage.setItem('imposter-theme-v3', 'Default');
      localStorage.setItem(
        'imposter-account-session-v2',
        JSON.stringify({
          userId: 'card-style-verify',
          displayName: 'Card Verify',
          tierId: 'local_liar',
          addonTwistTruth: false,
          unlockedThemePackIds: [],
          authProvider: 'supabase',
          unlockedAltCardThemeKeys: ['Default'],
        }),
      );
      localStorage.setItem(
        'imposter-player-profile-v1',
        JSON.stringify({
          version: 1,
          stats: {
            gamesPlayed: 0,
            gamesHosted: 0,
            gamesHostedCompleted: 1,
            gamesWon: 0,
            timesLiar: 0,
            timesLiarNotCaught: 0,
            timesLiarCaught: 0,
            timesAccusedInnocent: 0,
            votesCorrect: 0,
            votesIncorrect: 0,
            themesPlayed: {},
            roundTypesPlayed: {},
          },
          recentGames: [],
          achievementProgress: {},
          unlockedAchievementIds: [],
          unlockedDefaultBackSlugs: [],
          achievementUnlockedThemeNames: [],
          selectedDefaultBackSlug: 'classic',
          referralUnlockToastPending: false,
          unlockedAltCardThemeKeys: ['Default'],
        }),
      );
      localStorage.setItem(
        'imposter-theme-card-style-by-theme-v1',
        JSON.stringify({ Default: 'alt' }),
      );
    });
    await page.goto('/');
    await waitForAppShell(page);
    await openSetup(page);
    await page.getByTestId('theme-card-style-alt').click({ timeout: 30_000 }).catch(() => {});
    await page.screenshot({
      path: path.join(OUT_DIR, 'web-verify-card-style-picker-unlocked-1280x800.png'),
      fullPage: false,
    });
    await context.close();
  }

  for (const [style, slug] of [
    ['classic', 'classic'],
    ['alt', 'alt'],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(baseLocalStorage, {
      themeName: THEME,
      altUnlocked: true,
      cardStyleByTheme: { Pirates: style },
    });
    await page.goto('/');
    await waitForAppShell(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
    await reachFlippedPromptCard(page);
    await page.getByTestId('themed-prompt-card').screenshot({
      path: path.join(OUT_DIR, `web-verify-pirates-prompt-${slug}-1280x800.png`),
    });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(baseLocalStorage, { themeName: THEME, altUnlocked: false });
    await page.goto('/');
    await waitForAppShell(page);
    await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 30_000 });
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('pof-e2e-card-style-unlock-toast'));
    });
    await page.getByTestId('card-style-unlock-toast').waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.screenshot({
      path: path.join(OUT_DIR, 'web-verify-card-style-unlock-toast-1280x800.png'),
      fullPage: false,
    });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: PREVIEW_URL,
    });
    const page = await context.newPage();
    await page.addInitScript(baseLocalStorage, { themeName: THEME, altUnlocked: false });
    await page.addInitScript(() => {
      localStorage.setItem(
        'imposter-enabled-picture-packs-v1',
        JSON.stringify({ 'picture-pairs-v1': true }),
      );
    });
    await page.goto('/');
    await waitForAppShell(page);
    await reachDoubleTakeReveal(page);
    const label = page.getByTestId('double-take-reveal-label');
    await label.screenshot({
      path: path.join(OUT_DIR, 'web-verify-double-take-reveal-label-font-1280x800.png'),
    });
    await context.close();
  }

  await browser.close();
  console.log('Card style verify captures written to', OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
