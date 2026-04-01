import { test, expect } from '@playwright/test';

test.describe('App Metadata', () => {
  test('should have the correct browser tab title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('stockwellness');
  });
});
