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
  removeLocation: (name: string, system: string) => void;
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

  addLocation: (entry) => {
    const trimmedEntry = {
      name: entry.name.trim(),
      planet: entry.planet.trim(),
      system: entry.system.trim(),
    };

    if (!trimmedEntry.name || !trimmedEntry.planet || !trimmedEntry.system) return;

    set((s) => ({
      locations: s.locations.some(
        (l) => l.name === trimmedEntry.name && l.system === trimmedEntry.system
      )
        ? s.locations
        : [...s.locations, trimmedEntry],
    }));

    void api.locations.create(trimmedEntry).catch(() => {
      void useListsStore.getState().fetch();
    });
  },

  removeLocation: (name, system) => {
    const safeName = name.trim();
    const safeSystem = system.trim();
    if (!safeName || !safeSystem) return;

    const previous = useListsStore.getState().locations;

    set((s) => ({
      locations: s.locations.filter((l) => !(l.name === safeName && l.system === safeSystem)),
    }));

    void api.locations.remove(safeName, safeSystem).catch(() => {
      set({ locations: previous });
    });
  },

  addResource: (name) => {
    const safeName = name.trim();
    if (!safeName) return;

    set((s) => ({
      resources: s.resources.includes(safeName) ? s.resources : [...s.resources, safeName],
    }));

    void api.resources.create(safeName).catch(() => {
      void useListsStore.getState().fetch();
    });
  },

  removeResource: (name) => {
    const safeName = name.trim();
    if (!safeName) return;

    const previous = useListsStore.getState().resources;

    set((s) => ({ resources: s.resources.filter((r) => r !== safeName) }));

    void api.resources.remove(safeName).catch(() => {
      set({ resources: previous });
    });
  },
}));
