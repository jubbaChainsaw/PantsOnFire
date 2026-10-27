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

const shotsDir = path.join(
  process.cwd(),
  'artifacts',
  'screenshots',
  'mobile-flow',
);

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

test('mobile bundle: setup → host intro → round → vote → results (no console errors)', async ({
  page,
}) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err?.message || err)));

  const shot = async (name) => {
    await page.screenshot({
      path: path.join(shotsDir, name),
      fullPage: true,
    });
  };

  await shot('01-account-or-home.png');
  const skipIntro = page.getByTestId('intro-skip');
  if (await skipIntro.isVisible().catch(() => false)) {
    await skipIntro.click();
  }
  await shot('02-home.png');

  await setupThreePlayerGame(page);
  await shot('03-setup.png');

  await skipIntroAndRules(page);
  await shot('04-rules.png');

  await pickFirstRoundTypeAndCategory(page);
  await shot('05-round-or-category.png');

  const hostSkip = page.getByTestId('host-intro-skip');
  await expect(hostSkip).toBeVisible({ timeout: 20_000 });
  await shot('06-host-intro.png');
  await hostSkip.click();

  await passRevealPhase(page, 3);
  await shot('07-reveal.png');

  await page.getByTestId('discussion-continue').click();
  await shot('08-discussion.png');

  await completeLocalVoting(page, 3);
  await shot('09-voting.png');

  await expect(page.getByText(/liar|results|caught|escaped/i).first()).toBeVisible({
    timeout: 25_000,
  });
  await shot('10-results.png');

  expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});
