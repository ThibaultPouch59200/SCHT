import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/resources
router.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  const resources = await prisma.resource.findMany({ orderBy: { name: 'asc' } });
  res.json(resources);
});

export default router;
