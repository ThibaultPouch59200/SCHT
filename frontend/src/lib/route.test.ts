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
  // Auto sort would put Hurston/AAA before microTech/ZZZ; manual order reverses it.
  // Keys are normalized lowercase: `${planet}|${station}`.
  const stops = buildRoute([mission(1, [mk({ origin: 'AAA', originPlanet: 'Hurston', dest: 'ZZZ', planet: 'microTech' })])], {
    autoOrder: false, manualOrder: ['microtech|zzz', 'hurston|aaa'],
  });
  expect(stops.map((s) => s.key)).toEqual(['microtech|zzz', 'hurston|aaa']);
});
