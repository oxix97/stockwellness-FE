import { test, expect } from '@playwright/test';

test.describe('Home Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth state before page load
    await page.addInitScript(() => {
      const authData = {
        state: {
          memberId: 1,
          email: 'test@example.com',
          nickname: '테스터',
          portfolioId: '1',
          accessToken: 'mock_access_token',
          joinedDate: '2026-01-01T00:00:00.000Z'
        },
        version: 0
      };
      window.localStorage.setItem('auth-storage', JSON.stringify(authData));
      window.localStorage.setItem('accessToken', 'mock_access_token');
    });
    
    // Mock API calls that Home screen makes
    await page.route('**/api/v1/portfolios/summary', route => route.fulfill({ status: 200, body: JSON.stringify({ data: { totalReturnRate: 5.5, totalProfitLoss: 500000, currentTotalValue: 10000000 } }) }));
    
    await page.route('**/api/v1/market-index', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [{ name: 'KOSPI', price: 2500, fluctuationRate: 0.8 }] }) }));
    await page.route('**/api/v1/supply-demand', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/stocks/new-listings', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/members/me', route => route.fulfill({ status: 200, body: JSON.stringify({ data: { memberId: 1, nickname: '테스터' } }) }));
  });

  test('should not render the global AppBar on the home screen', async ({ page }) => {
    await page.goto('/');
    // Wait for the home screen to load (nickname greeting should be visible)
    await expect(page.getByText('테스터님')).toBeVisible();

    const appBar = page.locator('header.fixed.top-0');
    await expect(appBar).not.toBeVisible();
  });

  test('should have enough padding-top if needed, or no padding if AppBar is removed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('테스터님')).toBeVisible();

    const main = page.locator('main');
    await expect(main).not.toHaveClass(/pt-14/);
  });
});
