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
  expect(Number(count || 0)).toBeGreaterThanOrEqual(15);
}

test.describe('Category choice scroll', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
    const later = page.getByRole('button', { name: 'Later' });
    if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await later.click();
    }
  });

  test('scrolls to last categories and captures bottom', async ({ page }) => {
    await openCategoryChoice(page);
    const scroll = page.getByTestId('category-choice-scroll');
    await scroll.evaluate((el) => {
      el.scrollTop = 0;
    });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'category-choice-top-360x780.png'),
      fullPage: false,
    });
    const tiles = page.locator('[data-testid^="category-"]');
    const tileCount = await tiles.count();
    expect(tileCount).toBeGreaterThanOrEqual(6);
    const lastTile = tiles.nth(tileCount - 1);

    await scroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(lastTile).toBeInViewport();

    const scrollMetrics = await scroll.evaluate((el) => ({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollMetrics.scrollTop + scrollMetrics.clientHeight).toBeGreaterThanOrEqual(
      scrollMetrics.scrollHeight - 4,
    );

    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'category-choice-header-pause-clearance.png'),
      fullPage: false,
    });
    await scroll.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.screenshot({
      path: path.join(OUT_DIR, 'category-choice-bottom-360x780.png'),
      fullPage: false,
    });
  });
});
