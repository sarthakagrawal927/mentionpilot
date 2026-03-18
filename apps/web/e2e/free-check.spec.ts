import { test, expect } from '@playwright/test';

test.describe('Free AI Brand Check', () => {
  test('page loads with input', async ({ page }) => {
    await page.goto('/check');
    await expect(page.getByRole('heading', { name: /Free AI Brand Check/i })).toBeVisible();
    await expect(page.getByPlaceholder(/yourproduct\.com/i)).toBeVisible();
  });

  test('shows no-signup message', async ({ page }) => {
    await page.goto('/check');
    await expect(page.getByText(/No signup required/i)).toBeVisible();
  });
});
