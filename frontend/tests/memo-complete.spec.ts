import { test, expect, type Page } from '@playwright/test';

const password = 'Password123!';

async function registerAndLogin(page: Page, email: string) {
  await page.goto('/register');
  // Placeholder matches frontend/src/app/register/page.tsx line 71
  await page.getByPlaceholder('note-editor user').fill('Memo Test User');
  await page.getByPlaceholder('test@example.com').fill(email);
  await page.getByPlaceholder('********').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}

/**
 * Clicks the "完了する" publish button and returns the message from the resulting alert dialog.
 * The dialog is accepted immediately so the page is not blocked.
 *
 * Note: `.click()` is intentionally not awaited here. The outer Promise resolves only after
 * the 'dialog' event fires (which happens as a direct result of the click), so we never
 * advance past `await new Promise(...)` until the dialog has appeared and been handled.
 * Awaiting the click separately would cause a deadlock: `.click()` in Next.js sometimes
 * waits for navigation to settle, which cannot happen while a dialog is blocking the page.
 */
async function clickPublishAndGetAlertMessage(page: Page): Promise<string> {
  const dialogMessage = await new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
    void page.locator('button:has-text("完了する")').click();
  });
  return dialogMessage;
}

test.describe('Memo Completion Error Handling', () => {

  test('shows error alert when memo completion API returns server error', async ({ page }) => {
    await registerAndLogin(page, `memo-500-${Date.now()}@example.com`);

    // The memo editor page is purely client-side with local state;
    // it does not fetch from the DB by ID, so any numeric ID works.
    await page.goto('/memos/1');

    // Mock /api/user/plan POST to return 500 after page load to avoid
    // interfering with other GET requests the page may issue on mount.
    await page.route('/api/user/plan', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, body: JSON.stringify({ message: 'Internal Server Error' }) });
      } else {
        await route.continue();
      }
    });

    const message = await clickPublishAndGetAlertMessage(page);
    expect(message).toContain('メモの完了に失敗しました');
  });

  test('shows error alert when memo completion API returns service unavailable', async ({ page }) => {
    await registerAndLogin(page, `memo-503-${Date.now()}@example.com`);

    // The memo editor page is purely client-side with local state;
    // it does not fetch from the DB by ID, so any numeric ID works.
    await page.goto('/memos/1');

    // Mock /api/user/plan POST to return 503 after page load to avoid
    // interfering with other GET requests the page may issue on mount.
    await page.route('/api/user/plan', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 503, body: JSON.stringify({ message: 'Service Unavailable' }) });
      } else {
        await route.continue();
      }
    });

    const message = await clickPublishAndGetAlertMessage(page);
    expect(message).toContain('メモの完了に失敗しました');
  });
});
