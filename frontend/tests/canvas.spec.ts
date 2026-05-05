import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Canvas Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('user can open canvas page', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.locator('h2', { hasText: '思考キャンバス' })).toBeVisible();
    
    // Check if the canvas loaded safely
    await expect(page.locator('.react-flow')).toBeVisible();
  });
});
