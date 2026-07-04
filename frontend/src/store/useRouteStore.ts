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
