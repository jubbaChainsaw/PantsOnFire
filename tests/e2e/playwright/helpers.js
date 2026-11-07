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

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const defaultAuditShotRoot = path.join(repoRoot, 'public/assets/ui/neon/apk-verify');

/** Directory for audit screenshots (override with POF_AUDIT_SHOT_ROOT). */
export function resolveAuditShotRoot() {
  const root = process.env.POF_AUDIT_SHOT_ROOT || defaultAuditShotRoot;
  fs.mkdirSync(root, { recursive: true });
  return root;
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
