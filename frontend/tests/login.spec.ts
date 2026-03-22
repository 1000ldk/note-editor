import { test, expect } from '@playwright/test';

test('try login', async ({ page }) => {
  await page.goto('/api/auth/signin');
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('button:has-text("開発用ログイン")').click();
  await page.waitForTimeout(3000);
});
