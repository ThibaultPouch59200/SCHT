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

// POST /api/locations
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, planet, system } = req.body as {
    name?: string;
    planet?: string;
    system?: string;
  };

  const safeName = name?.trim();
  const safePlanet = planet?.trim();
  const safeSystem = system?.trim();

  if (!safeName || !safePlanet || !safeSystem) {
    res.status(400).json({ error: 'name, planet and system are required' });
    return;
  }

  const location = await prisma.location.upsert({
    where: { name_system: { name: safeName, system: safeSystem } },
    update: { planet: safePlanet },
    create: {
      name: safeName,
      planet: safePlanet,
      system: safeSystem,
    },
  });

  res.status(201).json(location);
});

// DELETE /api/locations?name=...&system=...
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  const rawName = req.query['name'];
  const rawSystem = req.query['system'];
  const name = (typeof rawName === 'string' ? rawName : '').trim();
  const system = (typeof rawSystem === 'string' ? rawSystem : '').trim();

  if (!name || !system) {
    res.status(400).json({ error: 'name and system query params are required' });
    return;
  }

  try {
    await prisma.location.delete({
      where: { name_system: { name, system } },
    });
    res.json({ ok: true });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = String((error as { code?: string }).code ?? '');
      if (code === 'P2025') {
        res.status(404).json({ error: 'Location not found' });
        return;
      }
      if (code === 'P2003') {
        res.status(409).json({ error: 'Location is used by existing missions and cannot be deleted' });
        return;
      }
    }
    throw error;
  }
});

export default router;
