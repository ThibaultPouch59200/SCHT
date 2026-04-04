import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Helper: resolve or create a location by name+system
async function resolveLocation(name: string, planet: string, system: string) {
  return prisma.location.upsert({
    where: { name_system: { name, system } },
    update: { planet },
    create: { name, planet, system },
  });
}

// Helper: resolve or create a resource by name
async function resolveResource(name: string) {
  return prisma.resource.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

// Serialize a mission for the frontend (matches the old Mission type)
function serializeMission(m: any) {
  return {
    id: m.id,
    origin: m.origin.name,
    system: m.system,
    pay: m.pay,
    createdAt: m.createdAt.toISOString(),
    completedAt: m.completedAt?.toISOString() ?? null,
    cargos: m.cargos.map((c: any) => ({
      id: c.id,
      res: c.resource.name,
      scu: c.scu,
      dest: c.dest.name,
      planet: c.dest.planet,
      delivered: c.delivered?.amount ?? 0,
      confirmed: c.delivered?.confirmed ?? false,
    })),
  };
}

const MISSION_INCLUDE = {
  origin: true,
  cargos: {
    include: {
      resource: true,
      dest: true,
      delivered: true,
    },
  },
};

// GET /api/missions
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const missions = await prisma.mission.findMany({
    where: { userId: req.userId },
    include: MISSION_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(missions.map(serializeMission));
});

// POST /api/missions
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { origin, system, pay, cargos } = req.body as {
    origin: string;
    system: string;
    pay: number;
    cargos: { res: string; scu: number; dest: string; planet: string }[];
  };
  if (!origin || !system || pay == null || !Array.isArray(cargos)) {
    res.status(400).json({ error: 'origin, system, pay, cargos required' });
    return;
  }

  // Resolve origin — planet defaults to system name if unknown
  const originLoc = await resolveLocation(origin, system, system);

  const mission = await prisma.mission.create({
    data: {
      userId: req.userId!,
      originId: originLoc.id,
      system,
      pay,
      cargos: {
        create: await Promise.all(
          cargos.map(async (c) => {
            const destLoc = await resolveLocation(c.dest, c.planet, system);
            const resource = await resolveResource(c.res);
            return {
              resourceId: resource.id,
              scu: c.scu,
              destId: destLoc.id,
              delivered: { create: { amount: 0, confirmed: false } },
            };
          })
        ),
      },
    },
    include: MISSION_INCLUDE,
  });
  res.status(201).json(serializeMission(mission));
});

// DELETE /api/missions/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const mission = await prisma.mission.findFirst({ where: { id, userId: req.userId } });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
  await prisma.mission.delete({ where: { id } });
  res.json({ ok: true });
});

// PATCH /api/missions/:id/cargo/:cargoId/delivered  — update delivered amount
router.patch('/:id/cargo/:cargoId/delivered', authenticate, async (req: AuthRequest, res: Response) => {
  const missionId = parseInt(req.params.id);
  const cargoId = parseInt(req.params.cargoId);
  const { amount } = req.body as { amount: number };

  const mission = await prisma.mission.findFirst({ where: { id: missionId, userId: req.userId } });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }

  await prisma.deliveredAmount.upsert({
    where: { cargoLineId: cargoId },
    update: { amount },
    create: { cargoLineId: cargoId, amount },
  });

  // Check if all cargo lines are fully delivered
  const allCargos = await prisma.cargoLine.findMany({
    where: { missionId },
    include: { delivered: true },
  });
  const allDone = allCargos.every((c) => (c.delivered?.amount ?? 0) >= c.scu);

  if (allDone && !mission.completedAt) {
    await prisma.mission.update({ where: { id: missionId }, data: { completedAt: new Date() } });
  }

  const updated = await prisma.mission.findFirst({ where: { id: missionId }, include: MISSION_INCLUDE });
  res.json(serializeMission(updated));
});

// POST /api/missions/:id/stations/:stationName/confirm  — confirm full station delivery
router.post('/:id/stations/:stationName/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  const missionId = parseInt(req.params.id);
  const stationName = decodeURIComponent(req.params.stationName);

  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId: req.userId },
    include: MISSION_INCLUDE,
  });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }

  // Find all cargo lines going to this station
  const targetCargos = (mission as any).cargos.filter((c: any) => c.dest.name === stationName);

  for (const c of targetCargos) {
    await prisma.deliveredAmount.upsert({
      where: { cargoLineId: c.id },
      update: { amount: c.scu, confirmed: true },
      create: { cargoLineId: c.id, amount: c.scu, confirmed: true },
    });
  }

  // Check completion
  const allCargos = await prisma.cargoLine.findMany({
    where: { missionId },
    include: { delivered: true },
  });
  const allDone = allCargos.every((c) => (c.delivered?.amount ?? 0) >= c.scu);
  if (allDone && !(mission as any).completedAt) {
    await prisma.mission.update({ where: { id: missionId }, data: { completedAt: new Date() } });
  }

  const updated = await prisma.mission.findFirst({ where: { id: missionId }, include: MISSION_INCLUDE });
  res.json(serializeMission(updated));
});

// POST /api/missions/:id/copy  — copy a mission as a new one
router.post('/:id/copy', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const source = await prisma.mission.findFirst({
    where: { id, userId: req.userId },
    include: MISSION_INCLUDE,
  });
  if (!source) { res.status(404).json({ error: 'Mission not found' }); return; }

  const s = serializeMission(source);
  const newMission = await prisma.mission.create({
    data: {
      userId: req.userId!,
      originId: (source as any).originId,
      system: source.system,
      pay: source.pay,
      cargos: {
        create: (source as any).cargos.map((c: any) => ({
          resourceId: c.resourceId,
          scu: c.scu,
          destId: c.destId,
          delivered: { create: { amount: 0, confirmed: false } },
        })),
      },
    },
    include: MISSION_INCLUDE,
  });
  res.status(201).json(serializeMission(newMission));
  void s; // suppress unused warning
});

export default router;
