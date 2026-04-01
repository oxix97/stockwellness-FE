import { test, expect } from '@playwright/test';

test.describe('Home Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the auth state in localStorage to bypass ProtectedRoute
    await page.goto('/login'); // Go to a page first to set localStorage
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'mock_access_token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          memberId: 1,
          email: 'test@example.com',
          nickname: '테스터',
          portfolioId: 1,
          accessToken: 'mock_access_token'
        },
        version: 0
      }));
    });
    
    // Mock API calls that Home screen makes
    await page.route('**/api/v1/portfolios/summary', route => route.fulfill({ status: 200, body: JSON.stringify({ data: {} }) }));
    await page.route('**/api/v1/sectors', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/market-index', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/supply-demand', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/stocks/new-listings', route => route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) }));
    await page.route('**/api/v1/members/me', route => route.fulfill({ status: 200, body: JSON.stringify({ data: { memberId: 1, nickname: '테스터' } }) }));
  });

  test('should not render the global AppBar on the home screen', async ({ page }) => {
    await page.goto('/');
    // The AppBar has an aria-label '검색' on its Link and '알림' on its button.
    // We expect it to be hidden or removed.
    const appBar = page.locator('header.fixed.top-0');
    await expect(appBar).not.toBeVisible();
  });

  test('should have enough padding-top if needed, or no padding if AppBar is removed', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    // If AppBar is removed, pt-14 might also need to be removed or adjusted.
    // This is more of a visual check.
    await expect(main).not.toHaveClass(/pt-14/);
  });
});
