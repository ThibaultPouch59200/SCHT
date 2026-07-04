import React from 'react';
import type { Mission } from '../../types';
import { missionProgress } from '../../lib/stats';

function routeLabel(m: Mission): string {
  const origins = [...new Set(m.cargos.map((c) => c.origin))];
  const dests = [...new Set(m.cargos.map((c) => c.dest))];
  const side = (arr: string[]) => (arr.length <= 1 ? arr[0] ?? '—' : `${arr[0]} +${arr.length - 1}`);
  return `${side(origins)} → ${side(dests)}`;
}

export const InProgressList: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const active = missions.filter((m) => !m.completedAt);
  return (
    <div className="ct-card">
      <div className="ct-dash-sec">En cours</div>
      {active.length === 0 ? (
        <div className="ct-dash-empty">Aucune mission en cours.</div>
      ) : (
        <div className="ct-ip">
          {active.map((m) => {
            const p = missionProgress(m);
            return (
              <div key={m.id} className="ct-ip-row">
                <div className="ct-ip-head"><span>{routeLabel(m)}</span><span className="r">{p.delivered}/{p.total}</span></div>
                <div className="ct-ip-bar"><i style={{ width: `${p.pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
