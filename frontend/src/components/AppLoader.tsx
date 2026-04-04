import { useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useListsStore } from '../store/useListsStore';
import { useFinanceStore } from '../store/useFinanceStore';

/**
 * Fetches all remote data once on mount (after authentication).
 * Renders nothing — just a side-effect component.
 */
export function AppLoader() {
  const initialized = useRef(false);

  const fetchMissions = useMissionStore((s) => s.fetch);
  const fetchLists = useListsStore((s) => s.fetch);
  const fetchFinance = useFinanceStore((s) => s.fetch);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchLists();
    fetchMissions();
    fetchFinance();
  }, [fetchLists, fetchMissions, fetchFinance]);

  return null;
}
