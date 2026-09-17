export function calculateNewRank(points: number): string {
  if (points >= 100) return 'ゴールド';
  if (points >= 50) return 'シルバー';
  return 'ブロンズ';
}
