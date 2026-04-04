import React, { useState } from 'react';
import { StationBlock } from './StationBlock';
import { useMissionStore } from '../../store/useMissionStore';
import type { StationInfo } from '../../pages/Home';

interface PlanetGroupProps {
  planet: string;
  system: string;
  stations: StationInfo[];
}

export const PlanetGroup: React.FC<PlanetGroupProps> = ({ planet, system, stations }) => {
  const [collapsed, setCollapsed] = useState(false);
  const deliveredById = useMissionStore((s) => s.deliveredById);

  const totalScu = stations.reduce(
    (acc, s) => acc + s.cargos.reduce((a, c) => a + c.scu, 0),
    0
  );
  const delivScu = stations.reduce(
    (acc, s) =>
      acc + s.cargos.reduce((a, c) => a + Math.min(deliveredById[c.id] ?? 0, c.scu), 0),
    0
  );

  return (
    <div className="planet-group">
      <div className="planet-header" onClick={() => setCollapsed((c) => !c)}>
        <div className={`planet-toggle${collapsed ? '' : ' open'}`}>▶</div>
        <div className="planet-name">{planet}</div>
        <div className="planet-system">{system}</div>
        <div className="planet-scu">
          {delivScu} / <strong>{totalScu}</strong> SCU livré
        </div>
      </div>

      {!collapsed && (
        <div className="station-list">
          {stations.map((s) => (
            <StationBlock key={s.key} station={s} />
          ))}
        </div>
      )}
    </div>
  );
};
