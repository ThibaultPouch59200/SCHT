import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission } from '../types';
import { useFinanceStore } from './useFinanceStore';

interface PersistedState {
  missions: Mission[];
  delivered: Record<string, number>;
  completedIds: number[];
  nextId: number;
  sysFilter: string;
}

interface MissionStore extends PersistedState {
  addMission: (m: Omit<Mission, 'id' | 'createdAt'>) => Mission;
  deleteMission: (id: number) => void;
  setDeliveredAmount: (stationKey: string, res: string, amount: number) => void;
  confirmStation: (stationKey: string, resources: Record<string, number>) => void;
  setSysFilter: (sys: string) => void;
  markCompleted: (id: number) => void;
  isCompleted: (id: number) => boolean;
}

// Backward compat: old persisted data may have boolean values
function coerceDelivered(val: unknown, scu: number): number {
  if (val === true) return scu;
  if (!val) return 0;
  return val as number;
}

function checkAndCompleteAll(
  missions: Mission[],
  completedIds: number[],
  delivered: Record<string, number>
): number[] {
  const newCompletedIds = [...completedIds];
  missions.forEach((m) => {
    if (newCompletedIds.includes(m.id)) return;
    const done = m.cargos.every((c) => {
      const stationKey = `${m.system}|${c.planet}|${c.dest}`;
      const key = `${stationKey}|${c.res}`;
      return coerceDelivered(delivered[key], c.scu) >= c.scu;
    });
    if (done) {
      newCompletedIds.push(m.id);
      if (m.pay > 0) {
        useFinanceStore.getState().addMissionEarning(m);
      }
    }
  });
  return newCompletedIds;
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      missions: [],
      delivered: {},
      completedIds: [],
      nextId: 1,
      sysFilter: 'all',

      addMission: (m: Omit<Mission, 'id' | 'createdAt'>): Mission => {
        const newMission: Mission = {
          ...m,
          id: get().nextId,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          missions: [...state.missions, newMission],
          nextId: state.nextId + 1,
        }));
        return newMission;
      },

      deleteMission: (id: number) => {
        set((state) => ({
          missions: state.missions.filter((m) => m.id !== id),
          completedIds: state.completedIds.filter((cid) => cid !== id),
        }));
      },

      setDeliveredAmount: (stationKey: string, res: string, amount: number) => {
        const delivKey = `${stationKey}|${res}`;
        set((state) => {
          const newDelivered = { ...state.delivered, [delivKey]: amount };
          const newCompletedIds = checkAndCompleteAll(
            state.missions,
            state.completedIds,
            newDelivered
          );
          return { delivered: newDelivered, completedIds: newCompletedIds };
        });
      },

      confirmStation: (stationKey: string, resources: Record<string, number>) => {
        set((state) => {
          const newDelivered = { ...state.delivered };
          Object.entries(resources).forEach(([res, scu]) => {
            newDelivered[`${stationKey}|${res}`] = scu;
          });
          const newCompletedIds = checkAndCompleteAll(
            state.missions,
            state.completedIds,
            newDelivered
          );
          return { delivered: newDelivered, completedIds: newCompletedIds };
        });
      },

      setSysFilter: (sys: string) => {
        set({ sysFilter: sys });
      },

      markCompleted: (id: number) => {
        set((state) => {
          if (state.completedIds.includes(id)) return state;
          return { completedIds: [...state.completedIds, id] };
        });
      },

      isCompleted: (id: number) => {
        return get().completedIds.includes(id);
      },
    }),
    {
      name: 'scht-missions',
    }
  )
);
