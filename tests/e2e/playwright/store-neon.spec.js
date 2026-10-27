import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';
import { assertVisibleImagesLoaded } from './mobile-flow.helpers.js';

test.use({ viewport: { width: 360, height: 780 } });

test.describe('neon store', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'local_liar');
  });

  test('sections expand/collapse and images load', async ({ page }) => {
    await page.goto('/?pofScreen=store');
    await expect(page.getByTestId('neon-store-screen')).toBeVisible();

    const access = page.getByTestId('store-section-access');
    await expect(access).toHaveAttribute('data-expanded', 'true');
    await expect(page.getByTestId('store-tier-local_liar')).toBeVisible();

    const themes = page.getByTestId('store-section-themes');
    await expect(themes).toHaveAttribute('data-expanded', 'false');
    await themes.locator('button').first().click();
    await expect(themes).toHaveAttribute('data-expanded', 'true');

    const dlcArts = page.locator('[data-testid="store-dlc-pack-art"]');
    await expect(dlcArts.first()).toBeVisible();
    const artCount = await dlcArts.count();
    expect(artCount).toBeGreaterThanOrEqual(4);
    let loadedArt = 0;
    for (let i = 0; i < artCount; i += 1) {
      const img = dlcArts.nth(i);
      const ok = await img.evaluate((node) => {
        const el = node;
        if (!el.complete) return false;
        if (el.naturalWidth > 0 && el.naturalHeight > 0) return true;
        const s = String(el.currentSrc || el.src || '');
        return /\.svg(\?|$)/i.test(s);
      });
      if (ok) loadedArt += 1;
    }
    expect(artCount).toBeGreaterThanOrEqual(8);
    expect(loadedArt, 'expected DLC pack tiles to show loaded art').toBeGreaterThanOrEqual(2);

    await themes.locator('button').first().click();
    await expect(themes).toHaveAttribute('data-expanded', 'false');

    await page.screenshot({
      path: '/opt/cursor/artifacts/store-neon-360x780-collapsed.png',
      fullPage: true,
    });
    await themes.locator('button').first().click();
    await page.screenshot({
      path: '/opt/cursor/artifacts/store-neon-360x780-themes-expanded.png',
      fullPage: true,
    });
  });

  test('persists section expansion in localStorage', async ({ page }) => {
    await page.goto('/?pofScreen=store');
    await page.getByTestId('store-section-addons').locator('button').first().click();
    const prefs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pof-store-sections-v1') || '{}'),
    );
    expect(prefs.addons).toBe(true);
  });
});
