import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';
import {
  completeLocalVoting,
  passRevealPhase,
  pickFirstRoundTypeAndCategory,
  setupThreePlayerGame,
  skipIntroAndRules,
} from './game-flow.helpers.js';

test.beforeEach(async ({ page }) => {
  await seedLocalAccount(page, 'host_most');
  await page.goto('/');
});

test('pass-the-phone: full round through voting', async ({ page }) => {
  await setupThreePlayerGame(page);
  await skipIntroAndRules(page);
  await pickFirstRoundTypeAndCategory(page);
  const hostSkip = page.getByTestId('host-intro-skip');
  if (await hostSkip.isVisible({ timeout: 15_000 }).catch(() => false)) {
    await hostSkip.click();
  }
  await passRevealPhase(page, 3);
  await page.getByTestId('discussion-continue').click();
  await completeLocalVoting(page, 3);
  await expect(page.getByText(/liar|results|caught|escaped/i).first()).toBeVisible({
    timeout: 20_000,
  });
});
