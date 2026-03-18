import { test, expect } from '@playwright/test';

test.describe('GEO Tools Page', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/dashboard/geo');
    // The page should have at least one heading visible
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
