import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('shows MentionPilot title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /MentionPilot/i })).toBeVisible();
  });

  test('shows tagline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/AI Visibility Monitoring/i)).toBeVisible();
  });

  test('has Get Started button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Get Started/i)).toBeVisible();
  });
});
