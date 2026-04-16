import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Memo Editor Preview Tab', () => {
  test('should render markdown content in the preview tab', async ({ page }) => {
    // Authenticate first
    await registerAndLogin(page, `memo-preview-${Date.now()}@example.com`);

    // Go directly to a new memo editor page
    await page.goto('/memos/new');

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
