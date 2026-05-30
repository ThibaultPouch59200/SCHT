import type { Contract, FleetShip, ContractPatch } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';

function getToken(): string | null {
  return localStorage.getItem('scht-token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
  },

  contracts: {
    list: () => request<Contract[]>('/api/contracts'),
    create: () =>
      request<Contract>('/api/contracts', { method: 'POST' }),
    get: (id: number) => request<Contract>(`/api/contracts/${id}`),
    update: (id: number, patch: ContractPatch) =>
      request<Contract>(`/api/contracts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/contracts/${id}`, { method: 'DELETE' }),
    toggleItem: (contractId: number, stopId: number, itemId: number) =>
      request<Contract>(
        `/api/contracts/${contractId}/stops/${stopId}/items/${itemId}/toggle`,
        { method: 'PATCH' }
      ),
  },

  ships: {
    list: () => request<FleetShip[]>('/api/ships'),
    create: (data: { name: string; model: string; pilot: string; scu: number }) =>
      request<FleetShip>('/api/ships', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: number) =>
      request<{ ok: boolean }>(`/api/ships/${id}`, { method: 'DELETE' }),
  },
};
