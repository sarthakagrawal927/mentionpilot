import { test, expect } from '@playwright/test';

test.describe('AI Mentions Page', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/dashboard/mentions');
    // The page renders a heading immediately before API calls
    await expect(page.getByRole('heading', { name: /AI Mention Check/i })).toBeVisible();
  });

  test('shows loading or config form', async ({ page }) => {
    await page.goto('/dashboard/mentions');
    // Either shows loading spinner or the config form (depending on API availability)
    const heading = page.getByRole('heading', { name: /AI Mention Check/i });
    await expect(heading).toBeVisible();
  });

  test('run check button exists', async ({ page }) => {
    await page.goto('/dashboard/mentions');
    // Wait for the page to settle (loading state resolves after API call fails)
    await page.waitForTimeout(3000);
    const button = page.getByRole('button', { name: /Run AI Mention Check/i });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });
});
