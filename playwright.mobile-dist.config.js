import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e/playwright',
  testMatch: 'mobile-bundled-dist-smoke.spec.js',
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4177',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'npx vite preview --outDir dist-android --host 127.0.0.1 --port 4177 --strictPort',
    port: 4177,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
