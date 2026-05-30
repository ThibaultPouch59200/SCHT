import { useState, useEffect } from 'react';
import { useFleetStore } from '../../store/useFleetStore';

interface Props {
  onClose: () => void;
}

export function FleetDrawer({ onClose }: Props) {
  const { ships, loadShips, addShip, removeShip } = useFleetStore();
  const [mode, setMode] = useState<'SOLO' | 'FLEET'>('FLEET');
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: '', model: '', pilot: '', scu: '' });

  useEffect(() => { loadShips(); }, [loadShips]);

  const totalSCU = ships.reduce((a, s) => a + s.scu, 0);
  const maxSCU = ships.length > 0 ? Math.max(...ships.map((s) => s.scu)) : 1;

  const handleAdd = async () => {
    if (!draft.name || !draft.scu) return;
    await addShip({
      name: draft.name,
      model: draft.model,
      pilot: draft.pilot,
      scu: parseInt(draft.scu) || 0,
    });
    setDraft({ name: '', model: '', pilot: '', scu: '' });
    setAdding(false);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__hd">
          <h2>◂ FLEET ROSTER</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 10, letterSpacing: '0.2em' }}>ESC</span>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="drawer__bd">
          <div className="stat-grid" style={{ marginBottom: 14 }}>
            <div className="stat">
              <div className="stat__label">Ships</div>
              <div className="stat__value">{ships.length}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Total Capacity</div>
              <div className="stat__value cy">
                {totalSCU}<span className="small"> SCU</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.22em' }}>OPERATION MODE</div>
            <div className="toggle">
              <button className={mode === 'SOLO' ? 'is-on' : ''} onClick={() => setMode('SOLO')}>SOLO</button>
              <button className={mode === 'FLEET' ? 'is-on' : ''} onClick={() => setMode('FLEET')}>FLEET</button>
            </div>
          </div>

          <hr className="div" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', letterSpacing: '0.2em' }}>
              SHIPS · {ships.length}
            </div>
            <button className="btn btn--xs btn--cyan" onClick={() => setAdding((v) => !v)}>
              + ADD SHIP
            </button>
          </div>

          {adding && (
            <div className="point" style={{ marginBottom: 12 }}>
              <div className="point__hd">
                <span className="point__idx">NEW</span>
                <span className="am" style={{ fontSize: 12, letterSpacing: '0.15em' }}>REGISTER SHIP</span>
                <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setAdding(false)}>✕</button>
              </div>
              <div className="point__bd" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="field">
                  <div className="field__label">Call Sign</div>
                  <input
                    className="input input--sm"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value.toUpperCase() })}
                    placeholder="HAULMARY"
                  />
                </div>
                <div className="field">
                  <div className="field__label">Model</div>
                  <input
                    className="input input--sm"
                    value={draft.model}
                    onChange={(e) => setDraft({ ...draft, model: e.target.value.toUpperCase() })}
                    placeholder="C2 HERCULES"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                  <div className="field">
                    <div className="field__label">Pilot</div>
                    <input
                      className="input input--sm"
                      value={draft.pilot}
                      onChange={(e) => setDraft({ ...draft, pilot: e.target.value.toUpperCase() })}
                      placeholder="CMDR. ORTEGA"
                    />
                  </div>
                  <div className="field">
                    <div className="field__label">SCU</div>
                    <input
                      className="input input--sm input--num"
                      type="number" min={1}
                      value={draft.scu}
                      onChange={(e) => setDraft({ ...draft, scu: e.target.value })}
                      placeholder="696"
                    />
                  </div>
                </div>
                <button
                  className="btn btn--block btn--cyan"
                  onClick={handleAdd}
                  disabled={!draft.name || !draft.scu}
                >
                  ▸ COMMIT TO ROSTER
                </button>
              </div>
            </div>
          )}

          {ships.map((sh) => {
            const pct = Math.min(100, (sh.scu / maxSCU) * 100);
            return (
              <div key={sh.id} className="ship is-active">
                <div className="ship__hd">
                  <div>
                    <div className="ship__name">{sh.name}</div>
                    <div className="ship__model">{sh.model || '—'}</div>
                  </div>
                  <button className="icon-btn icon-btn--danger" onClick={() => removeShip(sh.id)}>✕</button>
                </div>
                <div className="ship__row">
                  <span>
                    <span className="muted">PILOT </span>
                    <span className="ship__pilot">{sh.pilot || '—'}</span>
                  </span>
                  <span>
                    <span className="muted">CAP </span>
                    <span className="am">{sh.scu} SCU</span>
                  </span>
                </div>
                <div className="ship__cap">
                  <div className="ship__cap-fill" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}

          {ships.length > 0 && (
            <>
              <hr className="div" />
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.22em', marginBottom: 8 }}>
                SCU DISTRIBUTION
              </div>
              <div style={{ display: 'flex', height: 24, border: '1px solid var(--line-2)' }}>
                {ships.map((sh, i) => {
                  const w = totalSCU > 0 ? (sh.scu / totalSCU) * 100 : 0;
                  const colors = ['var(--amber)', 'var(--cyan)', 'var(--amber-deep)', 'var(--cyan-soft)'];
                  return (
                    <div
                      key={sh.id}
                      title={`${sh.name} · ${sh.scu} SCU`}
                      style={{
                        width: w + '%',
                        background: `repeating-linear-gradient(90deg, ${colors[i % colors.length]} 0 6px, rgba(0,0,0,0.3) 6px 8px)`,
                        borderRight: i < ships.length - 1 ? '1px solid var(--bg)' : 'none',
                        display: 'grid', placeItems: 'center',
                        fontSize: 9, letterSpacing: '0.18em', color: 'var(--bg)', fontWeight: 700,
                      }}
                    >
                      {w > 8 && sh.name.split(' ')[0]}
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: 'var(--muted)', letterSpacing: '0.18em', marginTop: 4,
              }}>
                <span>0 SCU</span>
                <span>{totalSCU} SCU TOTAL</span>
              </div>
            </>
          )}

          {ships.length === 0 && (
            <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
              // NO SHIPS REGISTERED
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
