import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/ships — returns all ships (no auth required)
router.get('/', async (_req: Request, res: Response) => {
  const ships = await prisma.ship.findMany({
    orderBy: [{ category: 'asc' }, { scu: 'asc' }],
  });
  res.json(ships);
});

export default router;
