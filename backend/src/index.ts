import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import authRouter from './routes/auth';
import meRouter from './routes/me';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { deleteExpiredRefreshTokens } from './lib/refreshToken';

/**
 * ALLOWED_ORIGIN の扱い:
 *   - 未設定           → 起動失敗（fail closed）。デフォルトで全開放しない。
 *   - "*"              → 全オリジン許可（明示した場合のみ）
 *   - "a.com,b.com"    → 列挙したオリジンのみ許可
 *
 * cors の配列分岐はOriginヘッダーと完全一致比較なので、"*" を配列に入れると
 * 逆にすべて拒否される。ワイルドカードは文字列のまま渡す必要がある。
 */
function resolveCorsOptions(): CorsOptions {
  const raw = process.env.ALLOWED_ORIGIN;

  if (raw === undefined || raw.trim() === '') {
    throw new Error(
      'ALLOWED_ORIGIN is not set. Set it to "*" to allow any origin, or to a comma-separated list of origins.'
    );
  }

  if (raw.trim() === '*') {
    return { origin: '*' };
  }

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error('ALLOWED_ORIGIN contains no usable origin.');
  }

  return { origin: origins };
}

const app = express();

app.set('trust proxy', 1);
app.use(cors(resolveCorsOptions()));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

// RefreshToken はソフト失効しかしないため、放置すると際限なく増える。
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
function runRefreshTokenCleanup(): void {
  deleteExpiredRefreshTokens()
    .then((count) => {
      if (count > 0) {
        console.log(`[cleanup] deleted ${count} expired refresh tokens`);
      }
    })
    .catch((err) => console.error('[cleanup] refresh token cleanup failed', err));
}
runRefreshTokenCleanup();
setInterval(runRefreshTokenCleanup, CLEANUP_INTERVAL_MS).unref();

// ルート外で発生した例外でプロセスが黙って落ちないようにログを残す。
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});
