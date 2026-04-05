import { useState, useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL ?? '';

export type BackendStatus = 'online' | 'offline' | 'checking';

export function useBackendStatus(intervalMs = 30_000): BackendStatus {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${BASE}/api/health`, { method: 'GET' });
        if (!cancelled) setStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setStatus('offline');
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return status;
}
