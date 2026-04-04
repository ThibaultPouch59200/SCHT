const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  return localStorage.getItem('scht-token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; username: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string) =>
      request<{ token: string; username: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<{ id: number; username: string }>('/api/auth/me'),
  },

  // ── Locations ─────────────────────────────────────────────────────────
  locations: {
    list: () =>
      request<{ id: number; name: string; planet: string; system: string }[]>(
        '/api/locations'
      ),
  },

  // ── Resources ─────────────────────────────────────────────────────────
  resources: {
    list: () => request<{ id: number; name: string }[]>('/api/resources'),
  },

  // ── Missions ──────────────────────────────────────────────────────────
  missions: {
    list: () => request<SerializedMission[]>('/api/missions'),

    create: (data: {
      origin: string;
      system: string;
      pay: number;
      cargos: { res: string; scu: number; dest: string; planet: string }[];
    }) =>
      request<SerializedMission>('/api/missions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/missions/${id}`, { method: 'DELETE' }),

    setDelivered: (missionId: number, cargoId: number, amount: number) =>
      request<SerializedMission>(
        `/api/missions/${missionId}/cargo/${cargoId}/delivered`,
        { method: 'PATCH', body: JSON.stringify({ amount }) }
      ),

    confirmStation: (missionId: number, stationName: string) =>
      request<SerializedMission>(
        `/api/missions/${missionId}/stations/${encodeURIComponent(stationName)}/confirm`,
        { method: 'POST' }
      ),

    copy: (id: number) =>
      request<SerializedMission>(`/api/missions/${id}/copy`, { method: 'POST' }),
  },

  // ── Finance ───────────────────────────────────────────────────────────
  finance: {
    get: () =>
      request<{ wallet: number; transactions: SerializedTransaction[] }>(
        '/api/finance'
      ),
    setWallet: (amount: number) =>
      request<{ wallet: number; transactions: SerializedTransaction[] }>(
        '/api/finance/wallet',
        { method: 'PUT', body: JSON.stringify({ amount }) }
      ),
    addTransaction: (data: {
      amount: number;
      desc: string;
      type: string;
      missionId?: number;
    }) =>
      request<SerializedTransaction>('/api/finance/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteTransaction: (id: number) =>
      request<{ ok: boolean }>(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
      }),
  },
};

// ── Shared types (mirror backend serialization) ──────────────────────────────

export interface SerializedCargoLine {
  id: number;
  res: string;
  scu: number;
  dest: string;
  planet: string;
  delivered: number;
  confirmed: boolean;
}

export interface SerializedMission {
  id: number;
  origin: string;
  system: string;
  pay: number;
  createdAt: string;
  completedAt: string | null;
  cargos: SerializedCargoLine[];
}

export interface SerializedTransaction {
  id: number;
  date: string;
  desc: string;
  amount: number;
  type: string;
  missionId?: number | null;
}
