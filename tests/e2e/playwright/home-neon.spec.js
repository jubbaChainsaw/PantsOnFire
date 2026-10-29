import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';

test('home shows neon Play and Multiplayer', async ({ page }) => {
  await seedLocalAccount(page);
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Multiplayer/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Card Decks/i })).toBeVisible();
});

test('settings persist music toggle in localStorage', async ({ page }) => {
  await seedLocalAccount(page);
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'pof-settings',
      JSON.stringify({
        sfx: true,
        music: false,
        haptics: true,
        mic: true,
        musicVol: 40,
        sfxVol: 70,
      }),
    );
  });
  await page.reload();
  const music = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pof-settings') || '{}').music,
  );
  expect(music).toBe(false);
});
