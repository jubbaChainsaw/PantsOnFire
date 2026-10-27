import path from 'node:path';
import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';
import {
  completeLocalVoting,
  passRevealPhase,
  pickFirstRoundTypeAndCategory,
  setupThreePlayerGame,
  skipIntroAndRules,
} from './game-flow.helpers.js';
import {
  attachMobileAssetGuards,
  assertNoVerticalScroll,
  assertRoundTypeCardsVisible,
  assertCategoryCardsVisible,
  assertVisibleImagesLoaded,
} from './mobile-flow.helpers.js';

const shotsDir = path.join(
  process.cwd(),
  'artifacts',
  'screenshots',
  'mobile-flow',
);

const shotsDir360 = path.join(
  process.cwd(),
  'artifacts',
  'screenshots',
  'mobile-flow-360x780',
);

async function runMobileGameFlow(page, { shotsDirectory, viewportLabel }) {
  const assets = attachMobileAssetGuards(page);
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err?.message || err)));

  const shot = async (name) => {
    await page.screenshot({
      path: path.join(shotsDirectory, name),
      fullPage: false,
    });
  };

  const assertChoiceOrIntroViewport = async () => {
    await assertNoVerticalScroll(page);
    await assertVisibleImagesLoaded(page);
  };

  await shot(`01-account-or-home-${viewportLabel}.png`);
  const skipIntro = page.getByTestId('intro-skip');
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }
  await shot(`02-home-${viewportLabel}.png`);

  await setupThreePlayerGame(page);
  await shot(`03-setup-${viewportLabel}.png`);

  await skipIntroAndRules(page);
  await shot(`04-rules-${viewportLabel}.png`);

  await assertRoundTypeCardsVisible(page);
  await assertChoiceOrIntroViewport();
  await shot(`05-round-type-choice-${viewportLabel}.png`);

  await pickFirstRoundTypeAndCategory(page);

  const categoryVisible = await page
    .locator('[data-testid^="category-"]')
    .first()
    .isVisible()
    .catch(() => false);
  if (categoryVisible) {
    await assertCategoryCardsVisible(page);
    await assertChoiceOrIntroViewport();
    await shot(`05b-category-choice-${viewportLabel}.png`);
  }

  const hostSkip = page.getByTestId('host-intro-skip');
  await expect(hostSkip).toBeVisible({ timeout: 20_000 });
  await assertChoiceOrIntroViewport();
  await shot(`06-host-intro-${viewportLabel}.png`);
  await hostSkip.click();

  await passRevealPhase(page, 3);
  await shot(`07-reveal-${viewportLabel}.png`);

  await page.getByTestId('discussion-continue').click();
  await shot(`08-discussion-${viewportLabel}.png`);

  await completeLocalVoting(page, 3);
  await shot(`09-voting-${viewportLabel}.png`);

  await expect(page.getByText(/liar|results|caught|escaped/i).first()).toBeVisible({
    timeout: 25_000,
  });
  await shot(`10-results-${viewportLabel}.png`);

  assets.assertNoFailedAssets();
  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
}

test.describe.configure({ mode: 'serial', timeout: 180_000 });

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'mobile viewport only');
  await seedLocalAccount(page, 'host_most');
});

test('mobile bundle @ 390×844: assets, no scroll on choice/intro, full flow', async ({
  page,
}) => {
  await runMobileGameFlow(page, {
    shotsDirectory: shotsDir,
    viewportLabel: '390x844',
  });
});

test('mobile bundle @ 360×780: screenshots + choice/intro viewport checks', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await runMobileGameFlow(page, {
    shotsDirectory: shotsDir360,
    viewportLabel: '360x780',
  });
});
