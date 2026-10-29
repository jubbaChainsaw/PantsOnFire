/**
 * Profile UI verification shots.
 * npm run build && npx vite preview --host 127.0.0.1 --port 4177 --strictPort
 * PREVIEW_URL=http://127.0.0.1:4177 node scripts/capturePlayerProfileWebVerify.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = path.resolve('public/assets/ui/neon/web-verify');
const PREVIEW = process.env.PREVIEW_URL || 'http://127.0.0.1:4177';

function seedProfile() {
  localStorage.setItem('pof-content-packs-prompt-dismissed-v1', 'true');
  localStorage.setItem(
    'imposter-account-session-v2',
    JSON.stringify({
      userId: 'profile-verify',
      displayName: 'Profile Verify',
      tierId: 'local_liar',
      addonTwistTruth: false,
      unlockedThemePackIds: [],
      authProvider: 'supabase',
      unlockedAltCardThemeKeys: ['Pirates', 'Default'],
    }),
  );
  localStorage.setItem(
    'imposter-player-profile-v1',
    JSON.stringify({
      version: 1,
      stats: {
        gamesPlayed: 14,
        gamesHosted: 11,
        gamesWon: 6,
        timesLiar: 9,
        timesLiarNotCaught: 7,
        timesLiarCaught: 2,
        timesAccusedInnocent: 12,
        votesCorrect: 28,
        votesIncorrect: 6,
        themesPlayed: { Default: 4, Pirates: 3, Cowboys: 2, Gangsters: 1 },
        roundTypesPlayed: { prompt: 8, pairs: 3, grill: 2, twotruths: 1 },
      },
      recentGames: [
        {
          id: 'g1',
          dateIso: new Date().toISOString(),
          themeName: 'Pirates',
          mode: 'local',
          role: 'host',
          result: 'won',
        },
        {
          id: 'g2',
          dateIso: new Date(Date.now() - 86400000).toISOString(),
          themeName: 'Default',
          mode: 'online',
          role: 'player',
          result: 'played',
        },
      ],
      achievementProgress: {},
      unlockedAchievementIds: ['fresh-pants', 'welcome-host', 'first-verdict'],
      unlockedDefaultBackSlugs: ['flaming-pants', 'lie-detector'],
      achievementUnlockedThemeNames: ['Cowboys'],
      selectedDefaultBackSlug: 'flaming-pants',
      unlockedAltCardThemeKeys: ['Pirates', 'Default'],
    }),
  );
}

async function openProfile(page) {
  await page.locator('[data-testid="app-shell-ready"]').waitFor({ timeout: 90000 });
  await page.locator('[data-testid="startup-loading-overlay"]').waitFor({
    state: 'detached',
    timeout: 90000,
  });
  await page.getByRole('button', { name: 'Leaderboard and stats' }).click();
  await page.getByTestId('player-profile-screen').waitFor({ timeout: 30000 });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: PREVIEW,
  });
  const page = await context.newPage();
  await page.addInitScript(seedProfile);
  await page.goto('/');
  await openProfile(page);
  await page.screenshot({
    path: path.join(OUT, 'web-verify-player-profile-stats-1280x800.png'),
  });
  await page.getByTestId('profile-tab-history').click();
  await page.getByTestId('profile-history-panel').waitFor();
  await page.screenshot({
    path: path.join(OUT, 'web-verify-player-profile-history-1280x800.png'),
  });
  await page.getByTestId('profile-tab-decks').click();
  await page.getByTestId('profile-decks-panel').waitFor();
  await page.screenshot({
    path: path.join(OUT, 'web-verify-player-profile-decks-1280x800.png'),
  });
  await page.getByTestId('profile-tab-achievements').click();
  await page.getByTestId('profile-achievements-panel').waitFor();
  await page.screenshot({
    path: path.join(OUT, 'web-verify-player-profile-achievements-1280x800.png'),
  });
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('pof-e2e-achievement-toast', {
        detail: {
          title: 'Fresh Pants',
          body: 'Finish your first full game. The lies were free samples.',
        },
      }),
    );
  });
  await page.getByTestId('achievement-unlock-toast').waitFor({ timeout: 5000 });
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(OUT, 'web-verify-player-profile-achievement-toast-1280x800.png'),
  });
  await browser.close();
  console.log('Profile verify PNGs written to', OUT);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
