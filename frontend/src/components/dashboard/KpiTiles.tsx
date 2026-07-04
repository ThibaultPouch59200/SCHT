import React from 'react';
import type { Mission } from '../../types';
import { computeKpis } from '../../lib/stats';

export const KpiTiles: React.FC<{ missions: Mission[] }> = ({ missions }) => {
  const k = computeKpis(missions);
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  return (
    <div className="ct-kpis">
      <div className="ct-kpi"><div className="v">{k.inProgress}</div><div className="l">En cours</div></div>
      <div className="ct-kpi green"><div className="v">{k.completed}</div><div className="l">Terminées</div></div>
      <div className="ct-kpi blue"><div className="v">{fmt(k.scuDelivered)}</div><div className="l">SCU livré</div></div>
      <div className="ct-kpi blue"><div className="v">{fmt(k.cargosDelivered)}</div><div className="l">Cargaisons</div></div>
    </div>
  );
};
