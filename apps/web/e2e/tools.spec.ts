import { test, expect } from '@playwright/test';

test.describe('Free Tools Hub', () => {
  test('page loads with tools', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByRole('heading', { name: /Free AI Visibility Tools/i })).toBeVisible();
  });

  test('shows all 4 tools', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByText(/Free AI Brand Check/i)).toBeVisible();
    await expect(page.getByText(/GEO Score Checker/i)).toBeVisible();
    await expect(page.getByText(/AI Crawlability Checker/i)).toBeVisible();
    await expect(page.getByText(/llms.txt Generator/i)).toBeVisible();
  });

  test('has Get Started CTA', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.getByText(/Get Started Free/i)).toBeVisible();
  });
});
