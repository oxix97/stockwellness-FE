import { expect, test as base, type Route } from '@playwright/test';

function rejectUnhandledRequest(route: Route): never {
  const pathname = new URL(route.request().url()).pathname;
  throw new Error(`기본 E2E lane에서 mock되지 않은 네트워크 요청이 발생했습니다: ${pathname}`);
}

export const test = base.extend<{ mockOnlyNetworkGuard: void }>({
  mockOnlyNetworkGuard: [
    async ({ page }, use) => {
      await page.route('**/api/v1/**', rejectUnhandledRequest);
      await page.route('**/oauth2/**', rejectUnhandledRequest);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
