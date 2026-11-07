import { test, expect } from '@playwright/test';

function seedLocalStorage() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem('pof-e2e-force-round-type', 'pairs');
  localStorage.setItem(
    'imposter-persona-profile-v1',
    JSON.stringify({
      realName: '',
      username: '',
      avatarSrc: '',
      inGameName: '',
      inGameBio: '',
    }),
  );
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

  test('Double Take full local round (spot-difference reveal → unanimous vote → scoring)', async ({
    page,
  }) => {
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
    let liarName = '';
    const innocentNames = [];
    let truthNameCount = 0;
    for (let i = 0; i < playerCount; i += 1) {
      await page.getByTestId('reveal-ready').click({ timeout: 60_000 });
      await page.waitForTimeout(2600);
      const label = page.getByTestId('double-take-reveal-label');
      await expect(label).toBeVisible({ timeout: 30_000 });
      const revealText = (await label.innerText()).trim();
      const passHeading = page.getByRole('heading', { name: /Pass the phone to/i });
      await expect(passHeading).toBeVisible({ timeout: 15_000 });
      const passLine = (await passHeading.innerText()).trim();
      const passMatch = passLine.match(/Pass the phone to (.+)$/i);
      const currentName = passMatch ? passMatch[1].trim() : '';
      expect(currentName).toBeTruthy();
      if (/you're the liar/i.test(revealText)) {
        liarName = currentName;
      } else {
        truthNameCount += 1;
        innocentNames.push(currentName);
        await expect(revealText).toMatch(/your picture/i);
      }
      await page.getByTestId('reveal-next').click({ timeout: 30_000 });
    }
    expect(truthNameCount).toBe(2);
    expect(liarName).toBeTruthy();

    for (let i = 0; i < playerCount; i += 1) {
      await page.getByTestId('one-word-local-next').click({ timeout: 60_000 });
    }
    await page.getByTestId('discussion-continue').click({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: /Vote now/i })).toBeVisible({
      timeout: 60_000,
    });

    const submitVotes = page.getByTestId('submit-votes');
    await expect(submitVotes).toBeDisabled();

    const decoyTarget = innocentNames[0];
    expect(decoyTarget).toBeTruthy();

    for (let i = 0; i < playerCount; i += 1) {
      const passLineVote = await page
        .locator('.pof-ui-copy')
        .filter({ hasText: 'Pass the phone to' })
        .innerText();
      const voterName =
        (passLineVote.match(/Pass the phone to\s+(.+?)\s*\./) || [])[1]?.trim() || '';
      expect(voterName).toBeTruthy();
      const targetName = voterName === liarName ? decoyTarget : liarName;
      await page.getByRole('button', { name: targetName, exact: true }).click({
        timeout: 30_000,
      });
    }
    await expect(submitVotes).toBeEnabled({ timeout: 15_000 });
    await submitVotes.click();

    await expect(page.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('results-liar-caught')).toBeVisible();
    await expect(page.getByTestId('double-take-pairs-reveal')).toBeVisible();
    await expect(page.getByText(/VOTE HIT \+1/)).toHaveCount(2);
    await expect(page.getByText(/VOTE HIT \+0/)).toHaveCount(1);
  });
});
