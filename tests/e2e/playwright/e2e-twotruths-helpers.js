/**
 * Shared Playwright helpers for online Two Truths multiplayer specs.
 */
import { expect } from '@playwright/test';

function hostLs(suffix = 'a') {
  return {
  'imposter-account-session-v2': JSON.stringify({
    userId: `e2e-online-tt-host-${suffix}`,
    displayName: 'TT Host',
    tierId: 'host_most',
    addonTwistTruth: false,
    unlockedThemePackIds: [],
    authProvider: 'local',
  }),
  'pof-content-packs-prompt-dismissed-v1': 'true',
  'pof-e2e-force-round-type': 'twotruths',
};
}

export function joinerLs(displayName, suffix = 'a') {
  return {
    'imposter-account-session-v2': JSON.stringify({
      userId: `e2e-online-tt-${suffix}-${displayName.replace(/\s/g, '')}`,
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

export async function openHome(page) {
  await page.goto('/');
  await page.getByTestId('app-shell-ready').waitFor({ state: 'attached', timeout: 120_000 });
}

export async function openMultiplayerCreateLobby(page) {
  await page.getByRole('button', { name: 'Multiplayer' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Create lobby' }).click({ timeout: 30_000 });
}

export async function seedReadyAndStart(host, joiners) {
  host.once('dialog', (d) => d.accept());
  await host.getByTestId('online-lobby-toggle-ready').click();
  for (const j of joiners) {
    await j.getByTestId('online-lobby-toggle-ready').click();
  }
  await host.getByTestId('online-lobby-start-match').click({ timeout: 30_000 });
}

export async function skipRulesAndPickTwoTruths(host) {
  const grid = host.getByTestId('round-type-choice-grid');
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

export async function skipHostIntro(page) {
  await page.getByTestId('host-intro-visual').waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByTestId('host-intro-skip').click({ timeout: 30_000 });
}

export async function fillTwotruthsSubmission(page, lines, lieIndex) {
  for (let i = 0; i < 3; i += 1) {
    await page.getByTestId(`twotruths-item-${i}`).fill(lines[i]);
  }
  await page.getByTestId(`twotruths-lie-${lieIndex}`).click();
  await page.getByTestId('twotruths-submit').click({ timeout: 30_000 });
}

async function voteLieInPanel(panel, mode) {
  const buttons = panel.locator('button[data-testid^="twotruths-vote-"]');
  const count = await buttons.count();
  if (mode === 'correct') {
    for (let i = 0; i < count; i += 1) {
      const text = await buttons.nth(i).innerText();
      if (/\slie$/i.test(text.trim())) {
        await buttons.nth(i).click({ timeout: 15_000 });
        return;
      }
    }
    throw new Error('no lie button found in author panel');
  }
  for (let i = 0; i < count; i += 1) {
    const text = await buttons.nth(i).innerText();
    if (!/\slie$/i.test(text.trim())) {
      await buttons.nth(i).click({ timeout: 15_000 });
      return;
    }
  }
  await buttons.first().click({ timeout: 15_000 });
}

/** @param {'correct' | 'wrong'} mode */
export async function submitVotesForPlayer(page, mode = 'correct') {
  const panels = page.locator('[data-testid^="twotruths-author-panel-"]');
  const count = await panels.count();
  for (let i = 0; i < count; i += 1) {
    await voteLieInPanel(panels.nth(i), mode);
  }
  await page.getByTestId('twotruths-submit-votes').click({ timeout: 30_000 });
}

export async function expectCorrectSpotTally(page, { spots0, spots2 }) {
  await page.getByText('The lies are lit').waitFor({ state: 'visible', timeout: 60_000 });
  const rows = page.getByTestId(/^twotruths-reveal-(?!continue$).+/);
  await expect(rows).toHaveCount(3, { timeout: 60_000 });
  const texts = await rows.allTextContents();
  const count0 = texts.filter((t) => t.includes('Correct spots 0')).length;
  const count2 = texts.filter((t) => t.includes('Correct spots 2')).length;
  expect(count0).toBe(spots0);
  expect(count2).toBe(spots2);
}

export async function createThreePlayerLobby(browser, { runId = 'run' } = {}) {
  const hostCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const primeStorage = ({ obj, idKey }) => {
    for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, v);
    localStorage.setItem(
      'imposter-online-client-id-v1',
      `ocl-${idKey}-${Math.random().toString(36).slice(2, 10)}`,
    );
    localStorage.removeItem('imposter-online-session-v1');
  };

  await host.addInitScript(primeStorage, { obj: hostLs(runId), idKey: `${runId}-host` });

  const j1Ctx = await browser.newContext();
  const joiner1 = await j1Ctx.newPage();
  await joiner1.addInitScript(primeStorage, {
    obj: joinerLs('Joiner One', runId),
    idKey: `${runId}-j1`,
  });

  const j2Ctx = await browser.newContext();
  const joiner2 = await j2Ctx.newPage();
  await joiner2.addInitScript(primeStorage, {
    obj: joinerLs('Joiner Two', runId),
    idKey: `${runId}-j2`,
  });

  await openHome(host);
  await openMultiplayerCreateLobby(host);
  await host.getByTestId('online-setup-host-name').fill('Host TT');
  await host.getByTestId('online-setup-generate-code').click();
  await expect(host.getByTestId('online-lobby-code')).not.toHaveText('------', {
    timeout: 30_000,
  });
  const code = (await host.getByTestId('online-lobby-code').innerText()).trim();

  for (const [page, name] of [
    [joiner1, 'Joiner One'],
    [joiner2, 'Joiner Two'],
  ]) {
    await openHome(page);
    await page.getByRole('button', { name: 'Multiplayer' }).click({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Join lobby' }).click({ timeout: 30_000 });
    await page.getByTestId('online-join-code-input').fill(code);
    await page.getByTestId('online-join-code-continue').click();
    await page
      .getByTestId('online-join-player-name')
      .waitFor({ state: 'visible', timeout: 90_000 });
    await page.getByTestId('online-join-player-name').fill(name);
    await page.getByTestId('online-join-submit').click({ timeout: 30_000 });
  }

  await seedReadyAndStart(host, [joiner1, joiner2]);
  await skipRulesAndPickTwoTruths(host);
  await skipHostIntro(host);

  for (const page of [host, joiner1, joiner2]) {
    await page.getByTestId('twotruths-item-0').waitFor({ state: 'visible', timeout: 180_000 });
  }

  return { hostCtx, host, j1Ctx, joiner1, j2Ctx, joiner2, code };
}

export const SUBMISSION_LINES = {
  host: ['Alpha true one', 'Alpha true two', 'Alpha lie'],
  j1: ['Beta true one', 'Beta true two', 'Beta lie'],
  j2: ['Gamma true one', 'Gamma true two', 'Gamma lie'],
};
