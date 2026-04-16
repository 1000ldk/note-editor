import { test, expect, type Page } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

/**
 * Clicks the save button and returns the message from the resulting alert dialog.
 */
async function clickSaveAndGetAlertMessage(page: Page): Promise<string> {
  const dialogMessage = await new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
    void page.locator('button:has-text("保存")').click();
  });
  return dialogMessage;
}

test.describe('Memo CRUD Flow', () => {
  test('can create a new memo, save it, see it in the list, and reopen it', async ({ page }) => {
    const email = `memo-crud-${Date.now()}@example.com`;
    await registerAndLogin(page, email);

    // Navigate to new memo page
    await page.goto('/memos/new');
    await expect(page.locator('textarea[placeholder="タイトルを入力..."]')).toBeVisible();

    // Fill in title and content
    const testTitle = `E2E Test Memo ${Date.now()}`;
    const testContent = 'This is **E2E** test content.';
    await page.locator('textarea[placeholder="タイトルを入力..."]').fill(testTitle);
    await page.locator('textarea[placeholder="ここに入力..."]').fill(testContent);

    // Save the memo
    const saveMsg = await clickSaveAndGetAlertMessage(page);
    expect(saveMsg).toContain('保存しました');

    // After saving, the URL should change to the actual memo ID
    await expect(page).toHaveURL(/\/memos\/[^/]+$/);
    const savedUrl = page.url();
    const memoId = savedUrl.split('/memos/')[1];
    expect(memoId).not.toBe('new');

    // Navigate to the memos list
    await page.goto('/memos');

    // The saved memo should appear in the list
    await expect(page.locator(`a[href="/memos/${memoId}"]`)).toBeVisible();
    await expect(page.locator(`a[href="/memos/${memoId}"]`)).toContainText(testTitle);

    // Reopen the memo from the list
    await page.locator(`a[href="/memos/${memoId}"]`).click();
    await expect(page).toHaveURL(`/memos/${memoId}`);

    // Verify the content is restored correctly
    await expect(page.locator('textarea[placeholder="タイトルを入力..."]')).toHaveValue(testTitle);
    await expect(page.locator('textarea[placeholder="ここに入力..."]')).toHaveValue(testContent);
  });

  test('shows an error alert when saving fails due to auth loss', async ({ page }) => {
    await registerAndLogin(page, `memo-save-err-${Date.now()}@example.com`);
    await page.goto('/memos/new');

    await page.locator('textarea[placeholder="タイトルを入力..."]').fill('Error Test Memo');
    await page.locator('textarea[placeholder="ここに入力..."]').fill('Some content');

    // Mock the API to fail
    await page.route('/api/memos', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
      } else {
        await route.continue();
      }
    });

    const errMsg = await new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        resolve(dialog.message());
        await dialog.accept();
      });
      void page.locator('button:has-text("保存")').click();
    });

    expect(errMsg).toContain('保存に失敗しました');
  });
});
