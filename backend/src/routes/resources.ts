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

// POST /api/resources
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name } = req.body as { name?: string };
  const safeName = name?.trim();

  if (!safeName) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const resource = await prisma.resource.upsert({
    where: { name: safeName },
    update: {},
    create: { name: safeName },
  });

  res.status(201).json(resource);
});

// DELETE /api/resources/:name
router.delete('/:name', authenticate, async (req: AuthRequest, res: Response) => {
  const name = decodeURIComponent(String(req.params['name'] ?? '')).trim();

  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  try {
    await prisma.resource.delete({ where: { name } });
    res.json({ ok: true });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = String((error as { code?: string }).code ?? '');
      if (code === 'P2025') {
        res.status(404).json({ error: 'Resource not found' });
        return;
      }
      if (code === 'P2003') {
        res.status(409).json({ error: 'Resource is used by existing missions and cannot be deleted' });
        return;
      }
    }
    throw error;
  }
});

export default router;
