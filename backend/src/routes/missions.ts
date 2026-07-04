import { Router, Response } from 'express';
import { PrismaClient, CargoStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

async function resolveLocation(name: string, system: string) {
  // planet defaults to system when the caller doesn't know it; Settings can fix it later
  return prisma.location.upsert({
    where: { name_system: { name, system } },
    update: {},
    create: { name, planet: system, system },
  });
}
async function resolveResource(name: string) {
  return prisma.resource.upsert({ where: { name }, update: {}, create: { name } });
}

const MISSION_INCLUDE = {
  cargos: { include: { resource: true, origin: true, dest: true } },
} as const;

function serializeMission(m: any) {
  return {
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    completedAt: m.completedAt?.toISOString() ?? null,
    cargos: m.cargos.map((c: any) => ({
      id: c.id,
      res: c.resource.name,
      scu: c.scu,
      origin: c.origin.name,
      originPlanet: c.origin.planet,
      dest: c.dest.name,
      planet: c.dest.planet,
      status: c.status as CargoStatus,
    })),
  };
}

async function refreshCompletion(missionId: number) {
  const cargos = await prisma.cargoLine.findMany({ where: { missionId } });
  const allDone = cargos.length > 0 && cargos.every((c) => c.status === 'DELIVERED');
  const m = await prisma.mission.findUnique({ where: { id: missionId } });
  if (allDone && !m?.completedAt) {
    await prisma.mission.update({ where: { id: missionId }, data: { completedAt: new Date() } });
  } else if (!allDone && m?.completedAt) {
    await prisma.mission.update({ where: { id: missionId }, data: { completedAt: null } });
  }
}

// Default system for newly-created locations coming from the mission form.
const DEFAULT_SYSTEM = 'Stanton';

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const missions = await prisma.mission.findMany({
    where: { userId: req.userId },
    include: MISSION_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(missions.map(serializeMission));
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { cargos } = req.body as { cargos: { res: string; scu: number; origin: string; dest: string }[] };
  if (!Array.isArray(cargos) || cargos.length === 0) {
    res.status(400).json({ error: 'cargos required' });
    return;
  }
  const mission = await prisma.mission.create({
    data: {
      userId: req.userId!,
      cargos: {
        create: await Promise.all(
          cargos.map(async (c) => {
            const [originLoc, destLoc, resource] = await Promise.all([
              resolveLocation(c.origin, DEFAULT_SYSTEM),
              resolveLocation(c.dest, DEFAULT_SYSTEM),
              resolveResource(c.res),
            ]);
            return { resourceId: resource.id, scu: c.scu, originId: originLoc.id, destId: destLoc.id };
          })
        ),
      },
    },
    include: MISSION_INCLUDE,
  });
  res.status(201).json(serializeMission(mission));
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  const mission = await prisma.mission.findFirst({ where: { id, userId: req.userId } });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
  await prisma.mission.delete({ where: { id } });
  res.json({ ok: true });
});

router.patch('/:id/cargo/:cargoId/status', authenticate, async (req: AuthRequest, res: Response) => {
  const missionId = parseInt(String(req.params['id']));
  const cargoId = parseInt(String(req.params['cargoId']));
  const { status } = req.body as { status: CargoStatus };
  if (!['PENDING', 'LOADED', 'DELIVERED'].includes(status)) {
    res.status(400).json({ error: 'invalid status' }); return;
  }
  const mission = await prisma.mission.findFirst({ where: { id: missionId, userId: req.userId } });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
  await prisma.cargoLine.update({ where: { id: cargoId }, data: { status } });
  await refreshCompletion(missionId);
  const updated = await prisma.mission.findFirst({ where: { id: missionId }, include: MISSION_INCLUDE });
  res.json(serializeMission(updated));
});

router.post('/:id/stations/:station/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  const missionId = parseInt(String(req.params['id']));
  const station = decodeURIComponent(String(req.params['station']));
  const op = String(req.query['op'] ?? 'drop'); // 'load' | 'drop'
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, userId: req.userId }, include: MISSION_INCLUDE,
  });
  if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }

  const targets = (mission as any).cargos.filter((c: any) =>
    op === 'load' ? c.origin.name === station : c.dest.name === station
  );
  for (const c of targets) {
    // A drop only applies to cargo already loaded; a load moves PENDING → LOADED.
    if (op === 'load' && c.status === 'PENDING') {
      await prisma.cargoLine.update({ where: { id: c.id }, data: { status: 'LOADED' } });
    } else if (op === 'drop' && c.status === 'LOADED') {
      await prisma.cargoLine.update({ where: { id: c.id }, data: { status: 'DELIVERED' } });
    }
  }
  await refreshCompletion(missionId);
  const updated = await prisma.mission.findFirst({ where: { id: missionId }, include: MISSION_INCLUDE });
  res.json(serializeMission(updated));
});

router.post('/:id/copy', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  const source = await prisma.mission.findFirst({ where: { id, userId: req.userId }, include: MISSION_INCLUDE });
  if (!source) { res.status(404).json({ error: 'Mission not found' }); return; }
  const newMission = await prisma.mission.create({
    data: {
      userId: req.userId!,
      cargos: {
        create: (source as any).cargos.map((c: any) => ({
          resourceId: c.resourceId, scu: c.scu, originId: c.originId, destId: c.destId,
        })),
      },
    },
    include: MISSION_INCLUDE,
  });
  res.status(201).json(serializeMission(newMission));
});

export default router;
