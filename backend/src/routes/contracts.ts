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
  const id = parseInt(String(req.params['id']), 10);
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
  const id = parseInt(String(req.params['id']), 10);
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

  const VALID_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
  if (status !== undefined && !VALID_STATUS.includes(status)) {
    res.status(400).json({ error: 'Invalid status' }); return;
  }
  if (stops !== undefined && stops.some((s) => !['PICKUP', 'DELIVERY'].includes(s.type))) {
    res.status(400).json({ error: 'Invalid stop type' }); return;
  }

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
      const existingStops = await tx.contractStop.findMany({
        where: { contractId: id },
        include: { items: { orderBy: { id: 'asc' } } },
      });

      const newPositions = new Set(stops.map((s) => s.position));
      const stopsToDelete = existingStops.filter((s) => !newPositions.has(s.position));
      if (stopsToDelete.length > 0) {
        await tx.contractStop.deleteMany({ where: { id: { in: stopsToDelete.map((s) => s.id) } } });
      }

      for (const stop of stops) {
        const existingStop = existingStops.find((s) => s.position === stop.position);
        if (existingStop) {
          await tx.contractStop.update({
            where: { id: existingStop.id },
            data: { type: stop.type, station: stop.station },
          });
          const existingItems = existingStop.items;
          for (let i = 0; i < stop.items.length; i++) {
            const newItem = stop.items[i]!;
            const existingItem = existingItems[i];
            if (existingItem) {
              await tx.stopItem.update({
                where: { id: existingItem.id },
                data: {
                  material: newItem.material,
                  qty: newItem.qty,
                  done: newItem.done !== undefined ? newItem.done : existingItem.done,
                },
              });
            } else {
              await tx.stopItem.create({
                data: { stopId: existingStop.id, material: newItem.material, qty: newItem.qty, done: newItem.done ?? false },
              });
            }
          }
          if (existingItems.length > stop.items.length) {
            const surplus = existingItems.slice(stop.items.length);
            await tx.stopItem.deleteMany({ where: { id: { in: surplus.map((i) => i.id) } } });
          }
        } else {
          await tx.contractStop.create({
            data: {
              contractId: id,
              type: stop.type,
              station: stop.station,
              position: stop.position,
              items: {
                create: stop.items.map((it) => ({ material: it.material, qty: it.qty, done: it.done ?? false })),
              },
            },
          });
        }
      }
    }
  });

  const updated = await prisma.contract.findFirstOrThrow({ where: { id }, include: CONTRACT_INCLUDE });
  res.json(serializeContract(updated));
});

// DELETE /api/contracts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params['id']), 10);
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
    const contractId = parseInt(String(req.params['id']), 10);
    const stopId = parseInt(String(req.params['stopId']), 10);
    const itemId = parseInt(String(req.params['itemId']), 10);
    if (isNaN(contractId)) { res.status(400).json({ error: 'Invalid id' }); return; }
    if (isNaN(stopId)) { res.status(400).json({ error: 'Invalid id' }); return; }
    if (isNaN(itemId)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const contract = await prisma.contract.findFirst({ where: { id: contractId, userId: req.userId } });
    if (!contract) { res.status(404).json({ error: 'Not found' }); return; }

    const item = await prisma.stopItem.findFirst({ where: { id: itemId, stopId } });
    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    await prisma.stopItem.update({ where: { id: itemId }, data: { done: !item.done } });

    const allItems = await prisma.stopItem.findMany({ where: { stop: { contractId } } });
    const allDone = allItems.length > 0 && allItems.every((i) => i.done);
    if (allDone && contract.status !== 'COMPLETED') {
      await prisma.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } });
    } else if (!allDone && contract.status === 'COMPLETED') {
      await prisma.contract.update({ where: { id: contractId }, data: { status: 'IN_PROGRESS' } });
    }

    const updated = await prisma.contract.findFirstOrThrow({ where: { id: contractId }, include: CONTRACT_INCLUDE });
    res.json(serializeContract(updated));
  }
);

export default router;
