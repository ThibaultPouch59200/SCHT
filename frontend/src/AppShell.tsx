import { useState, useEffect } from 'react';
import { Board } from './pages/Board';
import { Setup } from './pages/Setup';
import { Execute } from './pages/Execute';
import { FleetDrawer } from './components/fleet/FleetDrawer';
import { useContractStore } from './store/useContractStore';

type View = 'BOARD' | 'SETUP' | 'EXEC';

export function AppShell() {
  const [view, setView] = useState<View>('BOARD');
  const [activeContractId, setActiveContractId] = useState<number | null>(null);
  const [fleetOpen, setFleetOpen] = useState(false);
  const { loadContracts } = useContractStore();

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fleetOpen) setFleetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fleetOpen]);

  const openSetup = (id: number) => {
    setActiveContractId(id);
    setView('SETUP');
  };

  const openExec = (id: number) => {
    setActiveContractId(id);
    setView('EXEC');
  };

  const navItems: { id: View; label: string }[] = [
    { id: 'BOARD', label: 'BOARD' },
    { id: 'SETUP', label: 'SETUP' },
    { id: 'EXEC', label: 'EXECUTE' },
  ];

  return (
    <div className="app-shell">
      <header className="chrome-top">
        <div className="chrome-top__bar">
          <div className="brand">
            <div className="brand__mark" />
            <div>
              <div className="brand__name">SCHT</div>
              <div className="brand__sub">HAULING OPS</div>
            </div>
          </div>

          <nav className="chrome-nav">
            {navItems.map((n) => (
              <button
                key={n.id}
                className={'nav-btn ' + (view === n.id ? 'is-active' : '')}
                onClick={() => setView(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="chrome-top__status">
            <button className="btn btn--sm btn--ghost" onClick={() => setFleetOpen(true)}>
              FLEET ROSTER
            </button>
          </div>
        </div>
      </header>

      <main className="workspace">
        {view === 'BOARD' && <Board onOpen={openSetup} onExecute={openExec} />}
        {view === 'SETUP' && (
          <Setup
            contractId={activeContractId}
            onBack={() => setView('BOARD')}
            onExecute={openExec}
          />
        )}
        {view === 'EXEC' && activeContractId !== null && (
          <Execute contractId={activeContractId} onBack={() => setView('BOARD')} />
        )}
      </main>

      {fleetOpen && <FleetDrawer onClose={() => setFleetOpen(false)} />}
    </div>
  );
}
