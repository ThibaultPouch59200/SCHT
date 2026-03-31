import React, { useState } from 'react';
import { StationBlock } from './StationBlock';
import { useMissionStore } from '../../store/useMissionStore';

interface StationInfo {
  key: string;
  name: string;
  resources: Record<string, number>;
}

interface PlanetGroupProps {
  planet: string;
  system: string;
  stations: StationInfo[];
}

export const PlanetGroup: React.FC<PlanetGroupProps> = ({
  planet,
  system,
  stations,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const delivered = useMissionStore((s) => s.delivered);

  const totalScu = stations.reduce(
    (acc, s) => acc + Object.values(s.resources).reduce((a, v) => a + v, 0),
    0
  );
  const delivScu = stations.reduce(
    (acc, s) =>
      acc +
      Object.entries(s.resources).reduce(
        (a, [res, scu]) => a + (delivered[`${s.key}|${res}`] ? scu : 0),
        0
      ),
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
            <StationBlock
              key={s.key}
              stationKey={s.key}
              name={s.name}
              resources={s.resources}
            />
          ))}
        </div>
      )}
    </div>
  );
};
