import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'password must be at least 6 characters' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });
  res.status(201).json({ token: signToken(user.id), username: user.username });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  res.json({ token: signToken(user.id), username: user.username });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { selectedShip: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({
    id: user.id,
    username: user.username,
    selectedShip: user.selectedShip
      ? { id: user.selectedShip.id, name: user.selectedShip.name, scu: user.selectedShip.scu, manufacturer: user.selectedShip.manufacturer, category: user.selectedShip.category }
      : null,
  });
});

// PUT /api/auth/me/ship — update user's selected ship (auth required)
router.put('/me/ship', authenticate, async (req: AuthRequest, res: Response) => {
  const { shipId } = req.body as { shipId?: number | null };
  if (shipId === undefined) {
    res.status(400).json({ error: 'shipId required' });
    return;
  }

  const resolvedShipId = (shipId === null || shipId === 0) ? null : shipId;

  if (resolvedShipId !== null) {
    const ship = await prisma.ship.findUnique({ where: { id: resolvedShipId } });
    if (!ship) {
      res.status(404).json({ error: 'Ship not found' });
      return;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { selectedShipId: resolvedShipId },
    include: { selectedShip: true },
  });

  res.json({
    selectedShip: user.selectedShip
      ? {
          id: user.selectedShip.id,
          name: user.selectedShip.name,
          scu: user.selectedShip.scu,
          manufacturer: user.selectedShip.manufacturer,
          category: user.selectedShip.category,
        }
      : null,
  });
});

export default router;
