// 認証まわりのポリシーと文言を1か所に集約する。
// frontend/src/app/api/auth/register/route.ts と同じ挙動である必要があるため、
// どちらかを変更する場合は必ず両方を更新すること。

/** bcryptのコストファクター。frontendのregisterと必ず揃えること。 */
export const BCRYPT_COST = 10;

export const AUTH_MESSAGES = {
  missingRegisterFields: 'すべての必須項目を入力してください',
  emailAlreadyRegistered: 'このメールアドレスは既に登録されています',
  registerSucceeded: '登録が完了しました',
  missingCredentials: 'メールアドレスとパスワードを入力してください',
  invalidCredentials: 'メールアドレスまたはパスワードが違います',
  tooManyAttempts: '試行回数が多すぎます。しばらくしてからもう一度お試しください',
} as const;

/**
 * User.email はDBレベルで @unique かつ完全一致判定なので、
 * 登録時とログイン時で同じ正規化を通さないと大文字小文字違いで別アカウント扱いになる。
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
