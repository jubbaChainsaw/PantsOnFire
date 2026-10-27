import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { openLocalGameSetup, seedLocalAccount } from './helpers.js';
import { skipIntroAndRules } from './game-flow.helpers.js';

const OUT_DIR =
  process.env.POF_SCREENSHOT_DIR || '/opt/cursor/artifacts/screenshots';

async function openCategoryChoice(page) {
  await openLocalGameSetup(page);
  await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 20_000 });
  const inputs = page.locator('input:not([type="hidden"])');
  for (let i = 0; i < 3; i += 1) {
    await inputs.nth(i).fill(`Player ${i + 1}`);
  }
  await page.getByTestId('start-match').click();
  await skipIntroAndRules(page);
  const chainBtn = page.getByTestId('round-type-chain');
  if (await chainBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await chainBtn.click();
  } else {
    await page.locator('[data-testid^="round-type-"]').first().click();
  }
  await expect(page.getByTestId('category-choice-scroll')).toBeVisible({
    timeout: 15_000,
  });
  const count = await page
    .getByTestId('category-choice-grid')
    .getAttribute('data-category-count');
  expect(Number(count || 0)).toBe(6);
}

test.describe('Category choice 2x3 grid', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
    const later = page.getByRole('button', { name: 'Later' });
    if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await later.click();
    }
  });

  test('shows six categories in a non-scrolling 2x3 grid', async ({ page }) => {
    await openCategoryChoice(page);
    const tiles = page.locator(
      '[data-testid="category-choice-grid"] [data-testid^="category-"]',
    );
    await expect(tiles).toHaveCount(6);

    const scroll = page.getByTestId('category-choice-scroll');
    const scrollMetrics = await scroll.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollMetrics.scrollHeight).toBeLessThanOrEqual(
      scrollMetrics.clientHeight + 2,
    );

    const overlap = await page.evaluate(() => {
      const bar = document.querySelector(
        '[data-testid="category-choice-random-bar"]',
      );
      const tile = document.querySelector(
        '[data-testid="category-choice-grid"] [data-testid^="category-"]',
      );
      if (!bar || !tile) return 999;
      const b = bar.getBoundingClientRect();
      const t = tile.getBoundingClientRect();
      return Math.max(0, b.bottom - t.top);
    });
    expect(overlap).toBeLessThanOrEqual(1);

    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'category-choice-6grid-360x780.png'),
      fullPage: false,
    });
  });
});
