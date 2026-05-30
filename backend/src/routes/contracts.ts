import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const CONTRACT_INCLUDE = {
  ships: { include: { ship: true } },
  stops: {
    include: { items: true },
    orderBy: { position: 'asc' as const },
  },
};

function serializeContract(c: any) {
  return {
    id: c.id,
    name: c.name,
    client: c.client,
    status: c.status,
    payout: c.payout,
    createdAt: c.createdAt.toISOString(),
    ships: c.ships.map((cs: any) => ({
      id: cs.ship.id,
      name: cs.ship.name,
      model: cs.ship.model,
      pilot: cs.ship.pilot,
      scu: cs.ship.scu,
    })),
    stops: c.stops.map((s: any) => ({
      id: s.id,
      type: s.type,
      station: s.station,
      position: s.position,
      items: s.items.map((it: any) => ({
        id: it.id,
        material: it.material,
        qty: it.qty,
        done: it.done,
      })),
    })),
  };
}

// GET /api/contracts
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const contracts = await prisma.contract.findMany({
    where: { userId: req.userId },
    include: CONTRACT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(contracts.map(serializeContract));
});

// POST /api/contracts
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const contract = await prisma.contract.create({
    data: { userId: req.userId! },
    include: CONTRACT_INCLUDE,
  });
  res.status(201).json(serializeContract(contract));
});

// GET /api/contracts/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const contract = await prisma.contract.findFirst({
    where: { id, userId: req.userId },
    include: CONTRACT_INCLUDE,
  });
  if (!contract) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(serializeContract(contract));
});

type StopInput = {
  type: string;
  station: string;
  position: number;
  items: { material: string; qty: number; done?: boolean }[];
};

// PATCH /api/contracts/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const existing = await prisma.contract.findFirst({ where: { id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }

  const { name, client, payout, status, shipIds, stops } = req.body as {
    name?: string;
    client?: string;
    payout?: number;
    status?: string;
    shipIds?: number[];
    stops?: StopInput[];
  };

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(client !== undefined && { client }),
        ...(payout !== undefined && { payout }),
        ...(status !== undefined && { status }),
      },
    });

    if (shipIds !== undefined) {
      await tx.contractShip.deleteMany({ where: { contractId: id } });
      if (shipIds.length > 0) {
        await tx.contractShip.createMany({
          data: shipIds.map((shipId) => ({ contractId: id, shipId })),
        });
      }
    }

    if (stops !== undefined) {
      await tx.contractStop.deleteMany({ where: { contractId: id } });
      for (const stop of stops) {
        await tx.contractStop.create({
          data: {
            contractId: id,
            type: stop.type,
            station: stop.station,
            position: stop.position,
            items: {
              create: stop.items.map((it) => ({
                material: it.material,
                qty: it.qty,
                done: it.done ?? false,
              })),
            },
          },
        });
      }
    }
  });

  const updated = await prisma.contract.findFirstOrThrow({ where: { id }, include: CONTRACT_INCLUDE });
  res.json(serializeContract(updated));
});

// DELETE /api/contracts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']));
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }
  const existing = await prisma.contract.findFirst({ where: { id, userId: req.userId } });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  await prisma.contract.delete({ where: { id } });
  res.json({ ok: true });
});

// PATCH /api/contracts/:id/stops/:stopId/items/:itemId/toggle
router.patch(
  '/:id/stops/:stopId/items/:itemId/toggle',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const contractId = parseInt(String(req.params['id']));
    const stopId = parseInt(String(req.params['stopId']));
    const itemId = parseInt(String(req.params['itemId']));
    if (isNaN(contractId)) { res.status(400).json({ error: 'Invalid id' }); return; }
    if (isNaN(stopId)) { res.status(400).json({ error: 'Invalid id' }); return; }
    if (isNaN(itemId)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const contract = await prisma.contract.findFirst({ where: { id: contractId, userId: req.userId } });
    if (!contract) { res.status(404).json({ error: 'Not found' }); return; }

    const item = await prisma.stopItem.findFirst({ where: { id: itemId, stopId } });
    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    await prisma.stopItem.update({ where: { id: itemId }, data: { done: !item.done } });

    const allItems = await prisma.stopItem.findMany({ where: { stop: { contractId } } });
    if (allItems.length > 0 && allItems.every((i) => i.done) && contract.status !== 'COMPLETED') {
      await prisma.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } });
    }

    const updated = await prisma.contract.findFirstOrThrow({ where: { id: contractId }, include: CONTRACT_INCLUDE });
    res.json(serializeContract(updated));
  }
);

export default router;
