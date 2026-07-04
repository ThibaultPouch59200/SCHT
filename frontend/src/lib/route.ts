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
