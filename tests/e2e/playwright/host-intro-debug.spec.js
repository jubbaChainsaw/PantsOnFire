import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { openLocalGameSetup, seedLocalAccount } from './helpers.js';
import { skipIntroAndRules } from './game-flow.helpers.js';

const OUT_DIR =
  process.env.POF_SCREENSHOT_DIR || '/opt/cursor/artifacts/screenshots';

test.describe('Host intro debug', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('log asset and console errors at host intro', async ({ page }) => {
    const logs = [];
    const failed = [];
    page.on('console', (msg) => logs.push(`${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (err) => logs.push(`pageerror: ${err.message}`));
    page.on('requestfailed', (req) => {
      failed.push(`${req.failure()?.errorText || 'fail'} ${req.url()}`);
    });

    await seedLocalAccount(page, 'host_most');
    const later = page.getByRole('button', { name: 'Later' });
    if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) await later.click();

    await openLocalGameSetup(page);
    await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 20_000 });
    const inputs = page.locator('input:not([type="hidden"])');
    for (let i = 0; i < 3; i += 1) await inputs.nth(i).fill(`Player ${i + 1}`);
    await page.getByTestId('start-match').click();
    await skipIntroAndRules(page);

    const chainBtn = page.getByTestId('round-type-chain');
    if (await chainBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await chainBtn.click();
    } else {
      await page.locator('[data-testid^="round-type-"]').first().click();
    }
    await page.locator('[data-testid^="category-"]').nth(2).click();
    await expect(
      page.getByTestId('host-intro-visual').or(page.getByTestId('reveal-ready')),
    ).toBeVisible({ timeout: 20_000 });
    if (!(await page.getByTestId('host-intro-caption').isVisible().catch(() => false))) {
      test.skip(true, 'Host intro skipped in this flow');
    }
    await page.waitForTimeout(350);

    const caption = page.getByTestId('host-intro-caption');
    const captionStyles = await caption.evaluate((el) => {
      const panel = getComputedStyle(el);
      const text = getComputedStyle(el.querySelector('p') || el);
      return {
        panelBg: panel.backgroundColor,
        panelOpacity: panel.opacity,
        textColor: text.color,
        textFont: text.fontFamily,
      };
    });
    expect(captionStyles.panelOpacity).toBe('1');
    expect(captionStyles.textColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
    expect(captionStyles.textFont.toLowerCase()).toContain('inter');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'host-intro-caption-fixed.png'),
      fullPage: false,
    });

    const hostImg = page.getByTestId('host-idle-image');
    const src = await hostImg.getAttribute('src');
    const nw = await hostImg.evaluate((img) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));

    // eslint-disable-next-line no-console
    console.log('HOST_IMG_SRC', src);
    // eslint-disable-next-line no-console
    console.log('HOST_IMG_DIMS', JSON.stringify(nw));
    // eslint-disable-next-line no-console
    console.log('FAILED_REQUESTS', failed.filter((u) => /host|themes|webp|mp4|webm/i.test(u)));
    // eslint-disable-next-line no-console
    console.log('CONSOLE_ERRORS', logs.filter((l) => /error|404|fail/i.test(l)));

    expect(failed.filter((u) => /persona-host|themes\/default\/hosts/i.test(u)), 'host asset requests').toEqual([]);
    expect(nw.naturalWidth, 'host poster should decode').toBeGreaterThan(0);
  });
});
