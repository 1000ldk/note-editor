import { test, expect } from '@playwright/test';

const password = 'Password123!';

async function registerAndLogin(page: any, email: string) {
  await page.goto('/register');
  await page.getByPlaceholder('note-editor user').fill('Memo Test User');
  await page.getByPlaceholder('test@example.com').fill(email);
  await page.getByPlaceholder('********').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}

async function clickPublishAndGetAlertMessage(page: any): Promise<string> {
  let capturedMessage = '';
  page.once('dialog', async (dialog: any) => {
    capturedMessage = dialog.message();
    await dialog.accept();
  });
  await page.locator('button:has-text("完了する")').click();
  // Wait briefly for the dialog handler to fire
  await page.waitForTimeout(500);
  return capturedMessage;
}

test.describe('Memo Completion Error Handling', () => {

  test('shows error alert when memo completion API returns server error', async ({ page }) => {
    await registerAndLogin(page, `memo-500-${Date.now()}@example.com`);

    await page.goto('/memos/1');

    // Mock /api/user/plan POST to return 500 - set up after page load
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

    await page.goto('/memos/1');

    // Mock /api/user/plan POST to return 503 - set up after page load
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
