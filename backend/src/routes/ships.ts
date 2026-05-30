import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ships
router.get('/', async (_req: Request, res: Response) => {
  const ships = await prisma.ship.findMany({ orderBy: { scu: 'asc' } });
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
  if (!name || scu == null) {
    res.status(400).json({ error: 'name and scu required' });
    return;
  }
  const ship = await prisma.ship.create({
    data: { name, model: model ?? '', pilot: pilot ?? '', scu },
  });
  res.status(201).json(ship);
});

// DELETE /api/ships/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const ship = await prisma.ship.findFirst({ where: { id } });
  if (!ship) { res.status(404).json({ error: 'Ship not found' }); return; }
  await prisma.ship.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
