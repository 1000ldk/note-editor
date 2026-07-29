import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

/**
 * 最後の砦。ここが無いとルート内の例外がそのままプロセスを落とす。
 * 内部エラーの詳細はクライアントに返さず、ログにのみ出す。
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  // 不正なJSONボディは express.json() がここに流してくる
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'Invalid JSON body' });
    return;
  }

  console.error('[unhandled error]', err);
  res.status(500).json({ message: 'Internal server error' });
}
