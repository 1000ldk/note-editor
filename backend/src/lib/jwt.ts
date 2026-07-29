import jwt from 'jsonwebtoken';

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET is not set');
}

const ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m';

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId }, ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}
