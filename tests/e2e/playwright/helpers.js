/** @param {import('@playwright/test').Page} page */
export async function seedLocalAccount(page, tierId = 'host_most') {
  await page.addInitScript((tier) => {
    localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
    localStorage.setItem(
      'imposter-account-session-v2',
      JSON.stringify({
        userId: 'e2e-user',
        displayName: 'E2E Tester',
        tierId: tier,
        addonTwistTruth: false,
        unlockedThemePackIds: [],
        authProvider: 'local',
      }),
    );
  }, tierId);
  await page.goto('/');
  await page.evaluate(
    (tier) => {
      localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
      localStorage.setItem(
        'imposter-account-session-v2',
        JSON.stringify({
          userId: 'e2e-user',
          displayName: 'E2E Tester',
          tierId: tier,
          addonTwistTruth: false,
          unlockedThemePackIds: [],
          authProvider: 'local',
        }),
      );
    },
    tierId,
  );
  await page.reload({ waitUntil: 'networkidle' });
  const play = page.getByRole('button', { name: 'Play', exact: true });
  const setup = page.getByRole('button', { name: 'Setup Game' });
  const joinOnline = page.getByRole('button', { name: 'Join Online Lobby' });
  await Promise.race([
    play.waitFor({ state: 'visible', timeout: 30_000 }),
    setup.waitFor({ state: 'visible', timeout: 30_000 }),
    joinOnline.waitFor({ state: 'visible', timeout: 30_000 }),
  ]);
}

/** @param {import('@playwright/test').Page} page */
export async function openLocalGameSetup(page) {
  const play = page.getByRole('button', { name: 'Play', exact: true });
  if (await play.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await play.click();
    return;
  }
  await page.getByRole('button', { name: 'Setup Game' }).click();
}
