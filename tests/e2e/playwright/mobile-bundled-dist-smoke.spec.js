import { test, expect } from '@playwright/test';

function seedLocalStorage() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'mobile-dist-smoke',
      displayName: 'Smoke Tester',
      tierId: 'host_most',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
  );
  localStorage.setItem(
    'imposter-player-profile-v1',
    JSON.stringify({
      version: 1,
      stats: { gamesHosted: 1, gamesHostedCompleted: 1 },
      unlockedAchievementIds: ['host-first-game'],
      achievementProgress: {},
      recentGames: [],
      unlockedDefaultBackSlugs: [],
      achievementUnlockedThemeNames: [],
      selectedDefaultBackSlug: 'classic',
      referralUnlockToastPending: false,
      unlockedAltCardThemeKeys: [],
    }),
  );
}

function attachBundledAssetWatchers(page) {
  const problems = [];

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (!/\/assets\//i.test(url)) return;
    problems.push(
      `request failed: ${url} (${request.failure()?.errorText || 'unknown'})`,
    );
  });

  page.on('response', (response) => {
    const url = response.url();
    if (!/\/assets\//i.test(url)) return;
    if (response.status() >= 400) {
      problems.push(`HTTP ${response.status()}: ${url}`);
    }
  });

  return problems;
}

async function assertVisibleImagesLoaded(page) {
  const broken = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.src && !img.src.startsWith('data:'))
      .filter((img) => {
        const style = window.getComputedStyle(img);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = img.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return img.naturalWidth === 0;
      })
      .map((img) => img.currentSrc || img.src),
  );
  expect(broken, `broken images:\n${broken.join('\n')}`).toEqual([]);
}

async function assertGameFontsLoaded(page) {
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    try {
      await document.fonts.load('400 16px "PoF Display"');
      await document.fonts.load('400 16px "Vintage Cowboy"');
    } catch {
      /* ignore */
    }
    await document.fonts.ready;
    const pofFace = [...document.fonts].find((face) =>
      /poF display/i.test(face.family),
    );
    const vintageFace = [...document.fonts].find((face) =>
      /vintage cowboy/i.test(face.family),
    );
    return {
      pofDisplay:
        document.fonts.check('16px "PoF Display"') ||
        pofFace?.status === 'loaded',
      vintageCowboy:
        document.fonts.check('16px "Vintage Cowboy"') ||
        vintageFace?.status === 'loaded',
      pofStatus: pofFace?.status || 'missing',
      vintageStatus: vintageFace?.status || 'missing',
    };
  });
  expect(result.pofDisplay, `PoF Display did not load (${result.pofStatus})`).toBe(
    true,
  );
  expect(
    result.vintageCowboy,
    `Vintage Cowboy did not load (${result.vintageStatus})`,
  ).toBe(true);
}

test.describe('Mobile bundled dist-android smoke', () => {
  test('assets, fonts, and core local game screens', async ({ page }) => {
    test.setTimeout(180_000);
    const assetProblems = attachBundledAssetWatchers(page);
    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error?.message || error));
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });

    await page.addInitScript(seedLocalStorage);
    await page.goto('/');
    await expect(page.getByText(/UI render failed/i)).toHaveCount(0);
    await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    await assertVisibleImagesLoaded(page);
    await assertGameFontsLoaded(page);

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 60_000 });
    await page.locator('[data-testid="app-shell-ready"]').waitFor({
      state: 'attached',
      timeout: 120_000,
    });
    await assertVisibleImagesLoaded(page);

    const personaToggle = page.getByRole('button', {
      name: 'Toggle persona-only mode',
    });
    await expect(personaToggle).toBeVisible();
    await assertVisibleImagesLoaded(page);

    await page.getByTestId('start-match').click({ timeout: 30_000 });
    await expect(page.getByTestId('start-match')).toHaveCount(0, {
      timeout: 30_000,
    });
    await page
      .locator('[data-testid="startup-loading-overlay"]')
      .waitFor({ state: 'detached', timeout: 120_000 })
      .catch(() => {});

    await page.getByTestId('intro-skip').waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    await page.getByTestId('intro-skip').evaluate((el) => el.click());
    await page.getByRole('heading', { name: 'Quick Rules' }).waitFor({
      state: 'visible',
      timeout: 90_000,
    });
    await assertVisibleImagesLoaded(page);

    await page.getByTestId('rules-continue').click({ timeout: 60_000, force: true });
    await page.getByTestId('round-type-choice-grid').waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    await assertVisibleImagesLoaded(page);

    const roundTypeIds = [
      'picture',
      'opinion',
      'pairs',
      'nameblame',
      'noise',
      'chain',
      'twotruths',
      'offtopic',
      'sound',
      'video',
    ];
    for (const roundTypeId of roundTypeIds) {
      const icon = page.getByTestId(`round-type-icon-${roundTypeId}`);
      if (await icon.count()) {
        await expect(icon).toBeVisible();
      }
    }
    await assertVisibleImagesLoaded(page);

    const fatal = pageErrors.filter(
      (line) =>
        /ReferenceError|UI render failed|is not defined/i.test(line) &&
        !/favicon|404/i.test(line),
    );
    expect(fatal, fatal.join('\n')).toEqual([]);
    expect(assetProblems, assetProblems.join('\n')).toEqual([]);
  });
});
