import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/finance  — wallet balance + all transactions
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { id: 'desc' },
  });
  res.json({ wallet: user?.wallet ?? 0, transactions });
});

// PUT /api/finance/wallet  — set wallet balance
router.put('/wallet', authenticate, async (req: AuthRequest, res: Response) => {
  const { amount } = req.body as { amount: number };
  if (amount == null || typeof amount !== 'number') {
    res.status(400).json({ error: 'amount required' });
    return;
  }
  await prisma.user.update({ where: { id: req.userId }, data: { wallet: amount } });
  await prisma.transaction.create({
    data: {
      userId: req.userId!,
      date: today(),
      desc: 'Mise à jour manuelle du wallet',
      amount,
      type: 'wallet',
    },
  });
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { id: 'desc' },
  });
  res.json({ wallet: amount, transactions });
});

// POST /api/finance/transactions  — record mission earning
router.post('/transactions', authenticate, async (req: AuthRequest, res: Response) => {
  const { amount, desc, type, missionId } = req.body as {
    amount: number;
    desc: string;
    type: string;
    missionId?: number;
  };
  if (!amount || !desc || !type) {
    res.status(400).json({ error: 'amount, desc, type required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const newWallet = (user?.wallet ?? 0) + amount;
  await prisma.user.update({ where: { id: req.userId }, data: { wallet: newWallet } });
  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      date: today(),
      desc,
      amount,
      type,
      ...(missionId ? { missionId } : {}),
    },
  });
  res.status(201).json(tx);
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const tx = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
  if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return; }
  await prisma.transaction.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
