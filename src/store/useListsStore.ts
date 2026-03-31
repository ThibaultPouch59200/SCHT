import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationEntry {
  name: string;
  planet: string;
  system: string;
}

interface ListsStore {
  locations: LocationEntry[];
  resources: string[];
  addLocation: (entry: LocationEntry) => void;
  removeLocation: (name: string) => void;
  addResource: (name: string) => void;
  removeResource: (name: string) => void;
}

export const useListsStore = create<ListsStore>()(
  persist(
    (set) => ({
      locations: [],
      resources: [],

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
    }),
    { name: 'scht-lists' }
  )
);
