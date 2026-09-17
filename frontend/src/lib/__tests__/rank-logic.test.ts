import { describe, it, expect } from 'vitest';
import { calculateNewRank } from '../rank-logic';

describe('calculateNewRank', () => {
  it.each([
    { points: 0,   expected: 'ブロンズ', label: '0点はブロンズ' },
    { points: 49,  expected: 'ブロンズ', label: '49点（シルバー境界直前）はブロンズ' },
    { points: 50,  expected: 'シルバー', label: '50点（シルバー境界）はシルバー' },
    { points: 99,  expected: 'シルバー', label: '99点（ゴールド境界直前）はシルバー' },
    { points: 100, expected: 'ゴールド', label: '100点（ゴールド境界）はゴールド' },
    { points: 150, expected: 'ゴールド', label: '150点はゴールド' },
  ])('$label', ({ points, expected }) => {
    expect(calculateNewRank(points)).toBe(expected);
  });
});
