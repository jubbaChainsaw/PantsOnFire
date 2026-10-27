/** @param {import('@playwright/test').Page} page */
export async function seedLocalAccount(page, tierId = 'host_most') {
  await page.addInitScript((tier) => {
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
  await page.reload();
  await page.getByRole('button', { name: 'Play', exact: true }).waitFor({
    state: 'visible',
    timeout: 15_000,
  });
}
