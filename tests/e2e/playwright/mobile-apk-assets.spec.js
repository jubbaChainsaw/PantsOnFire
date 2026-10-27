import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { seedLocalAccount } from './helpers.js';
import { attachMobileAssetGuards } from './mobile-flow.helpers.js';

const OUT_DIR =
  process.env.POF_SCREENSHOT_DIR ||
  path.join(process.cwd(), 'public/assets/ui/neon/apk-verify');

async function assertImgLoaded(img) {
  const src = await img.getAttribute('src');
  const ok = await img.evaluate((node) => {
    const el = node;
    if (!el.complete) return false;
    if (el.naturalWidth > 0 && el.naturalHeight > 0) return true;
    const s = String(el.currentSrc || el.src || '');
    return /\.svg(\?|$)/i.test(s);
  });
  expect(ok, `image failed to load: ${src}`).toBe(true);
}

test.describe('mobile bundle assets (APK parity)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home neon icons and deck art load', async ({ page }) => {
    const guards = attachMobileAssetGuards(page);
    await seedLocalAccount(page, 'host_most');
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const menuImgs = page
      .getByRole('navigation', { name: 'Main menu' })
      .locator('img');
    await expect(menuImgs.first()).toBeVisible({ timeout: 20_000 });
    const menuCount = await menuImgs.count();
    expect(menuCount).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < menuCount; i += 1) {
      await assertImgLoaded(menuImgs.nth(i));
    }

    const deckImgs = page.locator('.neon-home-deck img, [class*="deck"] img');
    const deckCount = await deckImgs.count();
    if (deckCount > 0) {
      for (let i = 0; i < deckCount; i += 1) {
        await assertImgLoaded(deckImgs.nth(i));
      }
    }

    await page.screenshot({
      path: path.join(OUT_DIR, 'apk-verify-home-390x844.png'),
    });
    guards.assertNoFailedAssets();
  });

  test('shop theme thumbnails load when expanded', async ({ page }) => {
    const guards = attachMobileAssetGuards(page);
    await seedLocalAccount(page, 'host_most');
    await page.goto('/?pofScreen=store');
    await expect(page.getByTestId('neon-store-screen')).toBeVisible();

    const themes = page.getByTestId('store-section-themes');
    await themes.locator('button').first().click();
    await expect(themes).toHaveAttribute('data-expanded', 'true');

    const coreTiles = page.locator('[data-testid^="store-core-theme-"] img');
    const coreCount = await coreTiles.count();
    expect(coreCount).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < coreCount; i += 1) {
      await assertImgLoaded(coreTiles.nth(i));
    }

    const dlcArts = page.locator('[data-testid="store-dlc-pack-art"]');
    const dlcCount = await dlcArts.count();
    expect(dlcCount).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < dlcCount; i += 1) {
      await assertImgLoaded(dlcArts.nth(i));
    }

    const downloadChip = page.getByRole('button', { name: 'Download' }).first();
    if (await downloadChip.isVisible().catch(() => false)) {
      const fontFamily = await downloadChip.evaluate((el) =>
        getComputedStyle(el).fontFamily,
      );
      expect(fontFamily.toLowerCase()).toContain('pof display');
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'apk-verify-shop-themes-390x844.png'),
      fullPage: true,
    });
    guards.assertNoFailedAssets();
  });
});
