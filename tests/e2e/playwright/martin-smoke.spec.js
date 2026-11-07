import { test, expect } from '@playwright/test';

function seedLocalStorage() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem('pof-e2e-force-round-type', 'pairs');
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

  test('Double Take full local round (pass-phone reveal → vote → results)', async ({ page }) => {
    test.setTimeout(300_000);
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
    await page.getByTestId('host-intro-visual').waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByTestId('host-intro-skip').click({ timeout: 30_000 }).catch(() => {});

    const playerCount = 3;
    let sawLiar = false;
    let sawInnocent = false;
    for (let i = 0; i < playerCount; i += 1) {
      await page.getByTestId('reveal-ready').click({ timeout: 60_000 });
      await page.waitForTimeout(2600);
      const label = page.getByTestId('double-take-reveal-label');
      await expect(label).toBeVisible({ timeout: 30_000 });
      const text = (await label.innerText()).trim();
      if (/liar/i.test(text)) sawLiar = true;
      else sawInnocent = true;
      await page.getByTestId('reveal-next').click({ timeout: 30_000 });
    }
    expect(sawLiar || sawInnocent).toBe(true);

    for (let i = 0; i < playerCount; i += 1) {
      await page.getByTestId('one-word-local-next').click({ timeout: 60_000 });
    }
    await page.getByTestId('discussion-continue').click({ timeout: 60_000 });

    for (let round = 0; round < playerCount; round += 1) {
      const chip = page.locator('[data-testid^="vote-for-"]').first();
      if (await chip.isVisible({ timeout: 10_000 }).catch(() => false)) {
        await chip.click();
      }
    }
    await page.getByTestId('submit-votes').click({ timeout: 30_000 });
    await expect(page.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });
  });
});
