import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { AUTH_MESSAGES, normalizeEmail } from '../lib/authPolicy';

const WINDOW_MS = 15 * 60 * 1000;

/**
 * IP + 対象アカウント単位でログイン試行を絞る。
 * bcryptのコストだけでは分散したパスワード総当たりを止められないため。
 */
export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    const account = typeof email === 'string' ? normalizeEmail(email) : '';
    // ipKeyGenerator がIPv6を /56 単位に正規化してくれる
    return `${ipKeyGenerator(req.ip ?? '')}:${account}`;
  },
  message: { message: AUTH_MESSAGES.tooManyAttempts },
});

/** 登録・リフレッシュはIP単位で十分。 */
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: AUTH_MESSAGES.tooManyAttempts },
});
