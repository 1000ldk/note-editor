import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 は async ハンドラが reject しても捕捉しないため、
 * unhandled rejection になりプロセスごと落ちる（Node 15以降のデフォルト）。
 * すべての async ルートはこれで包んで next(err) に流すこと。
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
