import { useEffect, useRef } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useListsStore } from '../store/useListsStore';

/**
 * Fetches all remote data once on mount (after authentication).
 * Renders nothing — just a side-effect component.
 */
export function AppLoader() {
  const initialized = useRef(false);

  const fetchMissions = useMissionStore((s) => s.fetch);
  const fetchLists = useListsStore((s) => s.fetch);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchLists();
    fetchMissions();
  }, [fetchLists, fetchMissions]);

  return null;
}
