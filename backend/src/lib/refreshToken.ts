import crypto from 'crypto';
import { prisma } from './prisma';

const REFRESH_EXPIRES_MS =
  Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30') * 24 * 60 * 60 * 1000;

/**
 * 呼び出し元が文字列であることを保証していない場合でも
 * crypto.createHash().update() が同期TypeErrorを投げないようにする。
 */
function hashToken(token: string): string {
  if (typeof token !== 'string') {
    throw new TypeError('refresh token must be a string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
    },
  });
  return token;
}

/**
 * 提示されたrefresh tokenを失効させ、新しいトークンを発行する。
 *
 * 検証と失効を単一の条件付きUPDATE（revokedAt: null のときだけ更新）で行うため、
 * 同じトークンを同時に2回提示しても更新に成功するのは片方だけになる。
 * 既に失効済みのトークンが提示された = 再利用検知として、そのユーザーの
 * 有効なrefresh tokenをすべて失効させる（トークン盗難時のカスケード失効）。
 */
export async function rotateRefreshToken(
  oldToken: unknown
): Promise<{ userId: string; token: string } | null> {
  if (typeof oldToken !== 'string' || oldToken.length === 0) {
    return null;
  }

  const tokenHash = hashToken(oldToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record) {
    return null;
  }

  // 失効済みトークンの再提示 = 漏洩の疑い。同一ユーザーの全トークンを失効させる。
  if (record.revokedAt) {
    await revokeAllRefreshTokensForUser(record.userId);
    return null;
  }

  if (record.expiresAt < new Date()) {
    return null;
  }

  const { count } = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  // 並行リクエストに先を越された場合。新しいトークンは発行しない。
  if (count !== 1) {
    return null;
  }

  const token = await issueRefreshToken(record.userId);
  return { userId: record.userId, token };
}

export async function revokeRefreshToken(token: unknown): Promise<void> {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * 期限切れ・失効済みの行を削除する。
 * ソフト失効しかしないとRefreshTokenテーブルが無限に増え続けるため、
 * index.ts から定期的に呼び出す。
 */
export async function deleteExpiredRefreshTokens(): Promise<number> {
  const now = new Date();
  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        // 失効済みの行は再利用検知に一定期間だけ必要なので、猶予後に削除する。
        { revokedAt: { lt: new Date(now.getTime() - REFRESH_EXPIRES_MS) } },
      ],
    },
  });
  return count;
}
