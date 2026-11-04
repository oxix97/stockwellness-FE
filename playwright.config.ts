import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.spec.ts',
  testIgnore: '**/api-integration.e2e.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 테스트 실행 전 로컬 서버 자동 시작 (선택 사항)
  // webServer: {
  //   command: 'yarn dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
