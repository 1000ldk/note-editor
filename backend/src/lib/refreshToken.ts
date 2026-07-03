import crypto from 'crypto';
import { prisma } from './prisma';

const REFRESH_EXPIRES_MS =
  Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30') * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
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

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ userId: string; token: string } | null> {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(oldToken) },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  const token = await issueRefreshToken(record.userId);
  return { userId: record.userId, token };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
