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

