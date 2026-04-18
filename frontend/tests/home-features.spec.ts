import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Home page feature buttons after login', () => {
  test('メモを書く button navigates to memos list', async ({ page }) => {
    await registerAndLogin(page, `home-memos-${Date.now()}@example.com`);

    // Click the "メモを書く" feature card
    await page.locator('a[href="/memos"]').first().click();
    await expect(page).toHaveURL('/memos');

    // Memos list page renders without error
    await expect(page.locator('h1', { hasText: 'Memos' })).toBeVisible();
    await expect(page.locator('a[href="/memos/new"]')).toBeVisible();
  });

  test('悩みを記録 button navigates to topics page', async ({ page }) => {
    await registerAndLogin(page, `home-topics-${Date.now()}@example.com`);

    // Click the "悩みを記録" feature card
    await page.locator('a[href="/topics"]').first().click();
    await expect(page).toHaveURL('/topics');

    // Topics page renders without error
    await expect(page.locator('h2', { hasText: '悩みをメモする' })).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: '保存する' })).toBeVisible();
  });

  test('キャンバス button navigates to canvas page', async ({ page }) => {
    await registerAndLogin(page, `home-canvas-${Date.now()}@example.com`);

    // Click the "キャンバス" feature card
    await page.locator('a[href="/canvas"]').first().click();
    await expect(page).toHaveURL('/canvas');

    // Canvas page renders without error
    await expect(page.locator('h2', { hasText: '思考キャンバス' })).toBeVisible();
  });

  test('Sidebar New Memo button navigates to new memo editor', async ({ page }) => {
    await registerAndLogin(page, `sidebar-new-memo-${Date.now()}@example.com`);

    // Click the sidebar "New Memo" button
    await page.locator('button', { hasText: 'New Memo' }).click();
    await expect(page).toHaveURL('/memos/new');

    // New memo editor renders without an error alert
    await expect(page.locator('textarea[placeholder="タイトルを入力..."]')).toBeVisible();
  });
});
