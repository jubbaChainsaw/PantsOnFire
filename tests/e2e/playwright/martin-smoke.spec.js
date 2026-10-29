import { test, expect } from '@playwright/test';

function seedLocalStorage() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'martin-smoke',
      displayName: 'Smoke Tester',
      tierId: 'host_most',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
  );
}

test.describe('Martin smoke — local game flow', () => {
  test('home → local setup and profile (Fever Dream mystery rows)', async ({ page }) => {
    await page.addInitScript(seedLocalStorage);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
      state: 'visible',
      timeout: 120_000,
    });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 30_000 });

    await page.goto('/');
    await page.getByRole('button', { name: 'Leaderboard and stats' }).click({
      timeout: 30_000,
    });
    await expect(page.getByTestId('player-profile-screen')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('profile-tab-achievements').click();
    await expect(page.getByTestId('achievement-row-referral-fever-dream-1')).toBeVisible();
    await expect(page.getByTestId('achievement-row-referral-fever-dream-2')).toBeVisible();
  });

  test.skip('Double Take round (intro flow)', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(seedLocalStorage);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click({ timeout: 120_000 });
    await page.getByTestId('start-match').click({ timeout: 30_000 });
    await page.locator('[data-testid="startup-loading-overlay"]').waitFor({
      state: 'detached',
      timeout: 60_000,
    }).catch(() => {});
    await page.getByTestId('intro-skip').click({ timeout: 60_000, trial: true }).catch(() => {});
    await page.getByTestId('intro-skip').click({ timeout: 60_000 });
    await page.getByTestId('rules-continue').click({ timeout: 60_000 });
    await page.getByTestId('round-type-choice-grid').waitFor({
      state: 'visible',
      timeout: 60_000,
    });
    await page.getByTestId('round-type-pairs').click({ timeout: 30_000 });
    await page.getByTestId('choose-category-random').click({ timeout: 30_000 }).catch(async () => {
      await page.locator('[data-testid^="category-"]').first().click();
    });
    await page.getByTestId('host-intro-skip').click({ timeout: 30_000 }).catch(() => {});
    await page.getByTestId('reveal-ready').waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByTestId('reveal-ready').click();
    await page.waitForTimeout(2600);
    await expect(page.getByTestId('double-take-reveal-label')).toBeVisible({
      timeout: 30_000,
    });
  });
});
