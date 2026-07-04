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
