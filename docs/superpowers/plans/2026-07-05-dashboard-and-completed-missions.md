# Dashboard + inline completed missions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Journal screen, show completed missions greyed/struck inline on the Missions page, and add a Dashboard (KPI tiles + GitHub-style contribution grid + in-progress preview + top breakdowns).

**Architecture:** 100% frontend. The mission store already holds all missions (including completed, with `completedAt`), so a new pure `lib/stats.ts` module computes every dashboard aggregate client-side; React components render it. No backend/DB/API changes.

**Tech Stack:** React 19 + Vite + TypeScript + Zustand. Vitest for the stats module. Cargo Terminal CSS tokens (`frontend/src/styles/cargo-terminal.css`).

## Global Constraints

- **Frontend only** — no backend/Prisma/API changes.
- **Commit messages: PLAIN**, no `Co-Authored-By` trailer, no "Generated with Claude Code" — exactly the messages shown here.
- **UI language: French.**
- **Cargo Terminal dark theme**, `.ct-*` classes; palette tokens already defined in `cargo-terminal.css` (`--ink #0e1116`, `--panel #161b22`, `--panel-2 #1c222c`, `--edge #2a323f`, `--amber #f2a83b`, `--steel #6ea8bf`, `--ok #7bb366`, `--halt #e06b5c`, `--txt #e6e9ee`, `--dim #8b94a3`, `--faint #565f6e`). Fonts: Oswald (display), JetBrains Mono (data), Barlow (body).
- **Delivered aggregates count only cargo with `status === 'DELIVERED'`.**
- **Contribution grid:** 13 weeks × 7 days, full width (`grid-template-columns: repeat(13, 1fr)`), level 0–4 by fixed thresholds (0→empty, 1→l1, 2→l2, 3→l3, ≥4→l4).
- **Route stays the landing screen** (`/` → `/operations`). Dashboard is a nav item.
- Validated mockup (exact styling reference): `.superpowers/brainstorm/81833-1783204350/content/dashboard-v3.html`.
- Spec: `docs/superpowers/specs/2026-07-05-dashboard-and-completed-missions-design.md`.
- Branch: `redesign-cargo-terminal` (continues the open redesign PR).

**Types already in `frontend/src/types/index.ts`:**
```ts
type CargoStatus = 'PENDING' | 'LOADED' | 'DELIVERED';
interface CargoLine { id?: number; res: string; scu: number; origin: string; originPlanet: string; dest: string; planet: string; status: CargoStatus; }
interface Mission { id: number; cargos: CargoLine[]; createdAt: string; completedAt?: string | null; }
```

---

## File Structure

- Create: `frontend/src/lib/stats.ts` — pure aggregation (KPIs, grid, progress, tops).
- Create: `frontend/src/lib/stats.test.ts` — Vitest.
- Create: `frontend/src/pages/Dashboard.tsx` — assembles the 4 blocks.
- Create: `frontend/src/components/dashboard/KpiTiles.tsx`, `ContributionGrid.tsx`, `InProgressList.tsx`, `TopBreakdown.tsx`.
- Modify: `frontend/src/components/layout/NavBar.tsx` — Journal→Dashboard.
- Modify: `frontend/src/App.tsx` — route `/history`→`/dashboard`.
- Modify: `frontend/src/pages/Missions.tsx` — show completed greyed/struck.
- Modify: `frontend/src/styles/cargo-terminal.css` — dashboard + `.ct-mission-card.done` rules.
- Delete: `frontend/src/pages/History.tsx`.

---

## Task 1: Stats module (TDD)

**Files:**
- Create: `frontend/src/lib/stats.ts`
- Create: `frontend/src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `Mission`, `CargoLine` from `../types`.
- Produces:
  - `interface DayCell { date: Date; count: number; level: 0|1|2|3|4 }`
  - `interface Kpis { inProgress: number; completed: number; scuDelivered: number; cargosDelivered: number }`
  - `interface TopEntry { name: string; scu: number }`
  - `computeKpis(missions: Mission[]): Kpis`
  - `buildContributionGrid(missions: Mission[], opts?: { weeks?: number; today?: Date }): DayCell[][]` — outer array = weeks (columns, oldest→newest), inner = 7 days (Mon→Sun).
  - `missionProgress(m: Mission): { delivered: number; total: number; pct: number }`
  - `topDeliveredStations(missions: Mission[], limit?: number): TopEntry[]`
  - `topDeliveredMaterials(missions: Mission[], limit?: number): TopEntry[]`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/stats.test.ts`:
```ts
import { test, expect } from 'vitest';
import { computeKpis, buildContributionGrid, missionProgress, topDeliveredStations, topDeliveredMaterials } from './stats';
import type { Mission, CargoLine } from '../types';

const cargo = (over: Partial<CargoLine>): CargoLine => ({
  res: 'Titanium', scu: 100, origin: 'A', originPlanet: 'P', dest: 'B', planet: 'Q', status: 'PENDING', ...over,
});
const mission = (over: Partial<Mission>): Mission => ({
  id: Math.floor(Math.random() * 1e9), cargos: [], createdAt: '2026-01-01T00:00:00.000Z', completedAt: null, ...over,
});

test('computeKpis counts in-progress, completed, delivered SCU and delivered cargo', () => {
  const missions = [
    mission({ cargos: [cargo({ scu: 120, status: 'DELIVERED' }), cargo({ scu: 80, status: 'LOADED' })] }), // active
    mission({ completedAt: '2026-06-01T10:00:00.000Z', cargos: [cargo({ scu: 60, status: 'DELIVERED' }), cargo({ scu: 40, status: 'DELIVERED' })] }),
  ];
  const k = computeKpis(missions);
  expect(k.inProgress).toBe(1);
  expect(k.completed).toBe(1);
  expect(k.scuDelivered).toBe(120 + 60 + 40); // LOADED not counted
  expect(k.cargosDelivered).toBe(3);
});

test('missionProgress returns delivered/total and pct', () => {
  const m = mission({ cargos: [cargo({ status: 'DELIVERED' }), cargo({ status: 'LOADED' }), cargo({ status: 'PENDING' }), cargo({ status: 'DELIVERED' })] });
  expect(missionProgress(m)).toEqual({ delivered: 2, total: 4, pct: 50 });
  expect(missionProgress(mission({ cargos: [] }))).toEqual({ delivered: 0, total: 0, pct: 0 });
});

test('buildContributionGrid is 13 columns x 7 days and counts completions per day', () => {
  const today = new Date('2026-07-05T12:00:00');
  const day = '2026-07-01T09:00:00'; // within window
  const missions = [
    mission({ completedAt: new Date(day).toISOString() }),
    mission({ completedAt: new Date(day).toISOString() }),
    mission({ completedAt: new Date('2020-01-01T00:00:00').toISOString() }), // outside window
    mission({ completedAt: null }),
  ];
  const grid = buildContributionGrid(missions, { weeks: 13, today });
  expect(grid).toHaveLength(13);
  grid.forEach((col) => expect(col).toHaveLength(7));
  const flat = grid.flat();
  const target = flat.find((c) => c.date.getFullYear() === 2026 && c.date.getMonth() === 6 && c.date.getDate() === 1)!;
  expect(target.count).toBe(2);
  expect(target.level).toBe(2);
  // no cell counts the out-of-window completion
  expect(flat.reduce((n, c) => n + c.count, 0)).toBe(2);
});

test('grid level maps counts to 0..4 with 4+ capped', () => {
  const today = new Date('2026-07-05T12:00:00');
  const d = '2026-07-02T09:00:00';
  const missions = Array.from({ length: 6 }, () => mission({ completedAt: new Date(d).toISOString() }));
  const cell = buildContributionGrid(missions, { weeks: 13, today }).flat()
    .find((c) => c.date.getMonth() === 6 && c.date.getDate() === 2)!;
  expect(cell.count).toBe(6);
  expect(cell.level).toBe(4);
});

test('topDeliveredStations aggregates delivered SCU by dest, sorted, limited', () => {
  const missions = [
    mission({ cargos: [cargo({ dest: 'Tressler', scu: 100, status: 'DELIVERED' }), cargo({ dest: 'Babbage', scu: 50, status: 'DELIVERED' })] }),
    mission({ cargos: [cargo({ dest: 'Tressler', scu: 20, status: 'DELIVERED' }), cargo({ dest: 'Babbage', scu: 5, status: 'LOADED' })] }),
  ];
  expect(topDeliveredStations(missions, 5)).toEqual([
    { name: 'Tressler', scu: 120 },
    { name: 'Babbage', scu: 50 },
  ]);
});

test('topDeliveredMaterials aggregates delivered SCU by res, limited', () => {
  const missions = [mission({ cargos: [
    cargo({ res: 'Titanium', scu: 100, status: 'DELIVERED' }),
    cargo({ res: 'Aluminium', scu: 40, status: 'DELIVERED' }),
    cargo({ res: 'Titanium', scu: 30, status: 'DELIVERED' }),
    cargo({ res: 'Quantanium', scu: 999, status: 'PENDING' }),
  ] })];
  expect(topDeliveredMaterials(missions, 1)).toEqual([{ name: 'Titanium', scu: 130 }]);
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run in `frontend/`: `npm test`
Expected: FAIL — `stats.ts` not found / exports undefined.

- [ ] **Step 3: Implement `stats.ts`**

Create `frontend/src/lib/stats.ts`:
```ts
import type { Mission } from '../types';

export interface DayCell { date: Date; count: number; level: 0 | 1 | 2 | 3 | 4 }
export interface Kpis { inProgress: number; completed: number; scuDelivered: number; cargosDelivered: number }
export interface TopEntry { name: string; scu: number }

const isDelivered = (status: string) => status === 'DELIVERED';

export function computeKpis(missions: Mission[]): Kpis {
  let inProgress = 0, completed = 0, scuDelivered = 0, cargosDelivered = 0;
  for (const m of missions) {
    if (m.completedAt) completed++; else inProgress++;
    for (const c of m.cargos) {
      if (isDelivered(c.status)) { scuDelivered += c.scu; cargosDelivered++; }
    }
  }
  return { inProgress, completed, scuDelivered, cargosDelivered };
}

export function missionProgress(m: Mission): { delivered: number; total: number; pct: number } {
  const total = m.cargos.length;
  const delivered = m.cargos.filter((c) => isDelivered(c.status)).length;
  const pct = total === 0 ? 0 : Math.round((delivered / total) * 100);
  return { delivered, total, pct };
}

function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count >= 4) return 4;
  return count as 1 | 2 | 3;
}

// Local midnight, then key by Y-M-D so completions are bucketed per local day.
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function dayKey(d: Date): string { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
// Monday-based start of the ISO week containing d.
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const dow = (s.getDay() + 6) % 7; // Mon=0 … Sun=6
  s.setDate(s.getDate() - dow);
  return s;
}

export function buildContributionGrid(
  missions: Mission[],
  opts: { weeks?: number; today?: Date } = {}
): DayCell[][] {
  const weeks = opts.weeks ?? 13;
  const today = opts.today ?? new Date();

  // Count completions per local day.
  const counts = new Map<string, number>();
  for (const m of missions) {
    if (!m.completedAt) continue;
    const k = dayKey(new Date(m.completedAt));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const firstMonday = startOfWeek(today);
  firstMonday.setDate(firstMonday.getDate() - (weeks - 1) * 7); // oldest week's Monday

  const grid: DayCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + w * 7 + d);
      const count = counts.get(dayKey(date)) ?? 0;
      col.push({ date, count, level: levelFor(count) });
    }
    grid.push(col);
  }
  return grid;
}

function topDelivered(missions: Mission[], key: 'dest' | 'res', limit: number): TopEntry[] {
  const totals = new Map<string, number>();
  for (const m of missions) {
    for (const c of m.cargos) {
      if (!isDelivered(c.status)) continue;
      const name = c[key];
      totals.set(name, (totals.get(name) ?? 0) + c.scu);
    }
  }
  return [...totals.entries()]
    .map(([name, scu]) => ({ name, scu }))
    .sort((a, b) => b.scu - a.scu)
    .slice(0, limit);
}

export function topDeliveredStations(missions: Mission[], limit = 5): TopEntry[] {
  return topDelivered(missions, 'dest', limit);
}
export function topDeliveredMaterials(missions: Mission[], limit = 5): TopEntry[] {
  return topDelivered(missions, 'res', limit);
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test`
Expected: all pass (the pre-existing `route.test.ts` too — full suite green).

- [ ] **Step 5: Commit**
```bash
git add frontend/src/lib/stats.ts frontend/src/lib/stats.test.ts
git commit -m "feat(stats): dashboard aggregation module with tests"
```

---

## Task 2: Dashboard components + CSS

**Files:**
- Create: `frontend/src/components/dashboard/KpiTiles.tsx`, `ContributionGrid.tsx`, `InProgressList.tsx`, `TopBreakdown.tsx`
- Modify: `frontend/src/styles/cargo-terminal.css`

**Interfaces:**
- Consumes: `stats.ts` exports (Task 1), `Mission` type, `useMissionStore`.
- Produces:
  - `KpiTiles({ missions }: { missions: Mission[] })`
  - `ContributionGrid({ missions }: { missions: Mission[] })`
  - `InProgressList({ missions }: { missions: Mission[] })`
  - `TopBreakdown({ missions }: { missions: Mission[] })`

- [ ] **Step 1: Implement `KpiTiles.tsx`**
```tsx
import React from 'react';
import type { Mission } from '../../types';
import { computeKpis } from '../../lib/stats';

export const KpiTiles: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const k = computeKpis(missions);
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  return (
    <div className="ct-kpis">
      <div className="ct-kpi"><div className="v">{k.inProgress}</div><div className="l">En cours</div></div>
      <div className="ct-kpi green"><div className="v">{k.completed}</div><div className="l">Terminées</div></div>
      <div className="ct-kpi blue"><div className="v">{fmt(k.scuDelivered)}</div><div className="l">SCU livré</div></div>
      <div className="ct-kpi blue"><div className="v">{fmt(k.cargosDelivered)}</div><div className="l">Cargaisons</div></div>
    </div>
  );
};
```

- [ ] **Step 2: Implement `ContributionGrid.tsx`**
```tsx
import React from 'react';
import type { Mission } from '../../types';
import { buildContributionGrid } from '../../lib/stats';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const ContributionGrid: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const grid = buildContributionGrid(missions);
  // Month labels: show the month of each column's first day when it changes.
  const labels = grid.map((col, i) => {
    const m = col[0].date.getMonth();
    const prev = i > 0 ? grid[i - 1][0].date.getMonth() : -1;
    return m !== prev ? MONTHS[m] : '';
  });
  return (
    <div className="ct-grid-wrap">
      <div className="ct-grid-months">
        {labels.map((lbl, i) => <span key={i}>{lbl}</span>)}
      </div>
      <div className="ct-grid">
        {grid.map((col, w) => (
          <div key={w} className="ct-col">
            {col.map((cell, d) => (
              <div
                key={d}
                className={`ct-cell${cell.level ? ' l' + cell.level : ''}`}
                title={`${cell.count} contrat${cell.count > 1 ? 's' : ''} · ${cell.date.toLocaleDateString('fr-FR')}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="ct-grid-legend">
        Moins
        <span className="ct-cell" /><span className="ct-cell l1" /><span className="ct-cell l2" /><span className="ct-cell l3" /><span className="ct-cell l4" />
        Plus
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Implement `InProgressList.tsx`**
```tsx
import React from 'react';
import type { Mission } from '../../types';
import { missionProgress } from '../../lib/stats';

function routeLabel(m: Mission): string {
  const origins = [...new Set(m.cargos.map((c) => c.origin))];
  const dests = [...new Set(m.cargos.map((c) => c.dest))];
  const side = (arr: string[]) => (arr.length <= 1 ? arr[0] ?? '—' : `${arr[0]} +${arr.length - 1}`);
  return `${side(origins)} → ${side(dests)}`;
}

export const InProgressList: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const active = missions.filter((m) => !m.completedAt);
  return (
    <div className="ct-card">
      <div className="ct-dash-sec">En cours</div>
      {active.length === 0 ? (
        <div className="ct-dash-empty">Aucune mission en cours.</div>
      ) : (
        <div className="ct-ip">
          {active.map((m) => {
            const p = missionProgress(m);
            return (
              <div key={m.id} className="ct-ip-row">
                <div className="ct-ip-head"><span>{routeLabel(m)}</span><span className="r">{p.delivered}/{p.total}</span></div>
                <div className="ct-ip-bar"><i style={{ width: `${p.pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Implement `TopBreakdown.tsx`**
```tsx
import React from 'react';
import type { Mission } from '../../types';
import { topDeliveredStations, topDeliveredMaterials, type TopEntry } from '../../lib/stats';

const Group: React.FC<{ title: string; entries: TopEntry[] }> = ({ title, entries }) => (
  <div className="ct-top-grp">
    <div className="th">{title}</div>
    {entries.length === 0 ? (
      <div className="ct-dash-empty">—</div>
    ) : entries.map((e, i) => (
      <div key={e.name} className="ct-top-row">
        <span className="rk">{i + 1}</span><span className="nm">{e.name}</span>
        <span className="val">{e.scu.toLocaleString('fr-FR')}</span>
      </div>
    ))}
  </div>
);

export const TopBreakdown: React.FC<{ missions: Mission[] }> = ({ missions }) => (
  <div className="ct-card">
    <div className="ct-dash-sec">Top — par SCU livré</div>
    <Group title="Stations de livraison" entries={topDeliveredStations(missions, 5)} />
    <Group title="Matières" entries={topDeliveredMaterials(missions, 5)} />
  </div>
);
```

- [ ] **Step 5: Add CSS** — append to `frontend/src/styles/cargo-terminal.css`, porting the mockup `.superpowers/brainstorm/81833-1783204350/content/dashboard-v3.html`:
```css
/* ── Dashboard ─────────────────────────────────────────── */
.ct-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;}
.ct-kpi{background:var(--panel);border:1px solid var(--edge);border-left:3px solid var(--amber);padding:12px 14px;}
.ct-kpi.blue{border-left-color:var(--steel);}
.ct-kpi.green{border-left-color:var(--ok);}
.ct-kpi .v{font-family:var(--font-mono);font-weight:800;font-size:22px;line-height:1;}
.ct-kpi .l{font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;margin-top:7px;}
.ct-dash-sec{font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--faint);text-transform:uppercase;margin:6px 0 10px;}
.ct-grid-wrap{background:var(--panel);border:1px solid var(--edge);padding:14px;margin-bottom:18px;}
.ct-grid-months{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:9px;color:var(--faint);margin-bottom:6px;padding:0 1px;}
.ct-grid{display:grid;grid-template-columns:repeat(13,1fr);gap:4px;}
.ct-col{display:grid;grid-template-rows:repeat(7,26px);gap:4px;}
.ct-cell{width:100%;height:26px;background:var(--panel-2);border-radius:3px;}
.ct-cell.l1{background:#4a3a1a;}
.ct-cell.l2{background:#8a6420;}
.ct-cell.l3{background:#c78a2a;}
.ct-cell.l4{background:var(--amber);}
.ct-grid-legend{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:10px;font-family:var(--font-mono);font-size:9px;color:var(--faint);}
.ct-grid-legend .ct-cell{width:16px;height:12px;}
.ct-dash-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ct-card{background:var(--panel);border:1px solid var(--edge);padding:12px 14px;}
.ct-ip{display:flex;flex-direction:column;gap:11px;}
.ct-ip-head{display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:12px;margin-bottom:5px;}
.ct-ip-head .r{color:var(--dim);}
.ct-ip-bar{height:6px;background:var(--panel-2);border-radius:3px;overflow:hidden;}
.ct-ip-bar i{display:block;height:100%;background:var(--ok);}
.ct-top-grp{margin-bottom:6px;}
.ct-top-grp .th{font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;margin-bottom:3px;}
.ct-top-row{display:flex;align-items:center;gap:10px;padding:5px 0;font-family:var(--font-mono);font-size:12px;}
.ct-top-row .rk{color:var(--faint);width:14px;}
.ct-top-row .nm{flex:1;}
.ct-top-row .val{color:var(--amber);}
.ct-dash-empty{font-family:var(--font-mono);font-size:11px;color:var(--faint);padding:4px 0;}
@media (max-width:640px){.ct-kpis{grid-template-columns:repeat(2,1fr);}.ct-dash-two{grid-template-columns:1fr;}}
```

- [ ] **Step 6: Verify build**

Run in `frontend/`: `npx tsc -b --noEmit` — the 4 new component files must be clean (`Dashboard.tsx` doesn't exist yet, so no import of these breaks the build). `npm run build` may still fail only if something imports a not-yet-created file; these components import only `stats.ts` + types, so they compile standalone.

- [ ] **Step 7: Commit**
```bash
git add frontend/src/components/dashboard frontend/src/styles/cargo-terminal.css
git commit -m "feat(ui): dashboard blocks (KPI, grid, in-progress, top) + styles"
```

---

## Task 3: Dashboard page + nav + remove Journal

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/components/layout/NavBar.tsx`
- Delete: `frontend/src/pages/History.tsx`

**Interfaces:**
- Consumes: the four dashboard components (Task 2), `useMissionStore`.

- [ ] **Step 1: Implement `Dashboard.tsx`**
```tsx
import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { KpiTiles } from '../components/dashboard/KpiTiles';
import { ContributionGrid } from '../components/dashboard/ContributionGrid';
import { InProgressList } from '../components/dashboard/InProgressList';
import { TopBreakdown } from '../components/dashboard/TopBreakdown';

export const Dashboard: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  return (
    <div className="ct-page">
      <div className="ct-content">
        <KpiTiles missions={missions} />
        <div className="ct-dash-sec">Activité — contrats terminés / jour · 13 dernières semaines</div>
        <ContributionGrid missions={missions} />
        <div className="ct-dash-two">
          <InProgressList missions={missions} />
          <TopBreakdown missions={missions} />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Wire the route in `App.tsx`**

In `frontend/src/App.tsx`: replace the `History` import with `import { Dashboard } from './pages/Dashboard';` and replace the `<Route path="/history" element={<History />} />` line with `<Route path="/dashboard" element={<Dashboard />} />`. Leave `/` → `/operations` unchanged.

- [ ] **Step 3: Update the nav in `NavBar.tsx`**

In `frontend/src/components/layout/NavBar.tsx`, change the Journal nav item to Dashboard: the `NavLink` currently pointing to `/history` with label `Journal` becomes `to="/dashboard"` with label `Dashboard`. Keep the same `.ct-*` classes/active handling. (Read the file first to match its exact NavLink structure.)

- [ ] **Step 4: Delete the Journal page**
```bash
git rm frontend/src/pages/History.tsx
```

- [ ] **Step 5: Verify**

Run in `frontend/`: `npx tsc -b --noEmit` (expect clean — no remaining import of `History`), then `npm run build` (expect success).

- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/App.tsx frontend/src/components/layout/NavBar.tsx
git commit -m "feat(ui): add Dashboard page, replace Journal in nav"
```

---

## Task 4: Inline completed missions on the Missions page

**Files:**
- Modify: `frontend/src/pages/Missions.tsx`
- Modify: `frontend/src/styles/cargo-terminal.css`

- [ ] **Step 1: Show completed missions greyed/struck**

In `frontend/src/pages/Missions.tsx`:
- Keep the existing active list (`missions.filter((m) => !m.completedAt)`), rendered as-is.
- After it, add a **Terminées** section rendered only when `missions.some((m) => m.completedAt)`:
  - a `<div className="ct-dash-sec">Terminées</div>` header,
  - the completed missions (`missions.filter((m) => m.completedAt)`) rendered with the SAME mission-card markup as the active list, but with the extra class `done` on the card root (e.g. `className={\`ct-mission-card done\`}`), keeping the Copier and Supprimer actions.
  Read the current active-list card markup and reuse it verbatim (extract a small inline helper or map function if it reduces duplication, but do not change the active rendering).
- The capacity gauge at the top is unchanged (still only active LOADED cargo).

- [ ] **Step 2: Add the `.done` style**

Append to `frontend/src/styles/cargo-terminal.css`:
```css
.ct-mission-card.done{opacity:.5;}
.ct-mission-card.done .ct-mission-route,
.ct-mission-card.done .ct-mission-title{text-decoration:line-through;}
```
(If the mission card's route/title element uses a different class name, target that class instead — read the card markup and match the actual title element so the strike-through lands on the route label.)

- [ ] **Step 3: Verify build + run**

Run `npm run build` (expect success). Then launch the app (backend running via docker `docker compose up -d`, front `npm run dev`) and confirm on Missions: active missions render normally, completed missions appear below, greyed and struck-through, and completing all cargo of a mission moves it from the active list into the Terminées section.

- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/Missions.tsx frontend/src/styles/cargo-terminal.css
git commit -m "feat(ui): show completed missions greyed/struck on Missions page"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full checks**

Run in `frontend/`: `npx tsc -b --noEmit` (clean), `npm run build` (success), `npm test` (route + stats suites pass).

- [ ] **Step 2: No dangling Journal/History references**
```bash
grep -rn "History\|/history\|Journal" frontend/src
```
Expected: no matches (except unrelated words). Remove any remnant.

- [ ] **Step 3: End-to-end run**

With the docker stack up (`docker compose up -d`), open http://localhost:3005: Dashboard shows KPIs, the full-width 13-week grid, in-progress list, and top breakdowns; nav shows Dashboard not Journal; Missions page shows completed missions greyed/struck.

- [ ] **Step 4: Commit any cleanup**
```bash
git add -A && git commit -m "chore: dashboard follow-up cleanup" || echo "nothing to clean"
```

---

## Self-Review Notes

- **Spec coverage:** remove Journal (Task 3), inline completed missions (Task 4), Dashboard KPIs/grid/in-progress/top (Tasks 2–3), pure stats module + tests (Task 1), CSS from mockup (Tasks 2 & 4). All spec sections mapped.
- **Type consistency:** `DayCell`/`Kpis`/`TopEntry` and all function names match between Task 1 (definitions) and Task 2 (consumers). `missionProgress` returns `{delivered,total,pct}` used identically in `InProgressList`.
- **Defaults (spec §8):** Route stays landing (Task 3 leaves `/`→`/operations`); grid 13 weeks completed-missions/day full width; top by delivered SCU; completed missions dimmed + struck.
