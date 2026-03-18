import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3939',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx next dev --turbopack --port 3939',
    url: 'http://localhost:3939',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
