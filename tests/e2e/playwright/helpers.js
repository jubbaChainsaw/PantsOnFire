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
}
