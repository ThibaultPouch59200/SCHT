import React from 'react';
import type { Mission } from '../../types';
import { topDeliveredStations, topDeliveredMaterials, type TopEntry } from '../../lib/stats';

const Group: React.FC<{ title: string; entries: TopEntry[] }> = ({ title, entries }) => (
  <div className="ct-top-grp">
    <div className="th">{title}</div>
    {entries.length === 0 ? (
      <div className="ct-dash-empty">—</div>
    ) : entries.map((e, i) => (
      <div key={e.name} className="ct-top-row">
        <span className="rk">{i + 1}</span><span className="nm">{e.name}</span>
        <span className="val">{e.scu.toLocaleString('fr-FR')}</span>
      </div>
    ))}
  </div>
);

export const TopBreakdown: React.FC<{ missions: Mission[] }> = ({ missions }) => (
  <div className="ct-card">
    <div className="ct-dash-sec">Top — par SCU livré</div>
    <Group title="Stations de livraison" entries={topDeliveredStations(missions, 5)} />
    <Group title="Matières" entries={topDeliveredMaterials(missions, 5)} />
  </div>
);
