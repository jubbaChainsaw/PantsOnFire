import { test, expect, chromium } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';

const LOBBY_API = 'https://api.pantsonfire.app';
const SHOTS = '/workspace/public/assets/ui/neon/apk-verify';
const PREVIEW = process.env.POF_LOBBY_PREVIEW_URL || 'http://127.0.0.1:4173';

async function seedSuspectAccount(page) {
  await seedLocalAccount(page, 'suspect');
}

async function openCreateLobbyFlow(page) {
  await page.getByRole('button', { name: 'Multiplayer' }).click();
  await page.getByRole('button', { name: 'Create lobby' }).click();
}

async function submitOnlineSetup(page, hostName = 'Host E2E') {
  const nameInput = page.locator('input').first();
  await nameInput.fill(hostName);
  await page.getByRole('button', { name: 'Generate Lobby Code' }).click();
}

test.describe('production lobby API (two clients)', () => {
  test.describe.configure({ mode: 'serial' });

  test('create, join, and capture lobby state', async () => {
    test.setTimeout(180_000);

    const browser = await chromium.launch({
      args: ['--disable-web-security'],
    });

    const hostContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      baseURL: PREVIEW,
    });
    const guestContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      baseURL: PREVIEW,
    });

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    const report = {
      lobbyApi: LOBBY_API,
      baseUrl: PREVIEW,
      steps: [],
      status: 'unknown',
    };

    try {
      const health = await hostPage.request.get(`${LOBBY_API}/health`);
      report.healthOk = health.ok();

      await seedSuspectAccount(hostPage);
      await seedSuspectAccount(guestPage);

      await hostPage.goto('/');
      await openCreateLobbyFlow(hostPage);
      await submitOnlineSetup(hostPage, 'Lobby Host');

      await expect(hostPage.getByText(/share this code/i)).toBeVisible({ timeout: 45_000 });
      report.steps.push('host-created-lobby');

      const codeText = await hostPage
        .locator('.font-mono')
        .first()
        .textContent();
      const lobbyCode = String(codeText || '').trim();
      report.lobbyCode = lobbyCode;
      expect(lobbyCode.length).toBeGreaterThanOrEqual(4);

      await hostPage.screenshot({
        path: `${SHOTS}/online-lobby-host-390x844.png`,
        fullPage: true,
      });

      await guestPage.goto('/');
      await guestPage.getByRole('button', { name: 'Multiplayer' }).click();
      await guestPage.getByRole('button', { name: 'Join lobby' }).click();
      await guestPage.locator('input').first().fill(lobbyCode);
      await guestPage.getByRole('button', { name: 'Continue' }).click();
      await guestPage.locator('input').first().fill('Guest E2E');
      await guestPage.getByRole('button', { name: 'Join Game' }).click();

      await expect(guestPage.getByText('Joined Lobby')).toBeVisible({ timeout: 45_000 });
      report.steps.push('guest-joined');

      await guestPage.screenshot({
        path: `${SHOTS}/online-lobby-guest-390x844.png`,
        fullPage: true,
      });

      await hostPage.getByRole('button', { name: /i'm ready|ready/i }).click();
      await guestPage.getByRole('button', { name: /i'm ready|ready/i }).click();
      report.steps.push('host-guest-ready');

      await hostPage.waitForTimeout(1500);
      const startBtn = hostPage.getByRole('button', { name: /let's start/i });
      const startDisabled = await startBtn.isDisabled();
      report.canStart = !startDisabled;
      if (startDisabled) {
        report.steps.push('start-disabled-needs-more-ready');
        report.status = 'partially-works';
      } else {
        await startBtn.click();
        report.steps.push('match-started');
        report.status = 'works';
      }
      expect(report.steps).toContain('guest-joined');
    } catch (err) {
      if (!report.status || report.status === 'unknown') {
        report.status = report.steps.includes('guest-joined') ? 'partially-works' : 'not-working';
      }
      report.error = String(err?.message || err);
      if (!report.steps.includes('guest-joined')) throw err;
    } finally {
      const fs = await import('node:fs/promises');
      await fs.writeFile(
        `${SHOTS}/online-lobby-investigation.json`,
        `${JSON.stringify(report, null, 2)}\n`,
      );
      await browser.close();
    }
  });
});
