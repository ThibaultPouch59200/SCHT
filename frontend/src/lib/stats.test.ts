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
