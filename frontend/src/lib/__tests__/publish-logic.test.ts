import { describe, it, expect } from 'vitest';
import { determinePublishEndpoint, buildPublishAlertMessage } from '../publish-logic';

describe('determinePublishEndpoint', () => {
  describe('draftId が空文字のとき（新規作成）', () => {
    it('url が /api/memos になる', () => {
      const { url } = determinePublishEndpoint('');
      expect(url).toBe('/api/memos');
    });

    it('method が POST になる', () => {
      const { method } = determinePublishEndpoint('');
      expect(method).toBe('POST');
    });
  });

  describe('draftId が存在するとき（既存メモの更新）', () => {
    it('url が /api/memos/{id} になる', () => {
      const { url } = determinePublishEndpoint('abc');
      expect(url).toBe('/api/memos/abc');
    });

    it('method が PUT になる', () => {
      const { method } = determinePublishEndpoint('abc');
      expect(method).toBe('PUT');
    });
  });
});

describe('buildPublishAlertMessage', () => {
  it('メモ保存が失敗したとき、公開失敗メッセージを返す', () => {
    const message = buildPublishAlertMessage(false, true);
    expect(message).toBe('メモの公開に失敗しました。');
  });

  it('メモ保存は成功したがポイント取得が失敗したとき、部分的失敗メッセージを返す', () => {
    const message = buildPublishAlertMessage(true, false);
    expect(message).toBe('メモは公開されましたが、ポイントの獲得に失敗しました。');
  });

  it('すべて成功したとき、ポイント獲得成功メッセージを返す', () => {
    const message = buildPublishAlertMessage(true, true);
    expect(message).toBe('メモを公開し、10ポイントを獲得しました！');
  });
});
