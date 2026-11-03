import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { seedLocalAccount } from './helpers.js';

const OUT_DIR = process.env.POF_SCREENSHOT_DIR || '/opt/cursor/artifacts/screenshots';

test.describe('Bug report screen', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('settings entry shows bug report form', async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
    const later = page.getByRole('button', { name: 'Later' });
    if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await later.click();
    }
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByTestId('settings-report-bug').click();
    await expect(page.getByTestId('bug-report-description')).toBeVisible({
      timeout: 15_000,
    });
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(OUT_DIR, 'after-bug-report-screen.png'),
      fullPage: true,
    });
  });
});
