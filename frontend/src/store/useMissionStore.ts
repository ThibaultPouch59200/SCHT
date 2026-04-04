import { create } from 'zustand';
import { api, SerializedMission } from '../lib/api';
import type { Mission, CargoLine } from '../types';
import { useFinanceStore } from './useFinanceStore';

// Convert API response to the Mission type used by the UI
function toMission(m: SerializedMission): Mission {
  return {
    id: m.id,
    origin: m.origin,
    system: m.system,
    pay: m.pay,
    createdAt: m.createdAt,
    cargos: m.cargos.map((c) => ({
      id: c.id,
      res: c.res,
      scu: c.scu,
      dest: c.dest,
      planet: c.planet,
    })),
  };
}

interface MissionStore {
  missions: Mission[];
  // cargoId keyed delivered amounts  { cargoId: amount }
  deliveredById: Record<number, number>;
  completedIds: number[];
  sysFilter: string;
  loading: boolean;

  fetch: () => Promise<void>;
  addMission: (m: Omit<Mission, 'id' | 'createdAt'>) => Promise<Mission>;
  deleteMission: (id: number) => Promise<void>;
  setDeliveredAmount: (missionId: number, cargoId: number, amount: number) => Promise<void>;
  confirmStation: (missionId: number, stationName: string) => Promise<void>;
  replayMission: (templateId: number, newCargos: CargoLine[]) => Promise<void>;
  copyMission: (id: number) => Promise<void>;
  setSysFilter: (sys: string) => void;
  isCompleted: (id: number) => boolean;
}

function applyMissionUpdate(
  state: Pick<MissionStore, 'missions' | 'deliveredById' | 'completedIds'>,
  updated: SerializedMission
): Pick<MissionStore, 'missions' | 'deliveredById' | 'completedIds'> {
  const missions = state.missions.map((m) =>
    m.id === updated.id ? toMission(updated) : m
  );
  const deliveredById = { ...state.deliveredById };
  updated.cargos.forEach((c) => { deliveredById[c.id] = c.delivered; });
  const completedIds =
    updated.completedAt && !state.completedIds.includes(updated.id)
      ? [...state.completedIds, updated.id]
      : state.completedIds;

  // Record mission earning when newly completed
  if (updated.completedAt && !state.completedIds.includes(updated.id) && updated.pay > 0) {
    useFinanceStore.getState().recordMissionEarning(updated.id, updated.origin, updated.pay);
  }

  return { missions, deliveredById, completedIds };
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  missions: [],
  deliveredById: {},
  completedIds: [],
  sysFilter: 'all',
  loading: false,

  fetch: async () => {
    set({ loading: true });
    const data = await api.missions.list();
    const missions = data.map(toMission);
    const deliveredById: Record<number, number> = {};
    data.forEach((m) => m.cargos.forEach((c) => { deliveredById[c.id] = c.delivered; }));
    const completedIds = data.filter((m) => m.completedAt).map((m) => m.id);
    set({ missions, deliveredById, completedIds, loading: false });
  },

  addMission: async (m) => {
    const data = await api.missions.create({
      origin: m.origin,
      system: m.system,
      pay: m.pay,
      cargos: m.cargos,
    });
    const newMission = toMission(data);
    const deliveredById = { ...get().deliveredById };
    data.cargos.forEach((c) => { deliveredById[c.id] = 0; });
    set((s) => ({ missions: [...s.missions, newMission], deliveredById }));
    return newMission;
  },

  deleteMission: async (id) => {
    await api.missions.delete(id);
    set((s) => ({
      missions: s.missions.filter((m) => m.id !== id),
      completedIds: s.completedIds.filter((cid) => cid !== id),
    }));
  },

  setDeliveredAmount: async (missionId, cargoId, amount) => {
    const updated = await api.missions.setDelivered(missionId, cargoId, amount);
    set((s) => applyMissionUpdate(s, updated));
  },

  confirmStation: async (missionId, stationName) => {
    const updated = await api.missions.confirmStation(missionId, stationName);
    set((s) => applyMissionUpdate(s, updated));
  },

  replayMission: async (templateId, newCargos) => {
    const source = get().missions.find((m) => m.id === templateId);
    if (!source) return;
    const data = await api.missions.create({
      origin: source.origin,
      system: source.system,
      pay: source.pay,
      cargos: newCargos,
    });
    const newMission = toMission(data);
    const deliveredById = { ...get().deliveredById };
    data.cargos.forEach((c) => { deliveredById[c.id] = 0; });
    set((s) => ({ missions: [...s.missions, newMission], deliveredById }));
  },

  copyMission: async (id) => {
    const data = await api.missions.copy(id);
    const newMission = toMission(data);
    const deliveredById = { ...get().deliveredById };
    data.cargos.forEach((c) => { deliveredById[c.id] = 0; });
    set((s) => ({ missions: [...s.missions, newMission], deliveredById }));
  },

  setSysFilter: (sys) => set({ sysFilter: sys }),

  isCompleted: (id) => get().completedIds.includes(id),
}));

