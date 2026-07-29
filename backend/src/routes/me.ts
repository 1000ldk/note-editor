import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: (req as AuthRequest).userId },
      select: { id: true, email: true, name: true, plan: true, points: true, rank: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  })
);

export default router;
