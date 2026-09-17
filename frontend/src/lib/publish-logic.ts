export function determinePublishEndpoint(draftId: string): { url: string; method: string } {
  const isCreating = !draftId;
  return {
    url: isCreating ? '/api/memos' : `/api/memos/${draftId}`,
    method: isCreating ? 'POST' : 'PUT',
  };
}

export function buildPublishAlertMessage(memoOk: boolean, planOk: boolean): string {
  if (!memoOk) return 'メモの公開に失敗しました。';
  if (!planOk) return 'メモは公開されましたが、ポイントの獲得に失敗しました。';
  return 'メモを公開し、10ポイントを獲得しました！';
}
