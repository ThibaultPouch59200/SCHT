const BASE = import.meta.env.VITE_API_URL ?? '';

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
    me: () =>
      request<{
        id: number;
        username: string;
        selectedShip?: { id: number; name: string; manufacturer: string; scu: number; category: string } | null;
      }>('/api/auth/me'),
  },

  // ── Locations ─────────────────────────────────────────────────────────
  locations: {
    list: () =>
      request<{ id: number; name: string; planet: string; system: string }[]>(
        '/api/locations'
      ),
    create: (data: { name: string; planet: string; system: string }) =>
      request<{ id: number; name: string; planet: string; system: string }>(
        '/api/locations',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    remove: (name: string, system: string) =>
      request<{ ok: boolean }>(
        `/api/locations?name=${encodeURIComponent(name)}&system=${encodeURIComponent(system)}`,
        { method: 'DELETE' }
      ),
  },

  // ── Resources ─────────────────────────────────────────────────────────
  resources: {
    list: () => request<{ id: number; name: string }[]>('/api/resources'),
    create: (name: string) =>
      request<{ id: number; name: string }>('/api/resources', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    remove: (name: string) =>
      request<{ ok: boolean }>(`/api/resources/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      }),
  },

  // ── Missions ──────────────────────────────────────────────────────────
  missions: {
    list: () => request<SerializedMission[]>('/api/missions'),
    create: (data: { cargos: { res: string; scu: number; origin: string; dest: string }[] }) =>
      request<SerializedMission>('/api/missions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/missions/${id}`, { method: 'DELETE' }),
    setStatus: (missionId: number, cargoId: number, status: 'PENDING' | 'LOADED' | 'DELIVERED') =>
      request<SerializedMission>(`/api/missions/${missionId}/cargo/${cargoId}/status`,
        { method: 'PATCH', body: JSON.stringify({ status }) }),
    confirmStation: (missionId: number, station: string, op: 'load' | 'drop') =>
      request<SerializedMission>(
        `/api/missions/${missionId}/stations/${encodeURIComponent(station)}/confirm?op=${op}`,
        { method: 'POST' }),
    copy: (id: number) =>
      request<SerializedMission>(`/api/missions/${id}/copy`, { method: 'POST' }),
  },

  // ── Ships ─────────────────────────────────────────────────────────────
  ships: {
    list: () =>
      request<{ id: number; name: string; manufacturer: string; scu: number; category: string }[]>(
        '/api/ships'
      ),
    selectShip: (shipId: number) =>
      request<{ selectedShip: { id: number; name: string; manufacturer: string; scu: number; category: string } | null }>(
        '/api/auth/me/ship',
        { method: 'PUT', body: JSON.stringify({ shipId }) }
      ),
  },

};

// ── Shared types (mirror backend serialization) ──────────────────────────────

export interface SerializedMission {
  id: number;
  createdAt: string;
  completedAt: string | null;
  cargos: {
    id: number; res: string; scu: number;
    origin: string; originPlanet: string;
    dest: string; planet: string;
    status: 'PENDING' | 'LOADED' | 'DELIVERED';
  }[];
}
