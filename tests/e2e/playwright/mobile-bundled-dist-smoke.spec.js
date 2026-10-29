import { test, expect } from '@playwright/test';

function seedLocalStorage() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'mobile-dist-smoke',
      displayName: 'Smoke Tester',
      tierId: 'host_most',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
  );
}

test.describe('Mobile bundled dist-android smoke', () => {
  test('home and local game setup render without UI errors', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => {
      pageErrors.push(String(error?.message || error));
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });

    await page.addInitScript(seedLocalStorage);
    await page.goto('/');
    await expect(page.getByText(/UI render failed/i)).toHaveCount(0);
    await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    await expect(page.getByText(/UI render failed/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/UI render failed/i)).toHaveCount(0);

    const fatal = pageErrors.filter(
      (line) =>
        /ReferenceError|UI render failed|is not defined/i.test(line) &&
        !/favicon|404/i.test(line),
    );
    expect(fatal, fatal.join('\n')).toEqual([]);
  });
});
