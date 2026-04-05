import { test, expect, type Page } from '@playwright/test';

const password = 'Password123!';

async function registerAndLogin(page: Page, email: string) {
  await page.goto('/register');
  await page.getByPlaceholder('note-editor user').fill('Memo Test User');
  await page.getByPlaceholder('test@example.com').fill(email);
  await page.getByPlaceholder('********').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
}

test.describe('Memo Editor Preview Tab', () => {
  test('should render markdown content in the preview tab', async ({ page }) => {
    // Authenticate first
    await registerAndLogin(page, `memo-preview-${Date.now()}@example.com`);

    // Go directly to a new memo editor page
    await page.goto('/memos/1');

    // Make sure we are in edit mode initially
    await expect(page.locator('button:has-text("編集")')).toBeVisible();

    // Type some markdown content
    await page.locator('textarea[placeholder="ここに入力..."]').fill('Hello **World**\n\n# Heading 1\n');

    // Click the "Preview" tab
    await page.locator('button[data-testid="preview-tab"]').click();

    // Check if the preview content container is visible
    const previewContent = page.locator('[data-testid="preview-content"]');
    await expect(previewContent).toBeVisible();

    // Verify markdown was rendered to HTML
    await expect(previewContent.locator('strong')).toHaveText('World');
    await expect(previewContent.locator('h1')).toHaveText('Heading 1');
  });
});
