import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Topic Category Badge Contrast', () => {
  test('badge text is dark on light background color', async ({ page }) => {
    const email = `topic-light-${Date.now()}@example.com`;
    await registerAndLogin(page, email);

    // Navigate to topics page
    await page.goto('/topics');

    // Fill in topic title
    await page.locator('textarea').fill('Light Color Topic');

    // Set category name
    await page.locator('input[type="text"]').fill('明るいカテゴリ');

    // Set color to white (#ffffff - high luminance) via React-compatible value setter
    await page.locator('input[type="color"]').evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '#ffffff');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Save the topic
    await page.locator('button[type="submit"]').click();
    await page.waitForResponse('/api/topics');

    // Navigate to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Find the category badge for our topic
    const badge = page.locator('.react-flow__node span', { hasText: '明るいカテゴリ' }).first();
    await expect(badge).toBeVisible();

    // White background (#ffffff) → luminance=255 > 160 → text should be dark #111 = rgb(17,17,17)
    await expect(badge).toHaveCSS('color', 'rgb(17, 17, 17)');
  });

  test('badge text is white on dark background color', async ({ page }) => {
    const email = `topic-dark-${Date.now()}@example.com`;
    await registerAndLogin(page, email);

    // Navigate to topics page
    await page.goto('/topics');

    // Fill in topic title
    await page.locator('textarea').fill('Dark Color Topic');

    // Set category name
    await page.locator('input[type="text"]').fill('暗いカテゴリ');

    // Set color to dark navy (#1a237e - low luminance) via React-compatible value setter
    await page.locator('input[type="color"]').evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '#1a237e');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Save the topic
    await page.locator('button[type="submit"]').click();
    await page.waitForResponse('/api/topics');

    // Navigate to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Find the category badge for our topic
    const badge = page.locator('.react-flow__node span', { hasText: '暗いカテゴリ' }).first();
    await expect(badge).toBeVisible();

    // Dark navy (#1a237e) → luminance≈43 ≤ 160 → text should be white #fff = rgb(255,255,255)
    await expect(badge).toHaveCSS('color', 'rgb(255, 255, 255)');
  });
});
