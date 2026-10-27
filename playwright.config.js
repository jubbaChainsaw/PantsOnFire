import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/playwright',
  timeout: 120_000,
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
    {
      command:
        'VITE_E2E_FORCE_ROUND_TYPE=twotruths VITE_E2E_FAST_TIMERS=1 npm run build:mobile && npm run preview -- --host 127.0.0.1 --port 4174',
      port: 4174,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command:
        'VITE_E2E_FORCE_ROUND_TYPE=chain VITE_E2E_FAST_TIMERS=1 npm run build:mobile && npm run preview -- --host 127.0.0.1 --port 4175',
      port: 4175,
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
    {
      name: 'two-truths-fire',
      testMatch: '**/two-truths-one-fire.spec.js',
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://127.0.0.1:4174',
      },
    },
    {
      name: 'bug-report-screen',
      testMatch: '**/bug-report-screen.spec.js',
      use: {
        viewport: { width: 360, height: 780 },
        baseURL: 'http://127.0.0.1:4173',
      },
    },
    {
      name: 'chain-mobile-screens',
      testMatch: '**/chain-reaction-mobile-screens.spec.js',
      use: {
        viewport: { width: 360, height: 780 },
        baseURL: 'http://127.0.0.1:4175',
      },
    },
  ],
});
