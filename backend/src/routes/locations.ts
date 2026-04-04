import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/locations  — returns all locations grouped by system
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const locations = await prisma.location.findMany({
    orderBy: [{ system: 'asc' }, { planet: 'asc' }, { name: 'asc' }],
  });
  res.json(locations);
});

export default router;
