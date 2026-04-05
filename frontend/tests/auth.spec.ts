import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const password = 'Password123!';

  test('User can register and login successfully', async ({ page }) => {
    // 1. Visit Home and go to Register Page
    await page.goto('/');
    await page.locator('a[href="/register"]').click();

    await expect(page).toHaveURL('/register');
    
    // 2. Fill registration form
    await page.getByPlaceholder('note-editor user').fill('E2E Test User');
    await page.getByPlaceholder('test@example.com').fill(uniqueEmail);
    await page.getByPlaceholder('********').fill(password);
    
    await page.locator('button[type="submit"]').click();

    // 3. Should redirect to Home as a logged in user
    await expect(page).toHaveURL('/');

    // 4. Logout
    await page.locator('#logout-btn').click();

    // Wait until logged out
    await expect(page).toHaveURL('/');

    // 5. Test Login flow
    await page.locator('a[href="/login"]').click();
    await expect(page).toHaveURL('/login');

    await page.getByPlaceholder('test@example.com').fill(uniqueEmail);
    await page.getByPlaceholder('********').fill(password);
    await page.locator('button[type="submit"]').click();

    // 6. Verify successful login
    await expect(page).toHaveURL('/');
  });
});