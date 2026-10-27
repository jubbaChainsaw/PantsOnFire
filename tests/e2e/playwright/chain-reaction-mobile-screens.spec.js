import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { seedLocalAccount } from './helpers.js';
import {
  skipIntroAndRules,
  passRevealPhase,
  completeLocalVoting,
} from './game-flow.helpers.js';

const OUT_DIR = process.env.POF_SCREENSHOT_DIR || '/opt/cursor/artifacts/screenshots';
const LONG_NAMES = ['Naomi Soft Smirk', 'Yusuf Watchful', 'Alexandra Constantine'];

async function dismissContentPackPrompt(page) {
  const later = page.getByRole('button', { name: 'Later' });
  if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await later.click();
  }
}

async function setupChainGame(page) {
  await dismissContentPackPrompt(page);
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeEnabled({ timeout: 20_000 });
  await play.click();
  await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 20_000 });
  const inputs = page.locator('input:not([type="hidden"])');
  for (let i = 0; i < LONG_NAMES.length; i += 1) {
    await inputs.nth(i).fill(LONG_NAMES[i]);
  }
  await page.getByTestId('start-match').click();
}

async function snap(page, name) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

async function assertNoHorizontalOverflow(page, label) {
  const overflows = await page.evaluate(() => {
    const offenders = [];
    const nodes = document.querySelectorAll(
      'button.pof-btn, button.pof-chip, [data-testid="discussion-continue"], [data-testid="reveal-next"], [data-testid^="vote-for-"]',
    );
    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      if (el.scrollWidth > el.clientWidth + 2) {
        offenders.push(
          el.getAttribute('data-testid') ||
            String(el.textContent || '').trim().slice(0, 48),
        );
      }
    });
    return offenders;
  });
  expect(overflows, `${label} horizontal overflow`).toEqual([]);
}

test.describe('Chain Reaction mobile screenshots', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
  });

  test('capture pass-the-phone flow screens', async ({ page }) => {
    test.setTimeout(240_000);
    const prefix = process.env.POF_SCREENSHOT_PREFIX || 'after';
    await setupChainGame(page);
    await skipIntroAndRules(page);
    await snap(page, `${prefix}-01-rules-done`);

    const chainBtn = page.getByTestId('round-type-chain');
    if (await chainBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await chainBtn.click();
    } else {
      await page.locator('[data-testid^="round-type-"]').first().click();
    }
    await snap(page, `${prefix}-02-category-choice`);

    const cat = page.locator('[data-testid^="category-"]').first();
    await expect(cat).toBeVisible({ timeout: 15_000 });
    await cat.click();

    const hostSkip = page.getByTestId('host-intro-skip');
    if (await hostSkip.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await snap(page, `${prefix}-03-host-intro`);
      await hostSkip.click();
    }

    await expect(page.getByTestId('reveal-ready')).toBeVisible({ timeout: 15_000 });
    await snap(page, `${prefix}-04-reveal-pass-phone`);

    await passRevealPhase(page, LONG_NAMES.length);
    await snap(page, `${prefix}-05-discussion`);
    if (!process.env.POF_SKIP_OVERFLOW) {
      await assertNoHorizontalOverflow(page, 'discussion');
    }

    await page.getByTestId('discussion-continue').click();
    await expect(page.getByText(/Vote now/i)).toBeVisible({ timeout: 15_000 });
    await snap(page, `${prefix}-06-voting`);
    if (!process.env.POF_SKIP_OVERFLOW) {
      await assertNoHorizontalOverflow(page, 'voting');
    }

    await completeLocalVoting(page, LONG_NAMES.length);
    await snap(page, `${prefix}-07-liar-reveal`);

    await expect(page.getByText(/results|round/i).first()).toBeVisible({
      timeout: 25_000,
    });
    await snap(page, `${prefix}-08-results`);
  });
});
