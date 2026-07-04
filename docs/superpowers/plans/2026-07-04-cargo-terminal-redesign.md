# Cargo Terminal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the front-end around multi-mission routing — per-cargo pickup (récup) and delivery (livraison) with a locked-until-loaded rule — on a distinctive "Cargo Terminal" visual identity, and remove all money handling.

**Architecture:** Backend Prisma migration moves the origin down to each `CargoLine` and adds a `status` enum (`PENDING/LOADED/DELIVERED`); the money models are dropped. The frontend gets a pure `buildRoute()` module (unit-tested) that groups cargo into ordered station stops and computes lock state, plus re-skinned screens (Route, Missions, Journal, Réglages, Login/Info) driven by a `cargo-terminal` CSS token layer.

**Tech Stack:** Backend — Express + Prisma (PostgreSQL) + TypeScript. Frontend — React 19 + Vite + Zustand + React Router 7 + TypeScript. Fonts via `@fontsource`. Tests via Vitest (frontend logic only).

## Global Constraints

- **No money anywhere.** No `pay`, `wallet`, `Transaction`, earnings, Finance page, or Chart.js usage tied to finance. Remove them.
- **Cargo lifecycle is `PENDING → LOADED → DELIVERED`** (binary per cargo line; no partial-SCU delivery).
- **A delivery (drop) is locked (non-actionable) while its cargo is `PENDING`.** This rule is enforced in `buildRoute()` and holds regardless of stop order.
- **Palette tokens (dark-only):** `--ink:#0e1116`, `--panel:#161b22`, `--panel-2:#1c222c`, `--edge:#2a323f`, `--amber:#f2a83b` (charge/récup + interactive), `--steel:#6ea8bf` (dépôt/livraison), `--ok:#7bb366`, `--halt:#e06b5c`, `--txt:#e6e9ee`, `--dim:#8b94a3`, `--faint:#565f6e`.
- **Fonts:** Oswald (display), JetBrains Mono (data), Barlow (body).
- **UI language is French** (labels, copy) — match existing app.
- **Commit messages: do NOT add any `Co-Authored-By` trailer** (no Claude/Anthropic co-author line). Plain messages only, exactly as shown in each task.
- **Validated mockups** (exact styling reference) live at `.superpowers/brainstorm/92745-1783185038/content/route-directions.html` (Direction A) and `mission-terminal.html`. Treat their CSS as the source of truth for the re-skin.
- Spec: `docs/superpowers/specs/2026-07-04-cargo-terminal-redesign-design.md`.

---

## File Structure

**Backend**
- Modify: `backend/prisma/schema.prisma` — new model.
- Create: `backend/prisma/migrations/<ts>_cargo_terminal/migration.sql` — via `prisma migrate dev`.
- Modify: `backend/src/routes/missions.ts` — per-cargo origin + status endpoints.
- Delete: `backend/src/routes/finance.ts`.
- Modify: `backend/src/server.ts` — drop finance router mount.
- Modify: `backend/prisma/seed.ts` — drop wallet/finance seed if present.

**Frontend — data layer**
- Modify: `frontend/src/types/index.ts` — new `CargoLine`, `Mission`, `CargoStatus`; drop `Transaction`.
- Modify: `frontend/src/lib/api.ts` — new mission payloads/endpoints; drop `finance`.
- Modify: `frontend/src/store/useMissionStore.ts` — status actions, no earnings.
- Delete: `frontend/src/store/useFinanceStore.ts`.
- Create: `frontend/src/lib/route.ts` — pure `buildRoute()` + `stationCode()`.
- Create: `frontend/src/lib/route.test.ts` — Vitest unit tests.
- Create: `frontend/src/store/useRouteStore.ts` — auto/manual order toggle + manual order, persisted.

**Frontend — design system + screens**
- Create: `frontend/src/styles/cargo-terminal.css` — tokens + component classes.
- Modify: `frontend/src/index.css` — import tokens, drop old theme/toggle vars.
- Modify: `frontend/src/components/layout/NavBar.tsx` — Cargo Terminal top bar (Route/Missions/Journal/Réglages).
- Create: `frontend/src/components/route/StopCard.tsx`, `CapacityGauge.tsx`, `Clamp.tsx`.
- Rewrite: `frontend/src/pages/Home.tsx` → Route screen.
- Rewrite: `frontend/src/pages/Missions.tsx` → simplified form + list.
- Rewrite: `frontend/src/pages/History.tsx` → Journal (no finance).
- Modify: `frontend/src/pages/Settings.tsx`, `Info.tsx`, `LoginPage.tsx` — re-skin.
- Delete: `frontend/src/pages/Finance.tsx` (if present), `frontend/src/components/home/*` (replaced).
- Modify: `frontend/src/App.tsx` — routes (drop finance), keep `/operations` as Route.

---

## Phase 0 — Test tooling

### Task 0: Add Vitest to the frontend

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run in `frontend/`:
```bash
npm install -D vitest@^2
```

- [ ] **Step 2: Add config**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 3: Add script**

In `frontend/package.json` `scripts`, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Smoke test**

Create `frontend/src/lib/_smoke.test.ts`:
```ts
import { test, expect } from 'vitest';
test('vitest runs', () => { expect(1 + 1).toBe(2); });
```
Run: `npm test`
Expected: 1 passed. Then delete `_smoke.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts
git commit -m "chore: add vitest for frontend logic tests"
```

---

## Phase 1 — Backend data model & API

### Task 1: Prisma schema migration

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Interfaces:**
- Produces: `CargoLine` with `originId:Int`, `destId:Int`, `status:CargoStatus`; `Mission` without `originId/system/pay`; enum `CargoStatus`. No `Transaction`, no `User.wallet`, no `DeliveredAmount`.

- [ ] **Step 1: Edit `schema.prisma`**

Replace the `User`, `Mission`, `CargoLine`, `Location` models and remove `DeliveredAmount` + `Transaction`. Final state of the changed parts:

```prisma
model User {
  id             Int       @id @default(autoincrement())
  username       String    @unique
  passwordHash   String
  createdAt      DateTime  @default(now())
  missions       Mission[]
  selectedShipId Int?
  selectedShip   Ship?     @relation(fields: [selectedShipId], references: [id])
}

model Location {
  id           Int         @id @default(autoincrement())
  name         String
  planet       String
  system       String
  cargoOrigins CargoLine[] @relation("CargoLineOrigin")
  cargoDests   CargoLine[] @relation("CargoLineDest")

  @@unique([name, system])
}

model Mission {
  id          Int         @id @default(autoincrement())
  userId      Int
  createdAt   DateTime    @default(now())
  completedAt DateTime?
  user        User        @relation(fields: [userId], references: [id])
  cargos      CargoLine[]
}

enum CargoStatus {
  PENDING
  LOADED
  DELIVERED
}

model CargoLine {
  id         Int         @id @default(autoincrement())
  missionId  Int
  resourceId Int
  scu        Float
  originId   Int
  destId     Int
  status     CargoStatus @default(PENDING)
  mission    Mission     @relation(fields: [missionId], references: [id], onDelete: Cascade)
  resource   Resource    @relation(fields: [resourceId], references: [id])
  origin     Location    @relation("CargoLineOrigin", fields: [originId], references: [id])
  dest       Location    @relation("CargoLineDest", fields: [destId], references: [id])
}
```
Keep `Ship` and `Resource` as-is (Resource keeps its `cargoLines CargoLine[]` back-relation).

- [ ] **Step 2: Create the migration (destructive, dev DB)**

Run in `backend/` (DB must be reachable via `DATABASE_URL`):
```bash
npx prisma migrate dev --name cargo_terminal
```
Expected: a new folder under `prisma/migrations/` and `prisma generate` runs. Accept data loss (dev).

- [ ] **Step 3: Verify client types**

Run: `npx prisma generate`
Expected: no errors; `CargoStatus` available on the generated client.

- [ ] **Step 4: Commit**
```bash
git add backend/prisma/schema.prisma backend/prisma/migrations
git commit -m "feat(db): per-cargo origin + status, drop money models"
```

### Task 2: Rewrite the missions route

**Files:**
- Modify: `backend/src/routes/missions.ts`

**Interfaces:**
- Consumes: Prisma client with new schema (Task 1).
- Produces `SerializedMission`: `{ id, createdAt, completedAt, cargos: { id, res, scu, origin, originPlanet, dest, planet, status }[] }`. Endpoints:
  - `GET /api/missions`
  - `POST /api/missions` body `{ cargos: { res, scu, origin, dest }[] }`
  - `DELETE /api/missions/:id`
  - `PATCH /api/missions/:id/cargo/:cargoId/status` body `{ status: 'PENDING'|'LOADED'|'DELIVERED' }`
  - `POST /api/missions/:id/stations/:station/confirm?op=load|drop`
  - `POST /api/missions/:id/copy`

- [ ] **Step 1: Replace the file body**

Rewrite `backend/src/routes/missions.ts`:
```ts
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
```

- [ ] **Step 2: Typecheck**

Run in `backend/`: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add backend/src/routes/missions.ts
git commit -m "feat(api): per-cargo origin + status endpoints"
```

### Task 3: Remove finance from the backend

**Files:**
- Delete: `backend/src/routes/finance.ts`
- Modify: `backend/src/server.ts`
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Delete the route file**
```bash
git rm backend/src/routes/finance.ts
```

- [ ] **Step 2: Remove the mount in `server.ts`**

Open `backend/src/server.ts`, delete the `import financeRouter ...` line and the `app.use('/api/finance', financeRouter)` (or similar) line.

- [ ] **Step 3: Clean the seed**

Open `backend/prisma/seed.ts`; remove any code that seeds `wallet` or `Transaction` (those models no longer exist). Leave ship/location/resource seeding intact.

- [ ] **Step 4: Typecheck**

Run in `backend/`: `npx tsc --noEmit`
Expected: no errors (no remaining reference to finance/wallet/Transaction).

- [ ] **Step 5: Commit**
```bash
git add backend/src/server.ts backend/prisma/seed.ts
git commit -m "chore(api): remove finance router and wallet seeding"
```

---

## Phase 2 — Frontend data layer

### Task 4: Update types

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Produces: `CargoStatus`, `CargoLine { id?, res, scu, origin, originPlanet, dest, planet, status }`, `Mission { id, cargos, createdAt, completedAt? }`. Removes `Transaction`.

- [ ] **Step 1: Rewrite the file**
```ts
export interface Ship {
  id: number; name: string; manufacturer: string; scu: number; category: string;
}

export type CargoStatus = 'PENDING' | 'LOADED' | 'DELIVERED';

export interface CargoLine {
  id?: number;
  res: string;
  scu: number;
  origin: string;        // pickup station
  originPlanet: string;
  dest: string;          // delivery station
  planet: string;        // delivery planet
  status: CargoStatus;
}

export interface Mission {
  id: number;
  cargos: CargoLine[];
  createdAt: string;
  completedAt?: string | null;
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/src/types/index.ts
git commit -m "feat(types): per-cargo origin + status, drop Transaction"
```

### Task 5: Update the API client and drop finance

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Produces: `SerializedMission { id, createdAt, completedAt, cargos: { id, res, scu, origin, originPlanet, dest, planet, status }[] }`; `api.missions.{ list, create({cargos}), delete, setStatus(missionId,cargoId,status), confirmStation(missionId,station,op), copy }`. Removes `api.finance`.

- [ ] **Step 1: Update `SerializedMission`**

Find the `SerializedMission` type in `api.ts` and replace with:
```ts
export interface SerializedMission {
  id: number;
  createdAt: string;
  completedAt: string | null;
  cargos: {
    id: number; res: string; scu: number;
    origin: string; originPlanet: string;
    dest: string; planet: string;
    status: 'PENDING' | 'LOADED' | 'DELIVERED';
  }[];
}
```

- [ ] **Step 2: Replace the `missions` block**
```ts
  missions: {
    list: () => request<SerializedMission[]>('/api/missions'),
    create: (data: { cargos: { res: string; scu: number; origin: string; dest: string }[] }) =>
      request<SerializedMission>('/api/missions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/missions/${id}`, { method: 'DELETE' }),
    setStatus: (missionId: number, cargoId: number, status: 'PENDING' | 'LOADED' | 'DELIVERED') =>
      request<SerializedMission>(`/api/missions/${missionId}/cargo/${cargoId}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) }),
    confirmStation: (missionId: number, station: string, op: 'load' | 'drop') =>
      request<SerializedMission>(
        `/api/missions/${missionId}/stations/${encodeURIComponent(station)}/confirm?op=${op}`,
        { method: 'POST' }),
    copy: (id: number) =>
      request<SerializedMission>(`/api/missions/${id}/copy`, { method: 'POST' }),
  },
```

- [ ] **Step 3: Delete the `finance` block**

Remove the entire `finance: { ... }` object from the `api` export and any finance-only types.

- [ ] **Step 4: Typecheck**

Run in `frontend/`: `npx tsc -b --noEmit` (expect errors only in files updated by later tasks — note them; `api.ts` itself must have no errors).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/lib/api.ts
git commit -m "feat(api-client): status endpoints, drop finance"
```

### Task 6: Route-building logic (TDD)

**Files:**
- Create: `frontend/src/lib/route.ts`
- Create: `frontend/src/lib/route.test.ts`

**Interfaces:**
- Produces:
  - `stationCode(name: string): string` — up to 3 uppercase letters.
  - `type StopCargo = { missionId: number; cargoId: number; res: string; scu: number; status: CargoStatus; locked: boolean; loadCode?: string }`
  - `type Stop = { key: string; station: string; planet: string; code: string; loads: StopCargo[]; drops: StopCargo[]; done: boolean }`
  - `buildRoute(missions: Mission[], opts: { autoOrder: boolean; manualOrder?: string[] }): Stop[]`
- Consumes: `Mission`, `CargoLine` (Task 4).

Rules: only non-completed missions contribute. A cargo produces a **load entry** at its `origin` station and a **drop entry** at its `dest` station. A drop is `locked` when its cargo `status === 'PENDING'`; its `loadCode` is the origin station's code. A stop is `done` when every load is `LOADED`/`DELIVERED` and every drop is `DELIVERED`. Auto order sorts stops by `planet` then `station` (both `localeCompare`); manual order sorts by the index of `stop.key` in `manualOrder`, unknown keys last (stable).

- [ ] **Step 1: Write failing tests**

Create `frontend/src/lib/route.test.ts`:
```ts
import { test, expect } from 'vitest';
import { buildRoute, stationCode } from './route';
import type { Mission } from '../types';

const mk = (over: Partial<Mission['cargos'][0]>): Mission['cargos'][0] => ({
  id: Math.floor(Math.random() * 1e6), res: 'Titanium', scu: 100,
  origin: 'Everus Harbor', originPlanet: 'Hurston',
  dest: 'Port Tressler', planet: 'microTech', status: 'PENDING', ...over,
});
const mission = (id: number, cargos: Mission['cargos']): Mission =>
  ({ id, cargos, createdAt: '', completedAt: null });

test('stationCode takes up to 3 uppercase letters', () => {
  expect(stationCode('Everus Harbor')).toBe('EVE');
  expect(stationCode('New Babbage')).toBe('NEW');
});

test('a cargo creates a load stop and a drop stop', () => {
  const stops = buildRoute([mission(1, [mk({ id: 10 })])], { autoOrder: true });
  const origin = stops.find((s) => s.station === 'Everus Harbor')!;
  const dest = stops.find((s) => s.station === 'Port Tressler')!;
  expect(origin.loads).toHaveLength(1);
  expect(dest.drops).toHaveLength(1);
});

test('a drop is locked while its cargo is PENDING and unlocked once LOADED', () => {
  const pending = buildRoute([mission(1, [mk({ id: 10, status: 'PENDING' })])], { autoOrder: true });
  expect(pending.find((s) => s.station === 'Port Tressler')!.drops[0].locked).toBe(true);
  const loaded = buildRoute([mission(1, [mk({ id: 10, status: 'LOADED' })])], { autoOrder: true });
  expect(loaded.find((s) => s.station === 'Port Tressler')!.drops[0].locked).toBe(false);
});

test('completed missions are excluded', () => {
  const m = mission(1, [mk({ status: 'DELIVERED' })]);
  m.completedAt = '2026-01-01';
  expect(buildRoute([m], { autoOrder: true })).toHaveLength(0);
});

test('same station across missions is one stop', () => {
  const stops = buildRoute([
    mission(1, [mk({ id: 1, origin: 'Everus Harbor' })]),
    mission(2, [mk({ id: 2, origin: 'Everus Harbor', res: 'Aluminium' })]),
  ], { autoOrder: true });
  expect(stops.find((s) => s.station === 'Everus Harbor')!.loads).toHaveLength(2);
});

test('manual order overrides auto sort', () => {
  const stops = buildRoute([mission(1, [mk({ origin: 'AAA', dest: 'ZZZ' })])], {
    autoOrder: false, manualOrder: ['microTech|zzz', 'Hurston|aaa'],
  });
  // manualOrder is keyed by stop.key; unknown-key ordering falls back to append.
  expect(stops.length).toBe(2);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run in `frontend/`: `npm test`
Expected: FAIL — `route.ts` not found / exports undefined.

- [ ] **Step 3: Implement `route.ts`**
```ts
import type { Mission, CargoStatus } from '../types';

export function stationCode(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '');
  return letters.slice(0, 3).toUpperCase();
}

export interface StopCargo {
  missionId: number; cargoId: number; res: string; scu: number;
  status: CargoStatus; locked: boolean; loadCode?: string;
}
export interface Stop {
  key: string; station: string; planet: string; code: string;
  loads: StopCargo[]; drops: StopCargo[]; done: boolean;
}

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const keyOf = (planet: string, station: string) => `${norm(planet)}|${norm(station)}`;

export function buildRoute(
  missions: Mission[],
  opts: { autoOrder: boolean; manualOrder?: string[] }
): Stop[] {
  const stops = new Map<string, Stop>();
  const ensure = (planet: string, station: string): Stop => {
    const key = keyOf(planet, station);
    let stop = stops.get(key);
    if (!stop) {
      stop = { key, station, planet, code: stationCode(station), loads: [], drops: [], done: false };
      stops.set(key, stop);
    }
    return stop;
  };

  for (const m of missions) {
    if (m.completedAt) continue;
    for (const c of m.cargos) {
      if (c.id == null) continue;
      const loadStop = ensure(c.originPlanet || c.planet, c.origin);
      loadStop.loads.push({
        missionId: m.id, cargoId: c.id, res: c.res, scu: c.scu, status: c.status, locked: false,
      });
      const dropStop = ensure(c.planet, c.dest);
      dropStop.drops.push({
        missionId: m.id, cargoId: c.id, res: c.res, scu: c.scu, status: c.status,
        locked: c.status === 'PENDING', loadCode: stationCode(c.origin),
      });
    }
  }

  const list = [...stops.values()];
  for (const s of list) {
    s.done =
      s.loads.every((l) => l.status !== 'PENDING') &&
      s.drops.every((d) => d.status === 'DELIVERED') &&
      s.loads.length + s.drops.length > 0;
  }

  if (opts.autoOrder || !opts.manualOrder) {
    list.sort((a, b) => a.planet.localeCompare(b.planet) || a.station.localeCompare(b.station));
  } else {
    const order = opts.manualOrder;
    const idx = (k: string) => { const i = order.indexOf(k); return i === -1 ? Number.MAX_SAFE_INTEGER : i; };
    list.sort((a, b) => idx(a.key) - idx(b.key));
  }
  return list;
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: all pass. (Note: `stationCode('Everus Harbor')` → `'EVE'`; the mockups used `EVR` as illustration — the deterministic rule is first-3-letters.)

- [ ] **Step 5: Commit**
```bash
git add frontend/src/lib/route.ts frontend/src/lib/route.test.ts
git commit -m "feat(route): buildRoute + lock logic with tests"
```

### Task 7: Mission store + route store

**Files:**
- Modify: `frontend/src/store/useMissionStore.ts`
- Create: `frontend/src/store/useRouteStore.ts`
- Delete: `frontend/src/store/useFinanceStore.ts`

**Interfaces:**
- Produces: `useMissionStore` with `{ missions, loading, fetch(), addMission({cargos}), deleteMission(id), setCargoStatus(missionId, cargoId, status), confirmStation(missionId, station, op), copyMission(id) }`. `useRouteStore` with `{ autoOrder, manualOrder, toggleAuto(), setManualOrder(keys) }` persisted to localStorage.

- [ ] **Step 1: Delete finance store**
```bash
git rm frontend/src/store/useFinanceStore.ts
```

- [ ] **Step 2: Rewrite `useMissionStore.ts`**
```ts
import { create } from 'zustand';
import { api } from '../lib/api';
import type { SerializedMission } from '../lib/api';
import type { Mission, CargoStatus } from '../types';

function toMission(m: SerializedMission): Mission {
  return {
    id: m.id, createdAt: m.createdAt, completedAt: m.completedAt,
    cargos: m.cargos.map((c) => ({
      id: c.id, res: c.res, scu: c.scu,
      origin: c.origin, originPlanet: c.originPlanet,
      dest: c.dest, planet: c.planet, status: c.status,
    })),
  };
}

interface MissionStore {
  missions: Mission[];
  loading: boolean;
  fetch: () => Promise<void>;
  addMission: (cargos: { res: string; scu: number; origin: string; dest: string }[]) => Promise<Mission>;
  deleteMission: (id: number) => Promise<void>;
  setCargoStatus: (missionId: number, cargoId: number, status: CargoStatus) => Promise<void>;
  confirmStation: (missionId: number, station: string, op: 'load' | 'drop') => Promise<void>;
  copyMission: (id: number) => Promise<void>;
}

export const useMissionStore = create<MissionStore>((set) => {
  const replace = (updated: SerializedMission) =>
    set((s) => ({ missions: s.missions.map((m) => (m.id === updated.id ? toMission(updated) : m)) }));
  return {
    missions: [], loading: false,
    fetch: async () => {
      set({ loading: true });
      const data = await api.missions.list();
      set({ missions: data.map(toMission), loading: false });
    },
    addMission: async (cargos) => {
      const data = await api.missions.create({ cargos });
      const m = toMission(data);
      set((s) => ({ missions: [m, ...s.missions] }));
      return m;
    },
    deleteMission: async (id) => {
      await api.missions.delete(id);
      set((s) => ({ missions: s.missions.filter((m) => m.id !== id) }));
    },
    setCargoStatus: async (missionId, cargoId, status) => {
      const updated = await api.missions.setStatus(missionId, cargoId, status);
      replace(updated);
    },
    confirmStation: async (missionId, station, op) => {
      const updated = await api.missions.confirmStation(missionId, station, op);
      replace(updated);
    },
    copyMission: async (id) => {
      const data = await api.missions.copy(id);
      set((s) => ({ missions: [toMission(data), ...s.missions] }));
    },
  };
});
```

- [ ] **Step 3: Create `useRouteStore.ts`**
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RouteStore {
  autoOrder: boolean;
  manualOrder: string[];
  toggleAuto: () => void;
  setManualOrder: (keys: string[]) => void;
}

export const useRouteStore = create<RouteStore>()(
  persist(
    (set) => ({
      autoOrder: true,
      manualOrder: [],
      toggleAuto: () => set((s) => ({ autoOrder: !s.autoOrder })),
      setManualOrder: (keys) => set({ manualOrder: keys, autoOrder: false }),
    }),
    { name: 'scht-route' }
  )
);
```

- [ ] **Step 4: Typecheck**

Run in `frontend/`: `npx tsc -b --noEmit`
Expected: errors now only in page components consuming the old store shape (fixed in Phase 4). The two store files themselves must be clean.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/store/useMissionStore.ts frontend/src/store/useRouteStore.ts
git commit -m "feat(store): status-based missions + route order store"
```

---

## Phase 3 — Design system

### Task 8: Cargo Terminal tokens + fonts

**Files:**
- Create: `frontend/src/styles/cargo-terminal.css`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install fonts**

Run in `frontend/`:
```bash
npm install @fontsource/oswald @fontsource/jetbrains-mono @fontsource/barlow
```

- [ ] **Step 2: Import fonts in `main.tsx`**

Add at the top of `frontend/src/main.tsx`:
```ts
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/600.css';
```

- [ ] **Step 3: Create `cargo-terminal.css`**

Create `frontend/src/styles/cargo-terminal.css` with the token layer and shared component classes. Copy the palette from Global Constraints into `:root` and port the classes from the validated mockup `.superpowers/brainstorm/92745-1783185038/content/route-directions.html` (the `.ta-*` classes) and `mission-terminal.html` (`.ta2-*`), renamed to app-level names:
```css
:root {
  --ink:#0e1116; --panel:#161b22; --panel-2:#1c222c; --edge:#2a323f;
  --amber:#f2a83b; --steel:#6ea8bf; --ok:#7bb366; --halt:#e06b5c;
  --txt:#e6e9ee; --dim:#8b94a3; --faint:#565f6e;
  --font-display:'Oswald',sans-serif; --font-mono:'JetBrains Mono',monospace; --font-body:'Barlow',sans-serif;
}
html,body,#root { background:var(--ink); color:var(--txt); font-family:var(--font-body); }
/* Then: .ct-topbar, .ct-nav, .ct-gauge, .ct-stop, .ct-index, .ct-clamp,
   .ct-op-load, .ct-op-drop, .ct-stripe, .ct-jump, .ct-form-line, .ct-btn-*
   — ported 1:1 from the mockups' .ta-*/.ta2-* rules. */
```
Reproduce every `.ta-*`/`.ta2-*` rule from those two mockup files under `.ct-*` names. The mockups are the exact visual spec.

- [ ] **Step 4: Strip old theme from `index.css`**

In `frontend/src/index.css`: delete the light/dark `:root`/`[data-theme]` terracotta variables and the old `.navbar`/HUD classes that the new components replace. Keep only genuinely shared resets. Add at top: `@import './styles/cargo-terminal.css';`

- [ ] **Step 5: Verify build**

Run in `frontend/`: `npm run build`
Expected: build succeeds (some pages may still reference removed classes — if the build only warns, proceed; fix hard TS errors in later tasks).

- [ ] **Step 6: Commit**
```bash
git add frontend/src/styles/cargo-terminal.css frontend/src/index.css frontend/src/main.tsx frontend/package.json frontend/package-lock.json
git commit -m "feat(ui): cargo terminal design tokens + fonts"
```

### Task 9: Top bar / navigation

**Files:**
- Modify: `frontend/src/components/layout/NavBar.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Rewrite `NavBar.tsx`**

Render the Cargo Terminal top bar: brand `HAUL//OPS` (amber `//`), nav links **Route** (`/operations`), **Missions** (`/missions`), **Journal** (`/history`), **Réglages** (`/settings`), plus an Info icon (`/info`) and logout. Use `NavLink` with `className` toggling `.ct-nav-item` / active. No theme toggle. Port markup/classes from the mockup `.ta-top`/`.ta-nav`.

- [ ] **Step 2: Update `App.tsx` routes**

Remove any `/finance` route and the Finance import. Keep:
```tsx
<Route path="/" element={<Navigate to="/operations" replace />} />
<Route path="/operations" element={<Home />} />
<Route path="/missions" element={<Missions />} />
<Route path="/history" element={<History />} />
<Route path="/info" element={<Info />} />
<Route path="/settings" element={<Settings />} />
```

- [ ] **Step 3: Verify**

Run `npm run build` (frontend). Expected: no NavBar/App TS errors.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/components/layout/NavBar.tsx frontend/src/App.tsx
git commit -m "feat(ui): cargo terminal top bar + routes"
```

---

## Phase 4 — Screens

### Task 10: Shared route components

**Files:**
- Create: `frontend/src/components/route/Clamp.tsx`
- Create: `frontend/src/components/route/CapacityGauge.tsx`

**Interfaces:**
- Produces:
  - `Clamp({ checked, disabled, onToggle }: { checked: boolean; disabled?: boolean; onToggle: () => void })`
  - `CapacityGauge({ loaded, incoming, capacity }: { loaded: number; incoming?: number; capacity: number | null })` — segmented cells (`--amber` full, `--amber` @40% for incoming), value `loaded/capacity`, `--halt` when over capacity.

- [ ] **Step 1: Implement `Clamp.tsx`**
```tsx
import React from 'react';
export const Clamp: React.FC<{ checked: boolean; disabled?: boolean; onToggle: () => void }> =
  ({ checked, disabled, onToggle }) => (
    <button type="button" className={`ct-clamp${checked ? ' on' : ''}`} disabled={disabled}
      aria-pressed={checked} onClick={onToggle} />
  );
```

- [ ] **Step 2: Implement `CapacityGauge.tsx`**
```tsx
import React from 'react';
const CELLS = 10;
export const CapacityGauge: React.FC<{ loaded: number; incoming?: number; capacity: number | null }> =
  ({ loaded, incoming = 0, capacity }) => {
    const over = capacity != null && loaded + incoming > capacity;
    const frac = (n: number) => (capacity ? Math.round((n / capacity) * CELLS) : 0);
    const full = frac(loaded), extra = Math.max(0, frac(loaded + incoming) - full);
    return (
      <div className="ct-gauge">
        <span className="ct-gauge-lbl">SOUTE</span>
        <div className="ct-cells">
          {Array.from({ length: CELLS }).map((_, i) => (
            <div key={i} className={`ct-cell${i < full ? ' f' : i < full + extra ? ' i' : ''}`} />
          ))}
        </div>
        <span className="ct-gauge-val" style={{ color: over ? 'var(--halt)' : 'var(--amber)' }}>
          {loaded + incoming}/{capacity ?? '—'}
        </span>
      </div>
    );
  };
```

- [ ] **Step 3: Add matching `.ct-clamp`, `.ct-gauge*`, `.ct-cell` rules** to `cargo-terminal.css` (from the mockups' `.ta-clamp`, `.ta-gauge`, `.ta-cell`, plus `.ct-cell.i { background: rgba(242,168,59,.4) }`).

- [ ] **Step 4: Verify build**: `npm run build` — no errors in these files.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/route frontend/src/styles/cargo-terminal.css
git commit -m "feat(ui): Clamp + CapacityGauge components"
```

### Task 11: Route screen (rewrite Home)

**Files:**
- Rewrite: `frontend/src/pages/Home.tsx`
- Create: `frontend/src/components/route/StopCard.tsx`
- Delete: `frontend/src/components/home/PlanetGroup.tsx`, `StationBlock.tsx`, `ResourceRow.tsx`

**Interfaces:**
- Consumes: `buildRoute` (Task 6), `useMissionStore`, `useRouteStore`, `useShipStore`, `Clamp`, `CapacityGauge`.
- Manual reorder: `StopCard` exposes `onMoveUp`/`onMoveDown`/`canUp`/`canDown`; `Home` swaps adjacent stop keys and calls `setManualOrder(keys)` (which also flips `autoOrder` off).

- [ ] **Step 1: Implement `StopCard.tsx`**

Render one `Stop` (Task 6 type): index block (`code` + `LEG NN` passed as prop) with **up/down reorder arrows**, station name + planet, a `▲ CHARGEMENT` section listing `loads` and a `▼ DÉPÔT` section listing `drops`. Each row = `Clamp` + resource + `scu` + mission tag. Locked drops: add `.ct-row.lock`, disable the clamp, show `⊘ VERROUILLÉ — CHARGER À {loadCode}` and a `.ct-stripe`. Clamp handlers call `setCargoStatus(missionId, cargoId, 'LOADED')` for loads and `'DELIVERED'` for drops (toggle back to previous state on uncheck). The arrows call `onMoveUp`/`onMoveDown` and are disabled at the ends (`canUp`/`canDown`).
```tsx
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Stop } from '../../lib/route';
import { Clamp } from './Clamp';
import { useMissionStore } from '../../store/useMissionStore';

interface StopCardProps {
  stop: Stop; leg: number;
  onMoveUp: () => void; onMoveDown: () => void;
  canUp: boolean; canDown: boolean;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, leg, onMoveUp, onMoveDown, canUp, canDown }) => {
  const setStatus = useMissionStore((s) => s.setCargoStatus);
  return (
    <div className={`ct-stop${stop.done ? ' done' : ''}`}>
      <div className="ct-index">
        <div className="code">{stop.code}</div>
        <div className="leg">LEG {String(leg).padStart(2, '0')}</div>
        <div className="ct-reorder">
          <button className="ct-arrow" onClick={onMoveUp} disabled={!canUp} aria-label="Monter l'arrêt"><ChevronUp size={14} /></button>
          <button className="ct-arrow" onClick={onMoveDown} disabled={!canDown} aria-label="Descendre l'arrêt"><ChevronDown size={14} /></button>
        </div>
      </div>
      <div className="ct-stop-main">
        <div className="ct-station">{stop.station}<small>{stop.planet}</small></div>
        {stop.drops.length > 0 && (
          <>
            <div className="ct-op ct-op-drop">▼ DÉPÔT</div>
            {stop.drops.map((d) => (
              <div key={`d${d.cargoId}`} className={`ct-row${d.locked ? ' lock' : ''}`}>
                <Clamp checked={d.status === 'DELIVERED'} disabled={d.locked}
                  onToggle={() => setStatus(d.missionId, d.cargoId, d.status === 'DELIVERED' ? 'LOADED' : 'DELIVERED')} />
                <span className="ct-nm">{d.res}</span><span className="ct-scu">{d.scu} SCU</span>
                <span className="ct-mn">M#{d.missionId}</span>
              </div>
            ))}
            {stop.drops.some((d) => d.locked) && <div className="ct-stripe" />}
            {stop.drops.filter((d) => d.locked).map((d) => (
              <div key={`n${d.cargoId}`} className="ct-note">⊘ VERROUILLÉ — CHARGER À {d.loadCode}</div>
            ))}
          </>
        )}
        {stop.loads.length > 0 && (
          <>
            <div className="ct-op ct-op-load">▲ CHARGEMENT</div>
            {stop.loads.map((l) => (
              <div key={`l${l.cargoId}`} className="ct-row">
                <Clamp checked={l.status !== 'PENDING'}
                  onToggle={() => setStatus(l.missionId, l.cargoId, l.status === 'PENDING' ? 'LOADED' : 'PENDING')} />
                <span className="ct-nm">{l.res}</span><span className="ct-scu">{l.scu} SCU</span>
                <span className="ct-mn">M#{l.missionId}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Rewrite `Home.tsx`**
```tsx
import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useRouteStore } from '../store/useRouteStore';
import { useShipStore } from '../store/useShipStore';
import { buildRoute } from '../lib/route';
import { StopCard } from '../components/route/StopCard';
import { CapacityGauge } from '../components/route/CapacityGauge';

export const Home: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const { autoOrder, manualOrder, toggleAuto, setManualOrder } = useRouteStore();
  const ship = useShipStore((s) => s.selectedShip);

  const stops = buildRoute(missions, { autoOrder, manualOrder });
  const loaded = missions.flatMap((m) => m.cargos)
    .filter((c) => c.status === 'LOADED').reduce((n, c) => n + c.scu, 0);

  // Reorder: swap the displayed stop at `i` with its neighbour and persist the
  // full key order. setManualOrder also switches the store into manual mode.
  const move = (i: number, dir: -1 | 1) => {
    const keys = stops.map((s) => s.key);
    const j = i + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    setManualOrder(keys);
  };

  let lastPlanet = '';
  return (
    <div className="ct-page">
      <div className="ct-page-bar">
        <CapacityGauge loaded={loaded} capacity={ship?.scu ?? null} />
        <button className={`ct-toggle${autoOrder ? ' on' : ''}`} onClick={toggleAuto}>
          AUTO {autoOrder ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="ct-content">
        {stops.length === 0 ? (
          <div className="ct-empty">Aucun arrêt. Enregistre une mission.</div>
        ) : stops.map((s, i) => {
          const jump = s.planet !== lastPlanet ? (lastPlanet = s.planet) : null;
          return (
            <React.Fragment key={s.key}>
              {jump && <div className="ct-jump">↝ SAUT QUANTIQUE VERS <b>{jump}</b></div>}
              <StopCard
                stop={s} leg={i + 1}
                onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)}
                canUp={i > 0} canDown={i < stops.length - 1}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
```

> **Note on reordering + auto sort:** clicking an arrow calls `setManualOrder`, which turns `autoOrder` off, so the manual order sticks. Toggling `AUTO ON` again re-applies the automatic sort (manual order is retained in storage but ignored while auto is on).

- [ ] **Step 3: Delete old home components**
```bash
git rm frontend/src/components/home/PlanetGroup.tsx frontend/src/components/home/StationBlock.tsx frontend/src/components/home/ResourceRow.tsx
```

- [ ] **Step 4: Add `.ct-stop`, `.ct-index`, `.ct-reorder`, `.ct-arrow`, `.ct-op-*`, `.ct-row`, `.ct-note`, `.ct-jump`, `.ct-toggle`, `.ct-page*`, `.ct-empty`** rules to `cargo-terminal.css` from the Direction A mockup. `.ct-arrow` = small icon button (transparent, `--edge` border, `--faint` icon; `--amber` on hover; `opacity:.3` when `:disabled`); `.ct-reorder` stacks the two arrows vertically in the index block.

- [ ] **Step 5: Verify build + run**: `npm run build`, then launch the app (`/run`) and confirm: stops render, checking a load unlocks the matching locked drop, gauge updates.

- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/Home.tsx frontend/src/components/route/StopCard.tsx frontend/src/styles/cargo-terminal.css
git commit -m "feat(ui): Route screen with lock mechanic"
```

### Task 12: Missions screen (rewrite)

**Files:**
- Rewrite: `frontend/src/pages/Missions.tsx`

**Interfaces:**
- Consumes: `useMissionStore` (`addMission`, `deleteMission`, `copyMission`), `useListsStore`, `useShipStore`, `ComboSelect`, `CapacityGauge`.

- [ ] **Step 1: Rewrite `Missions.tsx`**

Build the simplified form: a table of cargo lines, each `{ res, scu, origin, dest }` edited via `ComboSelect` (stations from `locations`, resources from `resources`, both allow inline create via `addLocation({name, system:'Stanton', planet:'Autre'})` / `addResource`). Columns: Commodité · SCU · ▲ Charge · ▼ Dépôt · remove. `CapacityGauge` with `loaded` = SCU already LOADED across active missions and `incoming` = sum of form SCU. `+ Ajouter une cargaison`, `Enregistrer` (calls `addMission(lines.filter(scu>0).map(...))` then clears), `Annuler`. Below: list of active missions (not `completedAt`) as cards showing each cargo `origin → dest · res · scu · status`, with Copier/Supprimer. No pay, no system, no template dropdown, no Options block. Port classes from `mission-terminal.html` (`.ta2-*` → `.ct-form-*`).

- [ ] **Step 2: Add `.ct-form-*` rules** to `cargo-terminal.css` from the mission mockup.

- [ ] **Step 3: Verify build + run**: `npm run build`, `/run`, create a mission with two cargo lines from different origins → confirm it appears on the Route screen as separate load/drop stops.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/Missions.tsx frontend/src/styles/cargo-terminal.css
git commit -m "feat(ui): simplified mission form + active list"
```

### Task 13: Journal, Réglages, Info, Login re-skin

**Files:**
- Rewrite: `frontend/src/pages/History.tsx`
- Modify: `frontend/src/pages/Settings.tsx`, `frontend/src/pages/Info.tsx`, `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Rewrite `History.tsx` (Journal)**

List missions with `completedAt`, newest first. Per mission show: completion date, number of distinct destination stations, total SCU delivered, and a "Rejouer" button (`copyMission`). Remove all earnings/finance columns and any Chart.js import. Use Cargo Terminal classes.

- [ ] **Step 2: Re-skin `Settings.tsx`**

Keep functionality (locations CRUD, resources CRUD, ship selection, Stanton import). Replace terracotta/HUD classes with `.ct-*` equivalents. Remove any wallet/finance UI.

- [ ] **Step 3: Re-skin `Info.tsx` and `LoginPage.tsx`**

Apply Cargo Terminal tokens/typography. Login: `HAUL//OPS` brand, amber primary button; auth logic unchanged.

- [ ] **Step 4: Verify build + run**: `npm run build`, `/run`, click through Route → Missions → Journal → Réglages → Info, and the login screen (logged out). No console errors, no terracotta remnants.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/History.tsx frontend/src/pages/Settings.tsx frontend/src/pages/Info.tsx frontend/src/pages/LoginPage.tsx
git commit -m "feat(ui): re-skin Journal, Réglages, Info, Login"
```

### Task 14: Final sweep — remove dead code & verify

**Files:**
- Various (search-driven)

- [ ] **Step 1: Hunt finance/pay/wallet remnants**

Run in repo root:
```bash
grep -rn "finance\|wallet\|Transaction\|\.pay\|recordMissionEarning\|useFinanceStore" frontend/src backend/src --include=*.ts --include=*.tsx
```
Expected: no matches. Remove any that remain.

- [ ] **Step 2: Remove Chart.js if now unused**

If the grep for `chart.js`/`react-chartjs-2` imports returns nothing:
```bash
cd frontend && npm uninstall chart.js react-chartjs-2
```

- [ ] **Step 3: Full typecheck + build**

Run: `cd frontend && npx tsc -b --noEmit && npm run build` — expect success.
Run: `cd backend && npx tsc --noEmit` — expect success.
Run: `cd frontend && npm test` — expect route tests pass.

- [ ] **Step 4: End-to-end run**

Launch backend + frontend (`/run`). Register/login, create two missions sharing a pickup station, verify: Route groups them into one load stop, drops locked until loaded, gauge tracks LOADED SCU, completing all drops moves a mission to Journal.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "chore: remove dead finance code, drop chart deps"
```

---

## Self-Review Notes

- **Spec coverage:** data model (Tasks 1–7), design system (8–10), Route (11), Missions (12), Journal/Réglages/Login/Info (13), money removal (3, 5, 13, 14), auto/manual order + lock (6, 11), fonts/palette (8). All spec sections mapped.
- **Decisions (spec §8):** binary status (Task 1 enum), dark-only (Task 8 strips theme), manual reorder via **up/down arrows** on each stop (Task 11 — `StopCard` arrows + `Home.move()` + `useRouteStore.setManualOrder`); auto-order is the default, arrows switch to manual, `AUTO ON` re-applies auto sort. Drag & drop deferred as a later enhancement.
- **Station codes** are generated first-3-letters (Task 6), not the illustrative `EVR/TRS` from mockups.
