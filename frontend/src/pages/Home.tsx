import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useRouteStore } from '../store/useRouteStore';
import { useShipStore } from '../store/useShipStore';
import { buildRoute } from '../lib/route';
import { StopCard } from '../components/route/StopCard';
import { CapacityGauge } from '../components/route/CapacityGauge';

export const Home: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const { autoOrder, manualOrder, toggleAuto, setManualOrder } = useRouteStore();
  const ship = useShipStore((s) => s.selectedShip);

  const stops = buildRoute(missions, { autoOrder, manualOrder });
  const loaded = missions.flatMap((m) => m.cargos)
    .filter((c) => c.status === 'LOADED').reduce((n, c) => n + c.scu, 0);

  // Reorder: swap the displayed stop at `i` with its neighbour and persist the
  // full key order. setManualOrder also switches the store into manual mode.
  const move = (i: number, dir: -1 | 1) => {
    const keys = stops.map((s) => s.key);
    const j = i + dir;
    if (j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    setManualOrder(keys);
  };

  let lastPlanet = '';
  return (
    <div className="ct-page">
      <div className="ct-page-bar">
        <CapacityGauge loaded={loaded} capacity={ship?.scu ?? null} />
        <button className={`ct-toggle${autoOrder ? ' on' : ''}`} onClick={toggleAuto}>
          AUTO {autoOrder ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="ct-content">
        {stops.length === 0 ? (
          <div className="ct-empty">Aucun arrêt. Enregistre une mission.</div>
        ) : stops.map((s, i) => {
          const jump = s.planet !== lastPlanet ? (lastPlanet = s.planet) : null;
          return (
            <React.Fragment key={s.key}>
              {jump && <div className="ct-jump">↝ SAUT QUANTIQUE VERS <b>{jump}</b></div>}
              <StopCard
                stop={s} leg={i + 1}
                onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)}
                canUp={i > 0} canDown={i < stops.length - 1}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
