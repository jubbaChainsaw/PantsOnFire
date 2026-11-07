/**
 * Multi-context E2E: online Two Truths — submit/vote/reveal, reconnect, scoring.
 */
import { test, expect } from '@playwright/test';
import {
  SUBMISSION_LINES,
  createThreePlayerLobby,
  fillTwotruthsSubmission,
  submitVotesForPlayer,
  expectCorrectSpotTally,
  openHome,
  readStoredOnlineSession,
  expectResumeRotatesSessionToken,
  expectStaleSessionTokenRejected,
} from './e2e-twotruths-helpers.js';

const SESSION_KEY = 'imposter-online-session-v1';

test.describe.configure({ mode: 'serial' });

test.describe('Online Two Truths (multiplayer)', () => {
  test.afterEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 4000));
  });
  test('mid-submit reconnect restores session token and completes matrix', async ({ browser }) => {
    test.setTimeout(420_000);
    const { hostCtx, host, j1Ctx, joiner1, j2Ctx, joiner2 } = await createThreePlayerLobby(
      browser,
      { runId: 'mid-submit' },
    );

    const midSubmitState = test.info().outputPath('joiner2-mid-submit-storage.json');
    const storedSession = await joiner2.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
    expect(storedSession).toBeTruthy();
    await j2Ctx.storageState({ path: midSubmitState });
    await j2Ctx.close();

    await fillTwotruthsSubmission(host, SUBMISSION_LINES.host, 2);
    await fillTwotruthsSubmission(joiner1, SUBMISSION_LINES.j1, 2);

    const j2Reconnect = await browser.newContext({ storageState: midSubmitState });
    const joiner2b = await j2Reconnect.newPage();
    await joiner2b.goto('/');
    await joiner2b.getByTestId('app-shell-ready').waitFor({ state: 'attached', timeout: 120_000 });
    const staleJoiner2 = JSON.parse(storedSession);
    await expectResumeRotatesSessionToken(joiner2b, staleJoiner2);
    await expectStaleSessionTokenRejected(joiner2b, staleJoiner2);
    await joiner2b.getByTestId('twotruths-item-0').waitFor({ state: 'visible', timeout: 120_000 });
    await fillTwotruthsSubmission(joiner2b, SUBMISSION_LINES.j2, 2);

    for (const page of [host, joiner1, joiner2b]) {
      await page.getByTestId('twotruths-voting-pass').waitFor({ state: 'visible', timeout: 90_000 });
      await submitVotesForPlayer(page, 'correct');
    }

    await host.getByTestId('twotruths-reveal-continue').waitFor({ state: 'visible', timeout: 120_000 });
    await host.getByTestId('twotruths-reveal-continue').click();
    await expect(host.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });

    await hostCtx.close();
    await j1Ctx.close();
    await j2Reconnect.close();
  });

  test('mid-vote reconnect and post-reveal resume', async ({ browser }) => {
    test.setTimeout(420_000);
    const { hostCtx, host, j1Ctx, joiner1, j2Ctx, joiner2 } = await createThreePlayerLobby(browser, {
      runId: 'mid-vote',
    });

    await fillTwotruthsSubmission(host, SUBMISSION_LINES.host, 2);
    await fillTwotruthsSubmission(joiner1, SUBMISSION_LINES.j1, 2);
    await fillTwotruthsSubmission(joiner2, SUBMISSION_LINES.j2, 2);

    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-voting-pass').waitFor({ state: 'visible', timeout: 90_000 });
    }

    await submitVotesForPlayer(host, 'correct');

    const sessionBeforeDisconnect = await readStoredOnlineSession(joiner1);
    expect(sessionBeforeDisconnect?.sessionToken).toBeTruthy();

    const midVoteState = test.info().outputPath('joiner1-mid-vote-storage.json');
    await j1Ctx.storageState({ path: midVoteState });
    await j1Ctx.close();

    await submitVotesForPlayer(joiner2, 'correct');

    const j1Reconnect = await browser.newContext({ storageState: midVoteState });
    const joiner1b = await j1Reconnect.newPage();
    await joiner1b.goto('/');
    await joiner1b.getByTestId('app-shell-ready').waitFor({ state: 'attached', timeout: 120_000 });
    await expectResumeRotatesSessionToken(joiner1b, sessionBeforeDisconnect);
    await expectStaleSessionTokenRejected(joiner1b, sessionBeforeDisconnect);
    await joiner1b.getByTestId('twotruths-voting-pass').waitFor({ state: 'visible', timeout: 120_000 });
    await submitVotesForPlayer(joiner1b, 'correct');

    for (const page of [host, joiner2, joiner1b]) {
      await page.getByTestId('twotruths-reveal-continue').waitFor({ state: 'visible', timeout: 120_000 });
    }

    const postRevealState = test.info().outputPath('joiner1-post-reveal-storage.json');
    await j1Reconnect.storageState({ path: postRevealState });
    await j1Reconnect.close();

    await host.getByTestId('twotruths-reveal-continue').click();
    await expect(host.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });
    await expect(joiner2.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });

    const j1Final = await browser.newContext({ storageState: postRevealState });
    const joiner1c = await j1Final.newPage();
    await openHome(joiner1c);
    await expect(joiner1c.getByTestId('results-screen-root')).toBeVisible({ timeout: 90_000 });

    await hostCtx.close();
    await j2Ctx.close();
    await j1Final.close();
  });

  test('authoritative scoring: correct vs wrong votes on reveal', async ({ browser }) => {
    test.setTimeout(420_000);
    const { hostCtx, host, j1Ctx, joiner1, j2Ctx, joiner2 } = await createThreePlayerLobby(
      browser,
      { runId: 'scoring' },
    );

    await fillTwotruthsSubmission(host, SUBMISSION_LINES.host, 2);
    await fillTwotruthsSubmission(joiner1, SUBMISSION_LINES.j1, 2);
    await fillTwotruthsSubmission(joiner2, SUBMISSION_LINES.j2, 2);

    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-voting-pass').waitFor({ state: 'visible', timeout: 90_000 });
    }

    await submitVotesForPlayer(host, 'correct');
    await submitVotesForPlayer(joiner1, 'correct');
    await submitVotesForPlayer(joiner2, 'wrong');

    for (const page of [host, joiner1, joiner2]) {
      await page.getByTestId('twotruths-reveal-continue').waitFor({ state: 'visible', timeout: 120_000 });
    }

    await expectCorrectSpotTally(host, { spots0: 1, spots2: 2 });
    await expectCorrectSpotTally(joiner1, { spots0: 1, spots2: 2 });
    await expectCorrectSpotTally(joiner2, { spots0: 1, spots2: 2 });

    await hostCtx.close();
    await j1Ctx.close();
    await j2Ctx.close();
  });
});
