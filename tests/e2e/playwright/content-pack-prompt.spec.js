import { test, expect } from '@playwright/test';

async function seedFreshLocalAccount(page) {
  await page.addInitScript(() => {
    localStorage.removeItem('pof-content-packs-prompt-dismissed-v1');
    localStorage.setItem(
      'imposter-account-session-v2',
      JSON.stringify({
        userId: 'e2e-fresh-user',
        displayName: 'Fresh Install',
        tierId: 'host_most',
        addonTwistTruth: false,
        unlockedThemePackIds: [],
        authProvider: 'local',
      }),
    );
  });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('pof-content-packs-prompt-dismissed-v1');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
    state: 'visible',
    timeout: 30_000,
  });
}

test.describe('content pack download prompt UI', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('first launch on home shows prompt after manifest loads', async ({ page }) => {
    await seedFreshLocalAccount(page);
    await expect(page.getByTestId('content-pack-prompt')).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId('content-pack-prompt')).toContainText(
      /Download theme packs/i,
    );
    const prompt = page.getByTestId('content-pack-prompt');
    await expect(prompt.getByTestId('content-pack-prompt-settings-hint')).toContainText(
      'Settings > Downloads',
    );
    await prompt.screenshot({
      path: 'public/assets/ui/neon/apk-verify/apk-verify-content-pack-prompt-centred-390x844.png',
    });
  });

  test('shows neon prompt with size and actions', async ({ page }) => {
    await page.goto('/?pofForceContentPackPrompt=1');
    await page.waitForSelector('[data-testid="content-pack-prompt"]', { timeout: 30_000 });
    const prompt = page.getByTestId('content-pack-prompt');
    await expect(prompt).toContainText(/Download theme packs/i);
    await expect(prompt).toContainText(/MB|KB/);
    await expect(page.getByTestId('content-pack-prompt-settings-hint')).toContainText(
      'Settings > Downloads',
    );
    await expect(page.getByTestId('content-pack-download-btn')).toBeVisible();
    await expect(page.getByTestId('content-pack-later-btn')).toBeVisible();
    await page.getByTestId('content-pack-later-btn').click();
    await expect(prompt).toBeHidden();
  });
});
