import { test, expect } from '@playwright/test';

test.describe('content pack download prompt UI', () => {
  test('shows neon prompt with size and actions', async ({ page }) => {
    await page.goto('/?pofForceContentPackPrompt=1');
    await page.waitForSelector('[data-testid="content-pack-prompt"]', { timeout: 30_000 });
    const prompt = page.getByTestId('content-pack-prompt');
    await expect(prompt).toContainText(/Download theme packs/i);
    await expect(prompt).toContainText(/MB|KB/);
    await expect(page.getByTestId('content-pack-download-btn')).toBeVisible();
    await expect(page.getByTestId('content-pack-later-btn')).toBeVisible();
    await page.getByTestId('content-pack-later-btn').click();
    await expect(prompt).toBeHidden();
  });
});
