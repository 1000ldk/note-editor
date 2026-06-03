import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/auth';

test.describe('Canvas Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Generate a unique email every test
    const timestamp = Date.now();
    await registerAndLogin(page, `canvas-${timestamp}@example.com`, `Canvas Test User ${timestamp}`);
  });

  test('user can open canvas page', async ({ page }) => {
    await page.goto('/canvas');
    await expect(page.locator('h2', { hasText: '思考キャンバス' })).toBeVisible();

    // Check if the canvas loaded safely
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('node folding and descendant visibility state', async ({ page }) => {
    // API経由で、親・子・孫ノードを作成
    const parentRes = await page.request.post('/api/topics', {
      data: { title: 'Node Parent', positionX: 100, positionY: 100 }
    });
    const parentTopic = await parentRes.json();

    const childRes = await page.request.post('/api/topics', {
      data: { title: 'Node Child', parentId: parentTopic.id, positionX: 100, positionY: 300 }
    });
    const childTopic = await childRes.json();

    const grandChildRes = await page.request.post('/api/topics', {
      data: { title: 'Node Grandchild', parentId: childTopic.id, positionX: 100, positionY: 500 }
    });
    const grandchildTopic = await grandChildRes.json();

    // キャンバス画面を開く
    await page.goto('/canvas');
    // DOMに追加されるのを待つ
    const parentLocator = page.locator('.react-flow__node', { hasText: /^Node Parent$/ });
    const childLocator = page.locator('.react-flow__node', { hasText: /^Node Child$/ });
    const grandchildLocator = page.locator('.react-flow__node', { hasText: /^Node Grandchild$/ });

    await expect(parentLocator).toBeVisible();
    await expect(childLocator).toBeVisible();
    await expect(grandchildLocator).toBeVisible();

    // -- (1) 親ノードの折りたたみ -> 子孫が非表示になること --
    const parentHideBtn = parentLocator.getByRole('button', { name: '子ノードを隠す' });
    await parentHideBtn.click();
    
    await expect(childLocator).toBeHidden();
    await expect(grandchildLocator).toBeHidden();

    // 親を再度展開して元に戻す
    const parentShowBtn = parentLocator.getByRole('button', { name: '子ノードを表示する' });
    await parentShowBtn.click();

    await expect(childLocator).toBeVisible();
    await expect(grandchildLocator).toBeVisible();

    // -- (2) 子ノードを個別に閉じた状態で親を閉じる -> 再展開時、孫は非表示のままか確認 --
    // まず子ノードを閉じる
    const childHideBtn = childLocator.getByRole('button', { name: '子ノードを隠す' });
    await childHideBtn.click();

    await expect(childLocator).toBeVisible();
    await expect(grandchildLocator).toBeHidden();

    // 次に親を閉じる
    await parentHideBtn.click();

    await expect(childLocator).toBeHidden();
    await expect(grandchildLocator).toBeHidden();

    // 親を再度展開
    await parentShowBtn.click();

    // 子は表示されるが、孫は折りたたまれたまま(非表示)であること
    await expect(childLocator).toBeVisible();
    await expect(grandchildLocator).toBeHidden();
  });
});
