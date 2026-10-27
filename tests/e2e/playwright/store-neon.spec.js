import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';

const SHOP_SHOTS = '/workspace/public/assets/ui/neon/apk-verify';

test.use({ viewport: { width: 390, height: 844 } });

test.describe('neon store', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
  });

  test('MagicPath shop layout, filters, and verify screenshots', async ({ page }) => {
    await page.goto('/?pofScreen=store');
    await expect(page.getByTestId('neon-store-screen')).toBeVisible();
    await expect(page.getByTestId('store-back')).toBeVisible();
    await expect(page.getByTestId('store-tier-chip')).toBeVisible();

    const access = page.getByTestId('store-section-access');
    await expect(access).toHaveAttribute('data-expanded', 'true');

    const themes = page.getByTestId('store-section-themes');
    await expect(themes).toHaveAttribute('data-expanded', 'false');

    await page.screenshot({
      path: `${SHOP_SHOTS}/shop-neon-collapsed-390x844.png`,
      fullPage: true,
    });

    await themes.locator('button').first().click();
    await expect(themes).toHaveAttribute('data-expanded', 'true');
    await expect(page.getByTestId('store-themes-panel')).toBeVisible();
    await expect(page.getByTestId('store-featured-carousel')).toBeVisible();
    await expect(page.getByTestId('store-featured-dots')).toBeVisible();

    const themeArts = page.locator('[data-testid="store-theme-card-art"]');
    await expect(themeArts.first()).toBeVisible();
    const artCount = await themeArts.count();
    expect(artCount).toBeGreaterThanOrEqual(8);

    await page.screenshot({
      path: `${SHOP_SHOTS}/shop-neon-themes-expanded-390x844.png`,
      fullPage: true,
    });

    await page.getByTestId('store-theme-filter-premium').click();
    const visibleCards = page.locator('[data-testid^="store-theme-card-"]');
    await expect(visibleCards.first()).toBeVisible();
    const premiumCount = await visibleCards.count();
    expect(premiumCount).toBeGreaterThan(0);

    await page.screenshot({
      path: `${SHOP_SHOTS}/shop-neon-filter-premium-390x844.png`,
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
