import { create } from 'zustand';
import { api } from '../lib/api';

export interface LocationEntry {
  name: string;
  planet: string;
  system: string;
}

interface ListsStore {
  locations: LocationEntry[];
  resources: string[];
  loading: boolean;
  fetch: () => Promise<void>;
  addLocation: (entry: LocationEntry) => void;
  removeLocation: (name: string) => void;
  addResource: (name: string) => void;
  removeResource: (name: string) => void;
}

export const useListsStore = create<ListsStore>((set) => ({
  locations: [],
  resources: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    const [locs, ress] = await Promise.all([api.locations.list(), api.resources.list()]);
    set({
      locations: locs.map((l) => ({ name: l.name, planet: l.planet, system: l.system })),
      resources: ress.map((r) => r.name),
      loading: false,
    });
  },

  addLocation: (entry) =>
    set((s) => ({
      locations: s.locations.some((l) => l.name === entry.name)
        ? s.locations
        : [...s.locations, entry],
    })),

  removeLocation: (name) =>
    set((s) => ({
      locations: s.locations.filter((l) => l.name !== name),
    })),

  addResource: (name) =>
    set((s) => ({
      resources: s.resources.includes(name) ? s.resources : [...s.resources, name],
    })),

  removeResource: (name) =>
    set((s) => ({ resources: s.resources.filter((r) => r !== name) })),
}));
