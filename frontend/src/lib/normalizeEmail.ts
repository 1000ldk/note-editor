/**
 * User.email はDBレベルで @unique かつ完全一致判定なので、
 * 登録時とログイン時で同じ正規化を通さないと大文字小文字違いで別アカウント扱いになる。
 *
 * backend/src/lib/authPolicy.ts の normalizeEmail と必ず同じ挙動にすること。
 * 片方だけ変更すると、Webで登録したユーザーがiOSからログインできなくなる。
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
