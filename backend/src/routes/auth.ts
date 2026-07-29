import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { signAccessToken } from '../lib/jwt';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../lib/refreshToken';
import { AUTH_MESSAGES, BCRYPT_COST, isNonEmptyString, normalizeEmail } from '../lib/authPolicy';
import { asyncHandler } from '../middleware/asyncHandler';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: AUTH_MESSAGES.missingRegisterFields });
    }

    const normalizedEmail = normalizeEmail(email);

    // 事前チェックは高速に弾くためだけのもの。競合はP2002で確実に処理する。
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: AUTH_MESSAGES.emailAlreadyRegistered });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    try {
      // plan/points/rank は schema.prisma の @default に任せる
      const user = await prisma.user.create({
        data: { name, email: normalizedEmail, password: hashedPassword },
      });

      return res.status(201).json({
        message: AUTH_MESSAGES.registerSucceeded,
        user: { id: user.id, email: user.email },
      });
    } catch (err) {
      // 同時登録によるユニーク制約違反。事前チェックでは防げない。
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(400).json({ message: AUTH_MESSAGES.emailAlreadyRegistered });
      }
      throw err;
    }
  })
);

router.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: AUTH_MESSAGES.missingCredentials });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user?.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: AUTH_MESSAGES.invalidCredentials });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = await issueRefreshToken(user.id);

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  })
);

router.post(
  '/refresh',
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { refreshToken } = (req.body ?? {}) as Record<string, unknown>;
    if (!isNonEmptyString(refreshToken)) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    return res.json({
      accessToken: signAccessToken(rotated.userId),
      refreshToken: rotated.token,
    });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refreshToken } = (req.body ?? {}) as Record<string, unknown>;
    if (isNonEmptyString(refreshToken)) {
      await revokeRefreshToken(refreshToken);
    }
    return res.status(204).send();
  })
);

export default router;
