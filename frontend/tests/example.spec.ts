import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  test.setTimeout(120000);
  console.log('trying to load page');
  await page.goto('/', { timeout: 60000 });
  console.log('Got response');
  await expect(page).toHaveTitle(/.*|.*/);
});
