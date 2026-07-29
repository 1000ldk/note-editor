import crypto from 'crypto';
import { prisma } from './prisma';

const REFRESH_EXPIRES_MS =
  Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30') * 24 * 60 * 60 * 1000;

/**
 * 失効直後の再提示を「盗難」ではなく「クライアントのリトライ」とみなす猶予時間。
 *
 * モバイル回線ではローテーションに成功したあとレスポンスが届かず、
 * 同じトークンで再送されることが普通に起きる。これを一律に再利用検知と
 * 扱うと、正規ユーザーが全デバイスから強制ログアウトされてしまう。
 */
const REUSE_GRACE_MS = Number(process.env.REFRESH_REUSE_GRACE_SECONDS ?? '30') * 1000;

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

export async function issueRefreshToken(userId: string, predecessorId?: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const created = await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
    },
  });

  // 後継を辿れるようにしておく（猶予時間内の再送で使う）
  if (predecessorId) {
    await prisma.refreshToken.update({
      where: { id: predecessorId },
      data: { replacedById: created.id },
    });
  }

  return token;
}

/**
 * 指定トークンの後継チェーンを辿り、有効なものをすべて失効させる。
 * 猶予時間内の再発行時に、チェーン上で有効なトークンが2本以上にならないようにする。
 */
async function revokeSuccessors(startId: string | null, at: Date): Promise<void> {
  let nextId = startId;
  // 循環や異常なチェーン長で無限ループしないよう上限を設ける
  for (let hops = 0; nextId && hops < 16; hops++) {
    const successor = await prisma.refreshToken.findUnique({ where: { id: nextId } });
    if (!successor) {
      return;
    }
    if (!successor.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { id: successor.id, revokedAt: null },
        data: { revokedAt: at },
      });
    }
    nextId = successor.replacedById;
  }
}

/**
 * 提示されたrefresh tokenを失効させ、新しいトークンを発行する。
 *
 * 検証と失効を単一の条件付きUPDATE（revokedAt: null のときだけ更新）で行うため、
 * 同じトークンを同時に2回提示しても更新に成功するのは片方だけになる。
 *
 * 失効済みトークンが提示された場合の扱いは、失効からの経過時間で分かれる:
 *   - REUSE_GRACE_MS 以内 … レスポンスを取りこぼしたクライアントのリトライとみなし、
 *     カスケードせずに新しいトークンを発行し直す
 *   - それを超える     … 漏洩トークンの再利用とみなし、
 *     そのユーザーの有効なrefresh tokenをすべて失効させる
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

  const now = new Date();

  if (record.expiresAt < now) {
    return null;
  }

  if (record.revokedAt) {
    // 猶予時間を超えた再提示 = 漏洩の疑い。同一ユーザーの全トークンを失効させる。
    if (now.getTime() - record.revokedAt.getTime() > REUSE_GRACE_MS) {
      await revokeAllRefreshTokensForUser(record.userId);
      return null;
    }

    // 猶予時間内。ローテーションには成功したがレスポンスが届かなかった
    // クライアントの再送とみなし、セッションを維持したまま再発行する。
    // ただし先に後継を失効させ、有効なトークンが2本残らないようにする。
    console.warn(`[refresh] reuse within grace window for user ${record.userId}`);
    await revokeSuccessors(record.replacedById, now);
    return {
      userId: record.userId,
      token: await issueRefreshToken(record.userId, record.id),
    };
  }

  const { count } = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: now },
  });

  // 並行リクエストに先を越された場合。新しいトークンは発行しない。
  if (count !== 1) {
    return null;
  }

  const token = await issueRefreshToken(record.userId, record.id);
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
