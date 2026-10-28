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
      command:
        'POF_BILLING_SIMULATE=1 POF_AUTH_JWT_SECRET=e2e-pof-auth-secret npm run lobby:server',
      port: 8787,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command:
        'VITE_E2E_FAST_TIMERS=1 npx vite build --outDir dist-e2e-full && npx vite preview --outDir dist-e2e-full --host 127.0.0.1 --port 4173',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command:
        'VITE_WEB_JOIN_ONLY=true VITE_BILLING_SIMULATE=true VITE_E2E_FAST_TIMERS=1 npx vite build --outDir dist-e2e-web && npx vite preview --outDir dist-e2e-web --host 127.0.0.1 --port 4176',
      port: 4176,
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: ['**/mobile-full-game-flow.spec.js', '**/web-player-website.spec.js'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'web-player-website',
      testMatch: '**/web-player-website.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4176',
      },
    },
  ],
});
