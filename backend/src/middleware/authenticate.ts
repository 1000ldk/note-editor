import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
