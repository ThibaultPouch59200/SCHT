import { create } from 'zustand';
import { api, ApiError } from '../lib/api';

interface AuthStore {
  token: string | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

function loadToken() {
  return localStorage.getItem('scht-token');
}
function loadUsername() {
  return localStorage.getItem('scht-username');
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: loadToken(),
  username: loadUsername(),
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { token, username: name } = await api.auth.login(username, password);
      localStorage.setItem('scht-token', token);
      localStorage.setItem('scht-username', name);
      set({ token, username: name, loading: false });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Login failed';
      set({ loading: false, error: msg });
    }
  },

  register: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const { token, username: name } = await api.auth.register(username, password);
      localStorage.setItem('scht-token', token);
      localStorage.setItem('scht-username', name);
      set({ token, username: name, loading: false });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Registration failed';
      set({ loading: false, error: msg });
    }
  },

  logout: () => {
    localStorage.removeItem('scht-token');
    localStorage.removeItem('scht-username');
    set({ token: null, username: null });
  },

  clearError: () => set({ error: null }),
}));
