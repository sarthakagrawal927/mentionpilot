import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByText(/Get Started/i).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('sidebar links work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/dashboard');

    await page.getByRole('link', { name: /AI Mentions/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/mentions/);

    await page.getByRole('link', { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/analytics/);

    await page.getByRole('link', { name: /GEO Tools/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/geo/);

    await page.getByRole('link', { name: /Social Monitor/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/social/);

    await page.getByRole('link', { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
  });
});
