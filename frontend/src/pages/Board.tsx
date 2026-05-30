import { useMemo, useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import type { Contract } from '../types';

type Filter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface Props {
  onOpen: (id: number) => void;
  onExecute: (id: number) => void;
}

const contractSCU = (c: Contract) =>
  c.stops.filter((s) => s.type === 'PICKUP').reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty, 0), 0);

const badgeClass = (status: string) => {
  if (status === 'PENDING') return 'badge--pending';
  if (status === 'IN_PROGRESS') return 'badge--progress';
  return 'badge--done';
};

const FILTERS: Filter[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

export function Board({ onOpen, onExecute }: Props) {
  const { contracts, createContract } = useContractStore();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return contracts;
    return contracts.filter((c) => c.status === filter);
  }, [contracts, filter]);

  const handleCreate = async () => {
    const c = await createContract();
    onOpen(c.id);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">CONTRACT BOARD</div>
          <h1 className="page-head__title">Contracts</h1>
        </div>
        <div className="page-head__actions">
          <div className="toggle" role="tablist">
            {FILTERS.map((f) => (
              <button key={f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button className="btn btn--cyan" onClick={handleCreate}>
            <span>+</span> NEW CONTRACT
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel__hd">
          <div className="left">
            <span>{filtered.length} CONTRACTS</span>
          </div>
          <div className="right">
            <span className="legend" style={{ gap: 14 }}>
              <span><i></i> PICKUP</span>
              <span><i className="cy"></i> DELIVERY</span>
            </span>
          </div>
        </div>
        <div className="panel__bd panel__bd--flush">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>ID</th>
                <th>Contract</th>
                <th style={{ width: 140 }}>Status</th>
                <th className="num" style={{ width: 100 }}>SCU</th>
                <th className="num" style={{ width: 80 }}>Stops</th>
                <th className="num" style={{ width: 140 }}>Payout</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className={selectedId === c.id ? 'is-selected' : ''}
                  onClick={() => setSelectedId(c.id)}
                  onDoubleClick={() => onOpen(c.id)}
                >
                  <td className="mono-id">SCHT-{String(c.id).padStart(4, '0')}</td>
                  <td>
                    <span className="am">{c.name}</span>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{c.client || '—'}</div>
                  </td>
                  <td>
                    <span className={'badge ' + badgeClass(c.status)}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="num am">{contractSCU(c).toLocaleString()}</td>
                  <td className="num muted">{c.stops.length}</td>
                  <td className="num am">
                    {c.payout.toLocaleString()}
                    <span className="muted" style={{ fontSize: 10, marginLeft: 4 }}>aUEC</span>
                  </td>
                  <td>
                    {c.status !== 'COMPLETED' ? (
                      <button
                        className="btn btn--xs btn--cyan"
                        onClick={(e) => { e.stopPropagation(); onExecute(c.id); }}
                      >
                        EXECUTE ▸
                      </button>
                    ) : (
                      <button
                        className="btn btn--xs btn--ghost"
                        onClick={(e) => { e.stopPropagation(); onOpen(c.id); }}
                      >
                        REVIEW
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                    // NO CONTRACTS FOUND
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="muted" style={{ marginTop: 12, fontSize: 11, letterSpacing: '0.18em' }}>
        DOUBLE-CLICK A ROW TO EDIT · EXECUTE TO RUN THE ROUTE
      </div>
    </div>
  );
}
