import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ships — returns ships belonging to the authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const ships = await prisma.ship.findMany({
    where: { userId: req.userId },
    orderBy: { scu: 'asc' },
  });
  res.json(ships);
});

// POST /api/ships
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, model, pilot, scu } = req.body as {
    name: string;
    model?: string;
    pilot?: string;
    scu: number;
  };
  if (!name || typeof scu !== 'number' || scu <= 0) {
    res.status(400).json({ error: 'name and scu (positive number) required' });
    return;
  }
  const ship = await prisma.ship.create({
    data: { name, model: model ?? '', pilot: pilot ?? '', scu, userId: req.userId! },
  });
  res.status(201).json(ship);
});

// DELETE /api/ships/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const ship = await prisma.ship.findFirst({ where: { id, userId: req.userId } });
  if (!ship) { res.status(404).json({ error: 'Ship not found' }); return; }
  try {
    await prisma.ship.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      res.status(409).json({ error: 'Ship is assigned to one or more contracts and cannot be deleted' });
      return;
    }
    throw err;
  }
});

export default router;
