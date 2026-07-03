import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken } from '../lib/jwt';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../lib/refreshToken';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'すべての必須項目を入力してください' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: 'このメールアドレスは既に登録されています' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, plan: 'FREE', points: 0, rank: 'ブロンズ' },
  });

  return res.status(201).json({
    message: '登録が完了しました',
    user: { id: user.id, email: user.email },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'メールアドレスとパスワードを入力してください' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'メールアドレスまたはパスワードが違います' });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id);

  return res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
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
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return res.status(204).send();
});

export default router;
