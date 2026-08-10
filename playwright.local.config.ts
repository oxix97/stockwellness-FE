import { defineConfig, devices } from '@playwright/test';
import { assertRealApiEnvironment } from './tests/global-setup';

assertRealApiEnvironment();

export default defineConfig({
  testDir: './tests',
  testMatch: '**/api-integration.e2e.spec.ts',
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BACKEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'isolated-real-api',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
