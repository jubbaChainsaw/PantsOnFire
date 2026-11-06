/**
 * Multi-context E2E: online Two Truths — submit → vote → reveal (host phase advance).
 * Requires dev servers from playwright.config.js (lobby 8787 + Vite preview 4173).
 */
import { test, expect } from '@playwright/test';

const HOST_LS = {
  'imposter-account-session-v2': JSON.stringify({
    userId: 'e2e-online-tt-host',
    displayName: 'TT Host',
    tierId: 'host_most',
    addonTwistTruth: false,
    unlockedThemePackIds: [],
    authProvider: 'local',
  }),
  'pof-content-packs-prompt-dismissed-v1': 'true',
  'pof-e2e-force-round-type': 'twotruths',
};

function joinerLs(displayName) {
  return {
    'imposter-account-session-v2': JSON.stringify({
      userId: `e2e-online-tt-${displayName.replace(/\s/g, '')}`,
      displayName,
      tierId: 'host_most',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'local',
    }),
    'pof-content-packs-prompt-dismissed-v1': 'true',
    'pof-e2e-force-round-type': 'twotruths',
  };
}

async function openHome(host) {
  await host.goto('/');
  await host.getByTestId('app-shell-ready').waitFor({ state: 'attached', timeout: 120_000 });
}

async function openMultiplayerCreateLobby(page) {
  await page.getByRole('button', { name: 'Multiplayer' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Create lobby' }).click({ timeout: 30_000 });
}

async function seedReadyAndStart(host, joiners) {
  host.once('dialog', (d) => d.accept());
  await host.getByTestId('online-lobby-toggle-ready').click();
  for (const j of joiners) {
    await j.getByTestId('online-lobby-toggle-ready').click();
  }
  await host.getByTestId('online-lobby-start-match').click({ timeout: 30_000 });
}

async function skipRulesAndPickTwoTruths(host) {
  const grid = host.getByTestId('round-type-choice-grid');
  // Online host with lobby-pending syncs straight to round-type-choice (no game intro / rules).
  try {
    await grid.waitFor({ state: 'visible', timeout: 15_000 });
  } catch {
    await host.getByTestId('intro-skip').click({ timeout: 60_000 });
    await host.getByTestId('rules-continue').click({ timeout: 60_000 });
    await grid.waitFor({ state: 'visible', timeout: 120_000 });
  }
  await host.getByTestId('round-type-twotruths').click({ timeout: 30_000 });
  await host.getByTestId('choose-category-random').click({ timeout: 60_000 });
}

async function skipHostIntro(page) {
  await page.getByTestId('host-intro-visual').waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByTestId('host-intro-skip').click({ timeout: 30_000 });
}

async function fillTwotruthsSubmission(page, lines, lieIndex) {
  for (let i = 0; i < 3; i += 1) {
    await page.getByTestId(`twotruths-item-${i}`).fill(lines[i]);
  }
  await page.getByTestId(`twotruths-lie-${lieIndex}`).click();
  await page.getByTestId('twotruths-submit').click({ timeout: 30_000 });
}

/** Pick one lie per author panel (matrix completion; index 0 per list). */
async function submitAllVotesForCurrentPlayer(page) {
  const panels = page.locator('[data-testid^="twotruths-author-panel-"]');
  const count = await panels.count();
  for (let i = 0; i < count; i += 1) {
    const panel = panels.nth(i);
    await panel.locator('button[data-testid^="twotruths-vote-"]').first().click({
      timeout: 15_000,
    });
  }
  await page.getByTestId('twotruths-submit-votes').click({ timeout: 30_000 });
}

test.describe('Online Two Truths (multiplayer)', () => {
  test('submit → vote → reveal with three clients', async ({ browser }) => {
    test.setTimeout(420_000);

    const hostCtx = await browser.newContext();
    const host = await hostCtx.newPage();
    await host.addInitScript((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        localStorage.setItem(k, v);
      }
    }, HOST_LS);

    const j1Ctx = await browser.newContext();
    const joiner1 = await j1Ctx.newPage();
    await joiner1.addInitScript((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        localStorage.setItem(k, v);
      }
    }, joinerLs('Joiner One'));

    const j2Ctx = await browser.newContext();
    const joiner2 = await j2Ctx.newPage();
    await joiner2.addInitScript((obj) => {
      for (const [k, v] of Object.entries(obj)) {
        localStorage.setItem(k, v);
      }
    }, joinerLs('Joiner Two'));

    await openHome(host);
    await openMultiplayerCreateLobby(host);
    await host.getByTestId('online-setup-host-name').fill('Host TT');
    await host.getByTestId('online-setup-generate-code').click();
    await expect(host.getByTestId('online-lobby-code')).not.toHaveText('------', {
      timeout: 30_000,
    });
    const code = (await host.getByTestId('online-lobby-code').innerText()).trim();

    for (const page of [joiner1, joiner2]) {
      await openHome(page);
      await page.getByRole('button', { name: 'Multiplayer' }).click({ timeout: 30_000 });
      await page.getByRole('button', { name: 'Join lobby' }).click({ timeout: 30_000 });
      await page.getByTestId('online-join-code-input').fill(code);
      await page.getByTestId('online-join-code-continue').click();
      await page
        .getByTestId('online-join-player-name')
        .fill(page === joiner1 ? 'Joiner One' : 'Joiner Two');
      await page.getByTestId('online-join-submit').click({ timeout: 30_000 });
    }

    await seedReadyAndStart(host, [joiner1, joiner2]);

    await skipRulesAndPickTwoTruths(host);
    // Only the host is on host-intro while joiners stay on online-match-waiting until phase sync.
    await skipHostIntro(host);
    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-item-0').waitFor({ state: 'visible', timeout: 180_000 });
    }

    await fillTwotruthsSubmission(host, ['Alpha true one', 'Alpha true two', 'Alpha lie'], 2);
    await fillTwotruthsSubmission(joiner1, ['Beta true one', 'Beta true two', 'Beta lie'], 2);
    await fillTwotruthsSubmission(joiner2, ['Gamma true one', 'Gamma true two', 'Gamma lie'], 2);

    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-voting-pass').waitFor({ state: 'visible', timeout: 90_000 });
      await submitAllVotesForCurrentPlayer(page);
    }

    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-reveal-continue').waitFor({ state: 'visible', timeout: 120_000 });
    }

    const reconnectStatePath =
      test.info().outputPath('joiner1-reconnect-storage.json');
    await j1Ctx.storageState({ path: reconnectStatePath });
    await j1Ctx.close();

    await host.getByTestId('twotruths-reveal-continue').click();
    await expect(host.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });
    await expect(joiner2.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });

    const j1Reconnect = await browser.newContext({ storageState: reconnectStatePath });
    const joiner1b = await j1Reconnect.newPage();
    await joiner1b.goto('/');
    await joiner1b.getByTestId('app-shell-ready').waitFor({ state: 'attached', timeout: 120_000 });
    await expect(joiner1b.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });

    await hostCtx.close();
    await j2Ctx.close();
    await j1Reconnect.close();
  });
});
