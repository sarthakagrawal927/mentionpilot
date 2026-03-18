import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('dashboard home loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('sidebar links exist', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');
    // Check links exist in the DOM (sidebar may use CSS hiding)
    await expect(page.getByRole('link', { name: /AI Mentions/i })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Analytics/i })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /GEO Tools/i })).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Settings/i })).toHaveCount(1);
  });
});
