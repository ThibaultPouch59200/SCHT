import { useState, useMemo } from 'react';
import { useContractStore } from '../store/useContractStore';

interface Props {
  contractId: number;
  onBack: () => void;
}

export function Execute({ contractId, onBack }: Props) {
  const { contracts, toggleItem, saveContract } = useContractStore();
  const [activeIdx, setActiveIdx] = useState(0);

  const contract = contracts.find((c) => c.id === contractId);

  const overall = useMemo(() => {
    if (!contract) return { total: 0, done: 0, pct: 0 };
    let total = 0, done = 0;
    contract.stops.forEach((s) => s.items.forEach((i) => {
      total++;
      if (i.done) done++;
    }));
    return { total, done, pct: total ? (done / total) * 100 : 0 };
  }, [contract]);

  const remainingByStop = useMemo(() => {
    if (!contract) return [];
    return contract.stops
      .map((s) => ({ ...s, remaining: s.items.filter((i) => !i.done) }))
      .filter((s) => s.remaining.length > 0);
  }, [contract]);

  if (!contract) {
    return <div className="muted" style={{ padding: 32 }}>// CONTRACT NOT FOUND</div>;
  }

  const stops = contract.stops;

  const stopProgress = (idx: number) => {
    const s = stops[idx];
    const total = s.items.length;
    const done = s.items.filter((i) => i.done).length;
    return { total, done, pct: total ? (done / total) * 100 : 0 };
  };

  const handleCheckAll = async (stopIdx: number, allDone: boolean) => {
    const s = stops[stopIdx];
    await Promise.all(
      s.items
        .filter((item) => item.done !== !allDone)
        .map((item) => toggleItem(contractId, s.id, item.id))
    );
  };

  const handleComplete = async () => {
    await saveContract(contractId, { status: 'COMPLETED' });
    onBack();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            SCHT-{String(contractId).padStart(4, '0')} · EXECUTION
          </div>
          <h1 className="page-head__title">{contract.name}</h1>
        </div>
        <div className="page-head__actions">
          <span className="badge badge--progress">IN PROGRESS</span>
          <button className="btn btn--ghost" onClick={onBack}>◂ BOARD</button>
          <button
            className="btn btn--cyan"
            disabled={overall.pct < 100}
            onClick={handleComplete}
          >
            {overall.pct < 100
              ? `${Math.floor(overall.pct)}% · MARK COMPLETE`
              : '▸ COMPLETE CONTRACT'}
          </button>
        </div>
      </div>

      {/* Route map */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel__hd">
          <div className="left">ROUTE MAP · {stops.length} STOPS</div>
          <div className="right">
            <span className="legend" style={{ gap: 12 }}>
              <span><i></i> PICKUP</span>
              <span><i className="cy"></i> DELIVERY</span>
            </span>
          </div>
        </div>
        <div className="panel__bd panel__bd--flush">
          <div className="route">
            {stops.map((s, i) => {
              const prog = stopProgress(i);
              const fullyDone = prog.total > 0 && prog.done === prog.total;
              return (
                <div key={s.id} style={{ display: 'contents' }}>
                  <div
                    className={[
                      'route__node',
                      s.type === 'PICKUP' ? 'is-pickup' : 'is-delivery',
                      activeIdx === i ? 'is-active' : '',
                      fullyDone ? 'is-done' : '',
                    ].join(' ')}
                    onClick={() => setActiveIdx(i)}
                  >
                    <div className="route__type">
                      <b>[{String(i + 1).padStart(2, '0')}]</b>
                      {' '}{s.type === 'PICKUP' ? '◂ COLLECT' : '▸ DEPOSIT'}
                    </div>
                    <div className="route__station">{s.station}</div>
                    <div className="route__sub">
                      {s.items.length} ITEMS · {s.items.reduce((a, b) => a + b.qty, 0)} SCU
                    </div>
                    <div style={{ height: 4, background: '#060503', border: '1px solid var(--line-2)', marginTop: 4 }}>
                      <div style={{
                        height: '100%', width: prog.pct + '%',
                        background: s.type === 'PICKUP' ? 'var(--amber)' : 'var(--cyan)',
                      }} />
                    </div>
                  </div>
                  {i < stops.length - 1 && <div className="route__connector" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checklists + sidebar */}
      <div className="grid-12">
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {stops.map((s, i) => {
            const prog = stopProgress(i);
            const isPickup = s.type === 'PICKUP';
            const fullyDone = prog.total > 0 && prog.done === prog.total;
            return (
              <div
                key={s.id}
                className={'panel ' + (isPickup ? '' : 'panel--cyan')}
                style={{
                  opacity: fullyDone ? 0.65 : 1,
                  outline: activeIdx === i ? '1px solid var(--amber)' : 'none',
                  outlineOffset: -2,
                }}
                onClick={() => setActiveIdx(i)}
              >
                <div className="panel__hd">
                  <div className="left">
                    <span className="badge" style={{ color: isPickup ? 'var(--amber)' : 'var(--cyan)' }}>
                      {isPickup ? 'PICKUP' : 'DELIVERY'} {String(i + 1).padStart(2, '0')}
                    </span>
                    <b>{s.station}</b>
                  </div>
                  <div className="right">
                    <span className="muted">{prog.done}/{prog.total} ITEMS</span>
                    <button
                      className="btn btn--xs"
                      onClick={(e) => { e.stopPropagation(); handleCheckAll(i, fullyDone); }}
                    >
                      {fullyDone ? '↺ UNCHECK ALL' : '✓ CHECK ALL'}
                    </button>
                  </div>
                </div>
                <div className="panel__bd panel__bd--flush">
                  <div className="checklist">
                    {s.items.map((it, j) => (
                      <div
                        key={it.id}
                        className={'check-row ' + (it.done ? 'is-done' : '')}
                        onClick={(e) => { e.stopPropagation(); toggleItem(contractId, s.id, it.id); }}
                      >
                        <div className={'checkbox ' + (isPickup ? '' : 'checkbox--cy') + ' ' + (it.done ? 'is-on' : '')} />
                        <div>
                          <div className="check-row__name">{it.material}</div>
                          <div className="check-row__type">LOT-{String(j + 1).padStart(3, '0')}</div>
                        </div>
                        <div className="check-row__qty">
                          {it.qty} <span className="muted" style={{ fontSize: 10 }}>SCU</span>
                        </div>
                        <div className="check-row__ship">
                          {contract.ships[j % Math.max(contract.ships.length, 1)]?.name ?? '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ gridColumn: 'span 4', position: 'sticky', top: 90, alignSelf: 'flex-start' }}>
          <div className="panel panel--cyan">
            <div className="panel__hd">
              <div className="left">REMAINING WORK</div>
              <div className="right">
                <span className="muted">{overall.total - overall.done} OF {overall.total}</span>
              </div>
            </div>
            <div className="panel__bd" style={{ padding: 0 }}>
              <div className="bar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-2)' }}>
                <div className="bar__label">PROGRESS</div>
                <div className="bar__track">
                  <div className="bar__seg cyan" style={{ width: overall.pct + '%' }} />
                </div>
                <div className="bar__val">
                  {Math.floor(overall.pct)}<span className="small">%</span>
                </div>
              </div>
              <div className="remain">
                {remainingByStop.length === 0 && (
                  <div className="muted" style={{ padding: 18, textAlign: 'center' }}>
                    // ALL ITEMS DELIVERED<br />
                    <span className="am">▸ AWAITING CONFIRMATION</span>
                  </div>
                )}
                {remainingByStop.map((s, i) => (
                  <div className="remain__group" key={i}>
                    <div className="remain__station">
                      <span>{s.type === 'PICKUP' ? '◂ PU' : '▸ DR'} · {s.station}</span>
                      <b>{s.remaining.length} ITEMS</b>
                    </div>
                    {s.remaining.map((it, j) => (
                      <div className="remain__row" key={j}>
                        <span>{it.material}</span>
                        <span className="qty">
                          {it.qty} <span className="muted" style={{ fontSize: 10 }}>SCU</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
