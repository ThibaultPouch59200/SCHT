import React from 'react';
const CELLS = 10;
export const CapacityGauge: React.FC<{ loaded: number; incoming?: number; capacity: number | null }> =
  ({ loaded, incoming = 0, capacity }) => {
    const over = capacity != null && loaded + incoming > capacity;
    const frac = (n: number) => (capacity ? Math.round((n / capacity) * CELLS) : 0);
    const full = frac(loaded), extra = Math.max(0, frac(loaded + incoming) - full);
    return (
      <div className="ct-gauge">
        <span className="ct-gauge-lbl">SOUTE</span>
        <div className="ct-cells">
          {Array.from({ length: CELLS }).map((_, i) => (
            <div key={i} className={`ct-cell${i < full ? ' f' : i < full + extra ? ' i' : ''}`} />
          ))}
        </div>
        <span className="ct-gauge-val" style={{ color: over ? 'var(--halt)' : 'var(--amber)' }}>
          {loaded + incoming}/{capacity ?? '—'}
        </span>
      </div>
    );
  };
