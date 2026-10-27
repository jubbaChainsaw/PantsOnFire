import { test, expect } from '@playwright/test';
import { seedLocalAccount } from './helpers.js';

test('Play navigates to setup and shows player controls', async ({ page }) => {
  await seedLocalAccount(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^Play$/i }).click();
  await expect(page.getByText(/players/i).first()).toBeVisible({ timeout: 15_000 });
});

test('home has no 18+ mode entry', async ({ page }) => {
  await seedLocalAccount(page);
  await page.goto('/');
  await expect(page.getByText(/18\+/i)).toHaveCount(0);
});

test('Fibber tier disables Create lobby but allows join', async ({ page }) => {
  await seedLocalAccount(page, 'fibber');
  await page.goto('/');
  await page.getByRole('button', { name: /Multiplayer/i }).click();
  const createBtn = page.getByRole('button', { name: /Create lobby/i });
  await expect(createBtn).toBeDisabled();
  await expect(page.getByRole('button', { name: /Join lobby/i })).toBeEnabled();
});

test('settings screen opens from home', async ({ page }) => {
  await seedLocalAccount(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^Settings$/i }).click();
  await expect(page.getByText(/music/i).first()).toBeVisible({ timeout: 10_000 });
});
