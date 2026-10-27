import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/playwright',
  timeout: 180_000,
  retries: 0,
  use: {
    baseURL: process.env.POF_LOBBY_PREVIEW_URL || 'http://127.0.0.1:4178',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
