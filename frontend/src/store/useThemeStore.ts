import { create } from 'zustand';

interface ThemeStore {
  theme: 'dark';
}

export const useThemeStore = create<ThemeStore>()(() => ({ theme: 'dark' as const }));
