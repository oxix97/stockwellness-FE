import { test, expect } from './fixtures/mock-only-test';

test.describe('App Metadata', () => {
  test('should have the correct browser tab title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle('stockwellness');
  });
});
