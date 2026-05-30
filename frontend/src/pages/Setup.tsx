import { useState, useMemo, useEffect, useRef } from 'react';
import { useContractStore } from '../store/useContractStore';
import { useFleetStore } from '../store/useFleetStore';

const STATIONS = [
  'PORT TRESSLER', 'ARCCORP MINING 141', 'EVERUS HARBOR', 'BAIJINI POINT',
  'LORVILLE — TDD', 'AREA 18 — TDD', 'NEW BABBAGE — TDD', 'GRIM HEX',
  'CRU-L1 AMBITIOUS DREAM', 'PORT OLISAR', 'ARC-L1 WIDE FOREST',
  'RAYARI DEFFRES RES.', 'SHUBIN MINING SAL-2', 'HDMS-NORGAARD',
];

interface ItemDraft { key: number; material: string; qty: number }
interface StopDraft { key: number; type: 'PICKUP' | 'DELIVERY'; station: string; items: ItemDraft[] }

interface Props {
  contractId: number | null;
  onBack: () => void;
  onExecute: (id: number) => void;
}

let _key = 0;
const nextKey = () => ++_key;

const MAT_COLORS = ['amber', 'cyan', 'dim'] as const;

export function Setup({ contractId, onBack, onExecute }: Props) {
  const { contracts, saveContract, deleteContract } = useContractStore();
  const { ships, loadShips } = useFleetStore();

  const contract = contracts.find((c) => c.id === contractId) ?? null;

  const [name, setName] = useState(contract?.name ?? '');
  const [client, setClient] = useState(contract?.client ?? '');
  const [payout, setPayout] = useState(String(contract?.payout ?? 0));
  const [shipIds, setShipIds] = useState<number[]>(contract?.ships.map((s) => s.id) ?? []);
  const [stops, setStops] = useState<StopDraft[]>(() =>
    contract?.stops.map((s) => ({
      key: nextKey(),
      type: s.type as 'PICKUP' | 'DELIVERY',
      station: s.station,
      items: s.items.map((it) => ({ key: nextKey(), material: it.material, qty: it.qty })),
    })) ?? []
  );
  const isNew = !contract || (contract.status === 'PENDING' && contract.name === 'UNTITLED CONTRACT');
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const synced = useRef(false);
  useEffect(() => {
    if (contract && !synced.current) {
      setName(contract.name);
      setClient(contract.client);
      setPayout(String(contract.payout));
      setShipIds(contract.ships.map((s) => s.id));
      setStops(contract.stops.map((s) => ({
        key: nextKey(),
        type: s.type as 'PICKUP' | 'DELIVERY',
        station: s.station,
        items: s.items.map((it) => ({ key: nextKey(), material: it.material, qty: it.qty })),
      })));
      synced.current = true;
    }
  }, [contract]);

  useEffect(() => { loadShips(); }, [loadShips]);

  const pickups = stops.filter((s) => s.type === 'PICKUP');
  const deliveries = stops.filter((s) => s.type === 'DELIVERY');

  const addStop = (type: 'PICKUP' | 'DELIVERY') =>
    setStops((prev) => [...prev, { key: nextKey(), type, station: '', items: [{ key: nextKey(), material: '', qty: 0 }] }]);

  const removeStop = (key: number) => setStops((prev) => prev.filter((s) => s.key !== key));

  const updateStop = (key: number, station: string) =>
    setStops((prev) => prev.map((s) => s.key === key ? { ...s, station } : s));

  const addItem = (stopKey: number) =>
    setStops((prev) => prev.map((s) =>
      s.key === stopKey ? { ...s, items: [...s.items, { key: nextKey(), material: '', qty: 0 }] } : s
    ));

  const removeItem = (stopKey: number, itemKey: number) =>
    setStops((prev) => prev.map((s) =>
      s.key === stopKey ? { ...s, items: s.items.filter((i) => i.key !== itemKey) } : s
    ));

  const updateItem = (stopKey: number, itemKey: number, patch: Partial<ItemDraft>) =>
    setStops((prev) => prev.map((s) =>
      s.key === stopKey ? { ...s, items: s.items.map((i) => i.key === itemKey ? { ...i, ...patch } : i) } : s
    ));

  const contractTotal = useMemo(
    () => pickups.reduce((a, s) => a + s.items.reduce((b, i) => b + i.qty, 0), 0),
    [pickups]
  );
  const fleetTotal = useMemo(
    () => shipIds.map((id) => ships.find((s) => s.id === id)).filter(Boolean).reduce((a, s) => a + s!.scu, 0),
    [shipIds, ships]
  );
  const fillPct = Math.min(100, (contractTotal / Math.max(fleetTotal, 1)) * 100);
  const overflow = contractTotal > fleetTotal && fleetTotal > 0;

  const totalsByMaterial = useMemo(() => {
    const out: Record<string, number> = {};
    pickups.forEach((s) => s.items.forEach((i) => {
      if (i.material) out[i.material] = (out[i.material] ?? 0) + i.qty;
    }));
    return Object.entries(out);
  }, [pickups]);

  const buildStops = () =>
    stops.map((s, i) => ({
      type: s.type,
      station: s.station,
      position: i,
      items: s.items.filter((i) => i.material).map((i) => ({ material: i.material, qty: i.qty })),
    }));

  const handleSave = async () => {
    if (!contractId) return;
    await saveContract(contractId, {
      name, client, payout: parseInt(payout, 10) || 0,
      shipIds, stops: buildStops(),
    });
  };

  const handleDiscard = async () => {
    if (isNew && contractId) await deleteContract(contractId);
    onBack();
  };

  const handleCommit = async () => {
    if (!contractId) return;
    await saveContract(contractId, {
      name, client, payout: parseInt(payout, 10) || 0,
      status: 'IN_PROGRESS', shipIds, stops: buildStops(),
    });
    onExecute(contractId);
  };

  const renderStop = (stop: StopDraft, idx: number) => {
    const prefix = stop.type === 'PICKUP' ? 'PU' : 'DR';
    return (
      <div className="point" key={stop.key}>
        <div className="point__hd">
          <span className="point__idx">{prefix}-{String(idx + 1).padStart(2, '0')}</span>
          <input
            className="input input--sm"
            style={{ flex: 1 }}
            list="stations-list"
            value={stop.station}
            onChange={(e) => updateStop(stop.key, e.target.value)}
            placeholder="STATION NAME…"
          />
          <button className="icon-btn icon-btn--danger" onClick={() => removeStop(stop.key)}>✕</button>
        </div>
        <div className="point__bd">
          <div className="mat-row" style={{ paddingBottom: 4, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)' }}>MATERIAL</div>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)', textAlign: 'right' }}>QTY</div>
            <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--muted)', textAlign: 'right' }}>UNIT</div>
            <div />
          </div>
          {stop.items.map((item) => (
            <div className="mat-row" key={item.key}>
              <input
                className="input input--sm"
                value={item.material}
                onChange={(e) => updateItem(stop.key, item.key, { material: e.target.value.toUpperCase() })}
                placeholder="MATERIAL"
              />
              <input
                className="input input--sm input--num"
                type="number" min={0}
                value={item.qty}
                onChange={(e) => updateItem(stop.key, item.key, { qty: parseInt(e.target.value, 10) || 0 })}
              />
              <div className="unit">SCU</div>
              <button className="icon-btn" onClick={() => removeItem(stop.key, item.key)}>−</button>
            </div>
          ))}
          <button className="add-mat" onClick={() => addItem(stop.key)}>+ ADD MATERIAL</button>
        </div>
      </div>
    );
  };

  if (!contract && contractId !== null) {
    return <div className="muted" style={{ padding: 32 }}>// LOADING CONTRACT…</div>;
  }

  return (
    <div>
      <datalist id="stations-list">
        {STATIONS.map((s) => <option key={s} value={s} />)}
      </datalist>

      <div className="page-head">
        <div>
          <div className="page-head__crumbs">
            SCHT-{String(contractId ?? 0).padStart(4, '0')} · SETUP
          </div>
          <h1 className="page-head__title">Configure Contract</h1>
        </div>
        <div className="page-head__actions">
          {discardConfirm ? (
            <>
              <span className="muted" style={{ fontSize: 11, letterSpacing: '0.15em' }}>Discard this contract?</span>
              <button className="btn btn--ghost" onClick={() => setDiscardConfirm(false)}>CANCEL</button>
              <button className="btn" onClick={handleDiscard}>CONFIRM DISCARD</button>
            </>
          ) : (
            <>
              <button className="btn btn--ghost" onClick={isNew ? () => setDiscardConfirm(true) : onBack}>◂ DISCARD</button>
              <button className="btn" onClick={handleSave}>SAVE DRAFT</button>
              <button className="btn btn--cyan" onClick={handleCommit}>▸ COMMIT &amp; EXECUTE</button>
            </>
          )}
        </div>
      </div>

      {/* Meta + Fleet */}
      <div className="grid-12" style={{ marginBottom: 18 }}>
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel__hd">
            <div className="left">CONTRACT META</div>
            <div className="right"><span className="badge badge--progress">DRAFT</span></div>
          </div>
          <div className="panel__bd">
            <div className="grid-12" style={{ gap: 12 }}>
              <div className="field" style={{ gridColumn: 'span 4' }}>
                <div className="field__label">Contract ID</div>
                <input className="input" disabled value={`SCHT-${String(contractId ?? 0).padStart(4, '0')}`} />
              </div>
              <div className="field" style={{ gridColumn: 'span 8' }}>
                <div className="field__label">Display Name</div>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: 'span 6' }}>
                <div className="field__label">Client / Issuer</div>
                <input className="input" value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
              <div className="field" style={{ gridColumn: 'span 6' }}>
                <div className="field__label">Reward (aUEC)</div>
                <input
                  className="input input--num" type="number"
                  value={payout} onChange={(e) => setPayout(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="panel panel--cyan" style={{ gridColumn: 'span 6' }}>
          <div className="panel__hd">
            <div className="left">ASSIGNED FLEET · {shipIds.length} SHIPS</div>
            <div className="right">
              <span className="muted">FLEET CAP {fleetTotal.toLocaleString()} SCU</span>
            </div>
          </div>
          <div className="panel__bd" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ships.map((s) => {
              const on = shipIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => setShipIds((prev) => on ? prev.filter((id) => id !== s.id) : [...prev, s.id])}
                  style={{
                    display: 'grid', gridTemplateColumns: '24px 1fr auto auto',
                    gap: 10, alignItems: 'center', padding: '6px 8px',
                    border: '1px solid ' + (on ? 'var(--cyan)' : 'var(--line-2)'),
                    cursor: 'pointer',
                    background: on ? 'rgba(217,217,217,0.07)' : 'transparent',
                  }}
                >
                  <div className={'checkbox checkbox--cy ' + (on ? 'is-on' : '')} />
                  <div>
                    <div className="am">{s.name}</div>
                    <div className="muted" style={{ fontSize: 10, letterSpacing: '0.18em' }}>
                      {s.model} · {s.pilot}
                    </div>
                  </div>
                  <div className="cy" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.scu}</div>
                  <div className="muted" style={{ fontSize: 10 }}>SCU</div>
                </div>
              );
            })}
            {ships.length === 0 && (
              <div className="muted" style={{ textAlign: 'center', padding: 16 }}>
                // NO SHIPS IN ROSTER — ADD VIA FLEET ROSTER
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pickup + Delivery columns */}
      <div className="grid-12" style={{ marginBottom: 18 }}>
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel__hd">
            <div className="left">◂ PICKUP POINTS · {pickups.length}</div>
            <button className="btn btn--xs" onClick={() => addStop('PICKUP')}>+ ADD PICKUP</button>
          </div>
          <div className="panel__bd">
            {pickups.map((s, i) => renderStop(s, i))}
            {pickups.length === 0 && (
              <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
                // NO PICKUP STOPS DEFINED
              </div>
            )}
          </div>
        </div>

        <div className="panel panel--cyan" style={{ gridColumn: 'span 6' }}>
          <div className="panel__hd">
            <div className="left">▸ DELIVERY POINTS · {deliveries.length}</div>
            <button className="btn btn--xs btn--cyan" onClick={() => addStop('DELIVERY')}>
              + ADD DELIVERY
            </button>
          </div>
          <div className="panel__bd">
            {deliveries.map((s, i) => renderStop(s, i))}
            {deliveries.length === 0 && (
              <div className="muted" style={{ textAlign: 'center', padding: 20 }}>
                // NO DELIVERY STOPS DEFINED
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capacity analysis */}
      <div className="panel">
        <div className="panel__hd">
          <div className="left">CAPACITY ANALYSIS</div>
          <div className="right">
            <span className="badge badge--progress">CONTRACT {contractTotal} SCU</span>
            <span className="badge badge--done">FLEET {fleetTotal} SCU</span>
            {overflow && <span className="badge badge--alert">OVERFLOW</span>}
          </div>
        </div>
        <div className="panel__bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="bar">
            <div className="bar__label">FLEET TOTAL</div>
            <div className="bar__track">
              <div className={'bar__seg ' + (overflow ? 'alert' : 'amber')} style={{ width: fillPct + '%' }} />
            </div>
            <div className="bar__val">
              {contractTotal}<span className="small"> / {fleetTotal}</span>
            </div>
          </div>

          {shipIds.length > 0 && (
            <>
              <hr className="div" style={{ margin: '4px 0' }} />
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.22em' }}>BY SHIP</div>
              {shipIds.map((sid) => {
                const sh = ships.find((s) => s.id === sid);
                if (!sh) return null;
                const used = Math.round(contractTotal * (sh.scu / Math.max(fleetTotal, 1)));
                const pct = Math.min(100, (used / Math.max(sh.scu, 1)) * 100);
                return (
                  <div className="bar" key={sid}>
                    <div className="bar__label">{sh.name}</div>
                    <div className="bar__track">
                      <div className="bar__seg cyan" style={{ width: pct + '%' }} />
                    </div>
                    <div className="bar__val">{used}<span className="small"> / {sh.scu}</span></div>
                  </div>
                );
              })}
            </>
          )}

          {totalsByMaterial.length > 0 && (
            <>
              <hr className="div" style={{ margin: '4px 0' }} />
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.22em' }}>BY MATERIAL</div>
              {totalsByMaterial.map(([mat, qty], i) => {
                const pct = Math.min(100, (qty / Math.max(fleetTotal, 1)) * 100);
                return (
                  <div className="bar" key={mat}>
                    <div className="bar__label">{mat}</div>
                    <div className="bar__track">
                      <div className={'bar__seg ' + MAT_COLORS[i % MAT_COLORS.length]} style={{ width: pct + '%' }} />
                    </div>
                    <div className="bar__val">{qty}<span className="small"> SCU</span></div>
                  </div>
                );
              })}
            </>
          )}

          {contractTotal === 0 && (
            <div className="muted" style={{ padding: 4 }}>// NO MATERIALS SCHEDULED</div>
          )}
        </div>
      </div>
    </div>
  );
}
