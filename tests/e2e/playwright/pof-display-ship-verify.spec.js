import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { seedLocalAccount, openLocalGameSetup } from './helpers.js';
import { skipIntroAndRules } from './game-flow.helpers.js';

const OUT_DIR =
  process.env.POF_SCREENSHOT_DIR ||
  path.join(
    process.cwd(),
    'public/assets/fonts/pants-on-fire/derived/in-game-previews/shipped',
  );

async function assertNoHorizontalOverflow(page, label) {
  const overflows = await page.evaluate(() => {
    const offenders = [];
    const nodes = document.querySelectorAll(
      'button.pof-btn, .pof-root h1, .pof-root h2, .pof-root h3, [data-testid="category-choice-header"]',
    );
    nodes.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      if (el.scrollWidth > el.clientWidth + 2) {
        offenders.push(
          el.getAttribute('data-testid') ||
            String(el.textContent || '').trim().slice(0, 40),
        );
      }
    });
    return offenders;
  });
  expect(overflows, `${label} overflow`).toEqual([]);
}

async function assertPoFDisplayLoaded(page) {
  const loaded = await page.evaluate(async () => {
    try {
      await document.fonts.load('400 24px "PoF Display"');
      await document.fonts.ready;
      return document.fonts.check('24px "PoF Display"');
    } catch {
      return false;
    }
  });
  expect(loaded).toBe(true);
}

test.describe('PoF Display shipped UI', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
    const later = page.getByRole('button', { name: 'Later' });
    if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await later.click();
    }
    await assertPoFDisplayLoaded(page);
  });

  test('title, category, setup, and results at 390x844', async ({ page }) => {
    test.setTimeout(300_000);
    fs.mkdirSync(OUT_DIR, { recursive: true });

    await page.screenshot({
      path: path.join(OUT_DIR, 'shipped-home-390x844.png'),
    });
    await assertNoHorizontalOverflow(page, 'home');

    await openLocalGameSetup(page);
    await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 20_000 });
    await page.screenshot({
      path: path.join(OUT_DIR, 'shipped-setup-390x844.png'),
    });
    await assertNoHorizontalOverflow(page, 'setup');

    const inputs = page.locator('input:not([type="hidden"])');
    for (let i = 0; i < 3; i += 1) {
      await inputs.nth(i).fill(`Player ${i + 1}`);
    }
    await page.getByTestId('start-match').click();
    await skipIntroAndRules(page);
    const chainBtn = page.getByTestId('round-type-chain');
    await expect(chainBtn).toBeVisible({ timeout: 15_000 });
    await chainBtn.click();
    await expect(page.getByTestId('category-choice-grid')).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({
      path: path.join(OUT_DIR, 'shipped-category-choice-390x844.png'),
    });
    await assertNoHorizontalOverflow(page, 'category');

    await page
      .locator(
        '[data-testid="category-choice-grid"] button[data-testid^="category-"]',
      )
      .first()
      .click();
    const hostSkip = page.getByTestId('host-intro-skip');
    const revealReady = page.getByTestId('reveal-ready');
    await Promise.race([
      hostSkip.waitFor({ state: 'visible', timeout: 45_000 }),
      revealReady.waitFor({ state: 'visible', timeout: 45_000 }),
    ]);
    if (await hostSkip.isVisible().catch(() => false)) {
      await hostSkip.click();
    }
    await revealReady.waitFor({ state: 'visible', timeout: 60_000 });
    for (let i = 0; i < 3; i += 1) {
      const ready = page.getByTestId('reveal-ready');
      if (await ready.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await ready.click();
        await page.waitForTimeout(1000);
      }
      await page.getByTestId('reveal-next').click();
    }
    await page.getByTestId('discussion-continue').click();
    for (let v = 0; v < 3; v += 1) {
      await page.locator('[data-testid^="vote-for-"]').first().click();
    }
    await page.getByTestId('submit-votes').click();
    await page.getByText(/WHO WAS THE LIAR/i).waitFor({ timeout: 60_000 });
    await page.screenshot({
      path: path.join(OUT_DIR, 'shipped-results-390x844.png'),
    });
    await assertNoHorizontalOverflow(page, 'results');
  });
});
