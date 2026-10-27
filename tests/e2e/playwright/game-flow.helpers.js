import { expect } from '@playwright/test';

async function dismissContentPackPrompt(page) {
  const later = page.getByRole('button', { name: 'Later' });
  if (await later.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await later.click();
  }
}

export async function setupThreePlayerGame(page) {
  await dismissContentPackPrompt(page);
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await expect(play).toBeEnabled({ timeout: 20_000 });
  await play.click();
  await expect(page.getByTestId('start-match')).toBeVisible({ timeout: 15_000 });
  const inputs = page.locator('input:not([type="hidden"])');
  const count = await inputs.count();
  for (let i = 0; i < Math.min(count, 3); i += 1) {
    await inputs.nth(i).fill(`Player ${i + 1}`);
  }
  await page.getByTestId('start-match').click();
}

export async function skipIntroAndRules(page) {
  const skip = page.getByTestId('intro-skip');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
  await page.getByTestId('rules-continue').click();
}

export async function pickFirstRoundTypeAndCategory(page) {
  const roundBtn = page.locator('button[data-testid^="round-type-"]').first();
  await expect(roundBtn).toBeVisible({ timeout: 15_000 });
  await roundBtn.click();
  const cat = page.locator('[data-testid^="category-"]');
  const hostSkip = page.getByTestId('host-intro-skip');
  await Promise.race([
    cat.first().waitFor({ state: 'visible', timeout: 15_000 }),
    hostSkip.waitFor({ state: 'visible', timeout: 15_000 }),
  ]);
  if (await cat.first().isVisible().catch(() => false)) {
    await cat.first().click();
  }
}

export async function passRevealPhase(page, playerCount = 3) {
  for (let i = 0; i < playerCount; i += 1) {
    const ready = page.getByTestId('reveal-ready');
    if (await ready.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await ready.click();
      await page.waitForTimeout(2500);
    }
    const next = page.getByTestId('reveal-next');
    await expect(next).toBeVisible({ timeout: 15_000 });
    await next.click();
  }
}

export async function completeLocalVoting(page, playerCount = 3) {
  for (let v = 0; v < playerCount; v += 1) {
    const voteBtn = page.locator('[data-testid^="vote-for-"]').first();
    await expect(voteBtn).toBeVisible({ timeout: 10_000 });
    await voteBtn.click();
  }
  await page.getByTestId('submit-votes').click();
}
