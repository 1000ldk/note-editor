import { type Page, expect } from '@playwright/test';

export const TEST_PASSWORD = 'Password123!';

export async function registerAndLogin(page: Page, email: string, name = 'Memo Test User') {
  await page.goto('/register');
  await page.getByPlaceholder('note-editor user').fill(name);
  await page.getByPlaceholder('test@example.com').fill(email);
  await page.getByPlaceholder('********').fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}
