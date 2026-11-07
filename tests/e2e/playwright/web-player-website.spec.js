import { test, expect } from '@playwright/test';
import { resolveAuditShotRoot, seedLocalAccount } from './helpers.js';

const SHOTS = resolveAuditShotRoot();
const HOST_BASE = 'http://127.0.0.1:4173';
const WEB_BASE = 'http://127.0.0.1:4176';

test.describe('web player (join-only)', () => {
  test('host on full app + guest on web join-only with deep link', async ({ browser }) => {
    const hostContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      baseURL: HOST_BASE,
    });
    const guestContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      baseURL: WEB_BASE,
    });
    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    await seedLocalAccount(hostPage, 'suspect');
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Multiplayer' }).click();
    await hostPage.getByRole('button', { name: 'Create lobby' }).click();
    await hostPage.locator('input').first().fill('Web Host');
    await hostPage.getByRole('button', { name: 'Generate Lobby Code' }).click();
    await expect(hostPage.getByText(/share this code/i)).toBeVisible({ timeout: 45_000 });
    // Lobby code is rendered in PoF Display (.pof-countdown-digit), not .font-mono
    const code = String(
      await hostPage.locator('.pof-countdown-digit').first().textContent(),
    )
      .trim()
      .replace(/\s+/g, '');

    await seedLocalAccount(guestPage, 'fibber');
    await guestPage.goto(`/?join=${code}`);
    await expect(guestPage.getByTestId('online-join-code-continue')).toBeVisible({
      timeout: 15_000,
    });
    await expect(guestPage.getByTestId('online-join-code-input')).toHaveValue(code);
    await guestPage.screenshot({
      path: `${SHOTS}/web-player-join-link-mobile-390x844.png`,
      fullPage: true,
    });

    await guestPage.getByTestId('online-join-code-continue').click();
    await guestPage.getByTestId('online-join-player-name').fill('Web Guest');
    await guestPage.getByTestId('online-join-submit').click();
    await expect(guestPage.getByText('Joined Lobby')).toBeVisible({ timeout: 45_000 });

    await hostContext.close();
    await guestContext.close();
  });

  test('home and shop device notices (desktop + mobile)', async ({ page }) => {
    await seedLocalAccount(page, 'host_most');
    await page.goto('/');
    await expect(page.getByTestId('web-player-notice-home')).toBeVisible();
    await page.screenshot({
      path: `${SHOTS}/web-player-home-desktop-1280x800.png`,
      fullPage: true,
    });
    await page.goto('/?pofScreen=store');
    await expect(page.getByTestId('web-player-notice-shop')).toBeVisible();
    await page.screenshot({
      path: `${SHOTS}/web-player-shop-desktop-1280x800.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `${SHOTS}/web-player-shop-mobile-390x844.png`,
      fullPage: true,
    });
  });

  test('entitlements sync via simulate API (two readers)', async ({ request }) => {
    const userId = `e2e-web-sync-${Date.now()}`;
    const grant = await request.post('http://127.0.0.1:8787/api/billing/simulate-purchase', {
      data: { userId, kind: 'tier', productId: 'suspect' },
    });
    expect(grant.ok()).toBeTruthy();
    const rowA = await (
      await request.get(`http://127.0.0.1:8787/api/billing/dev/entitlements/${userId}`)
    ).json();
    const rowB = await (
      await request.get(`http://127.0.0.1:8787/api/billing/dev/entitlements/${userId}`)
    ).json();
    expect(rowA.tierId).toBe('suspect');
    expect(rowB.tierId).toBe('suspect');
  });
});
