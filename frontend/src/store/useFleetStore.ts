import { create } from 'zustand';
import type { FleetShip } from '../types';
import { api } from '../lib/api';

interface FleetStore {
  ships: FleetShip[];
  loading: boolean;
  loadShips: () => Promise<void>;
  addShip: (data: { name: string; model: string; pilot: string; scu: number }) => Promise<void>;
  removeShip: (id: number) => Promise<void>;
}

export const useFleetStore = create<FleetStore>((set) => ({
  ships: [],
  loading: false,

  loadShips: async () => {
    set({ loading: true });
    const ships = await api.ships.list();
    set({ ships, loading: false });
  },

  addShip: async (data) => {
    const ship = await api.ships.create(data);
    set((s) => ({ ships: [...s.ships, ship] }));
  },

  removeShip: async (id) => {
    await api.ships.remove(id);
    set((s) => ({ ships: s.ships.filter((sh) => sh.id !== id) }));
  },
}));
