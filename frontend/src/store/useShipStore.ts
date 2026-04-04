import { create } from 'zustand';
import { api } from '../lib/api';
import type { Ship } from '../types';

interface ShipStore {
  ships: Ship[];
  selectedShip: Ship | null;
  loading: boolean;
  fetchShips: () => Promise<void>;
  loadSelectedShip: () => Promise<void>;
  setSelectedShip: (ship: Ship | null) => Promise<void>;
}

export const useShipStore = create<ShipStore>((set) => ({
  ships: [],
  selectedShip: null,
  loading: false,

  fetchShips: async () => {
    set({ loading: true });
    try {
      const ships = await api.ships.list();
      set({ ships, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  loadSelectedShip: async () => {
    try {
      const me = await api.auth.me();
      set({ selectedShip: me.selectedShip ?? null });
    } catch {
      // not authenticated yet — ignore
    }
  },

  setSelectedShip: async (ship: Ship | null) => {
    const shipId = ship ? ship.id : 0;
    try {
      await api.ships.selectShip(shipId);
      set({ selectedShip: ship });
    } catch (e) {
      console.error('Failed to save ship selection', e);
    }
  },
}));
