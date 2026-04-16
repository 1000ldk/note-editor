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

/**
 * Clicks a button identified by its text and returns the message from the resulting alert dialog.
 * The dialog is accepted immediately so the page is not blocked.
 *
 * Note: `.click()` is intentionally not awaited. The outer Promise resolves only after
 * the 'dialog' event fires, so we never advance past `await new Promise(...)` until
 * the dialog has appeared and been handled. Awaiting the click separately would cause
 * a deadlock: `.click()` in Next.js sometimes waits for navigation to settle, which
 * cannot happen while a dialog is blocking the page.
 */
export async function clickButtonAndGetAlertMessage(page: Page, buttonText: string): Promise<string> {
  return new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
    void page.locator(`button:has-text("${buttonText}")`).click();
  });
}
