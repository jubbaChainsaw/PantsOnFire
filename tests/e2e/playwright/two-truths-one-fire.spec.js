import path from 'node:path';
import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';
import {
  pickFirstRoundTypeAndCategory,
  setupThreePlayerGame,
  skipIntroAndRules,
} from './game-flow.helpers.js';

const shotsDir = path.join(process.cwd(), 'artifacts', 'screenshots', 'two-truths-one-fire');

async function dismissContentPackPrompt(page) {
  const later = page.getByTestId('content-pack-later-btn');
  if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await later.click();
  }
}

async function completeTwoTruthsInput(page, playerCount = 3) {
  for (let i = 0; i < playerCount; i += 1) {
    await expect(page.getByTestId('twotruths-prompt')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('twotruths-item-0').fill(`Honest one ${i}`);
    await page.getByTestId('twotruths-item-1').fill(`Honest two ${i}`);
    await page.getByTestId('twotruths-item-2').fill(`Fake line ${i}`);
    await page.getByTestId('twotruths-lie-2').click();
    await page.screenshot({
      path: path.join(shotsDir, `input-player-${i + 1}.png`),
      fullPage: false,
    });
    await page.getByTestId('twotruths-submit').click();
    if (i < playerCount - 1) {
      await expect(page.getByTestId('twotruths-pass-heading')).toContainText(/Pass the phone/i);
      await page.screenshot({
        path: path.join(shotsDir, `handoff-after-player-${i + 1}.png`),
        fullPage: false,
      });
    }
  }
}

async function completeTwoTruthsVoting(page, playerCount = 3) {
  for (let v = 0; v < playerCount; v += 1) {
    await expect(page.getByTestId('twotruths-voting-pass')).toBeVisible({ timeout: 15_000 });
    const panels = page.locator('[data-testid^="twotruths-author-panel-"]');
    const panelCount = await panels.count();
    for (let p = 0; p < panelCount; p += 1) {
      await panels.nth(p).locator('[data-testid^="twotruths-vote-"]').first().click();
    }
    await page.screenshot({
      path: path.join(shotsDir, `voting-voter-${v + 1}.png`),
      fullPage: false,
    });
  }
  await page.getByTestId('twotruths-submit-votes').click();
  await expect(page.getByTestId('twotruths-reveal-continue')).toBeVisible({
    timeout: 20_000,
  });
  await page.screenshot({
    path: path.join(shotsDir, 'reveal.png'),
    fullPage: false,
  });
}

async function runTwoTruthsFlow(page, viewportLabel) {
  await seedLocalAccount(page, 'host_most');
  await dismissContentPackPrompt(page);
  await page.setViewportSize(
    viewportLabel === '390x844'
      ? { width: 390, height: 844 }
      : { width: 360, height: 780 },
  );
  await setupThreePlayerGame(page);
  await skipIntroAndRules(page);
  await expect(page.getByTestId('round-type-twotruths')).toBeVisible({
    timeout: 20_000,
  });
  await page.getByTestId('round-type-twotruths').click();
  const cat = page.locator('[data-testid^="category-"]').first();
  await expect(cat).toBeVisible({ timeout: 15_000 });
  await cat.click();
  const hostSkip = page.getByTestId('host-intro-skip');
  await expect(hostSkip).toBeVisible({ timeout: 20_000 });
  await hostSkip.click();
  await completeTwoTruthsInput(page, 3);
  await completeTwoTruthsVoting(page, 3);
  await page.getByTestId('twotruths-reveal-continue').click();
}

test.describe('Two Truths, One Fire — pass-the-phone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('360x780 full flow', async ({ page }) => {
    await runTwoTruthsFlow(page, '360x780');
  });

  test('390x844 full flow', async ({ page }) => {
    await runTwoTruthsFlow(page, '390x844');
  });
});

test.describe('Two Truths — online input timer', () => {
  test('shows input timer bar (simulated online)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pof-e2e-online-twotruths-timer', '1');
    });
    await seedLocalAccount(page, 'host_most');
    await dismissContentPackPrompt(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await setupThreePlayerGame(page);
    await skipIntroAndRules(page);
    await page.getByTestId('round-type-twotruths').click();
    const cat = page.locator('[data-testid^="category-"]').first();
    if (await cat.isVisible().catch(() => false)) await cat.click();
    await page.getByTestId('host-intro-skip').click();
    await expect(page.getByTestId('twotruths-input-timer')).toBeVisible();
    await expect(page.getByTestId('selection-timer')).toBeVisible();
    await page.evaluate(() =>
      localStorage.removeItem('pof-e2e-online-twotruths-timer'),
    );
  });
});
