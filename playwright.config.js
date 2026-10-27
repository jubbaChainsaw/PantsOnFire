import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/playwright',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run lobby:server',
      port: 8787,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command:
        'VITE_E2E_FAST_TIMERS=1 npm run build:mobile && npm run preview -- --host 127.0.0.1 --port 4173',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/mobile-full-game-flow.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      testMatch: '**/mobile-full-game-flow.spec.js',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
