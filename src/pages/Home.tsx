import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { PlanetGroup } from '../components/home/PlanetGroup';

interface StationInfo {
  key: string;
  name: string;
  resources: Record<string, number>;
}

interface PlanetGroupData {
  system: string;
  planet: string;
  stations: StationInfo[];
}

function buildStationsMap(
  missions: ReturnType<typeof useMissionStore.getState>['missions'],
  sysFilter: string
): Record<string, { system: string; planet: string; name: string; resources: Record<string, number> }> {
  const map: Record<string, { system: string; planet: string; name: string; resources: Record<string, number> }> = {};
  missions.forEach((m) => {
    if (sysFilter !== 'all' && m.system !== sysFilter) return;
    m.cargos.forEach((c) => {
      const key = `${m.system}|${c.planet}|${c.dest}`;
      if (!map[key]) {
        map[key] = { system: m.system, planet: c.planet, name: c.dest, resources: {} };
      }
      map[key].resources[c.res] = (map[key].resources[c.res] ?? 0) + c.scu;
    });
  });
  return map;
}

function groupByPlanet(
  stationsMap: ReturnType<typeof buildStationsMap>
): Record<string, PlanetGroupData> {
  const g: Record<string, PlanetGroupData> = {};
  Object.entries(stationsMap).forEach(([key, s]) => {
    const pk = `${s.system}|${s.planet}`;
    if (!g[pk]) {
      g[pk] = { system: s.system, planet: s.planet, stations: [] };
    }
    g[pk].stations.push({ key, name: s.name, resources: s.resources });
  });
  return g;
}

const SYSTEMS = ['Tous', 'Stanton', 'Pyro', 'Nyx'];

export const Home: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const sysFilter = useMissionStore((s) => s.sysFilter);
  const setSysFilter = useMissionStore((s) => s.setSysFilter);

  const stationsMap = buildStationsMap(missions, sysFilter);
  const planetGroups = groupByPlanet(stationsMap);
  const entries = Object.entries(planetGroups);

  return (
    <div
      className="page-anim"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      <div className="filter-bar">
        <span className="filter-label">Système</span>
        {SYSTEMS.map((sys) => {
          const val = sys === 'Tous' ? 'all' : sys;
          return (
            <button
              key={sys}
              className={`filter-btn${sysFilter === val ? ' active' : ''}`}
              onClick={() => setSysFilter(val)}
            >
              {sys}
            </button>
          );
        })}
      </div>

      <div className="content">
        {entries.length === 0 ? (
          <div className="empty-state">
            // NO CARGO OPERATIONS FOUND
            <br />
            Enregistre des missions pour voir les livraisons.
          </div>
        ) : (
          entries.map(([pk, grp]) => (
            <PlanetGroup
              key={pk}
              planet={grp.planet}
              system={grp.system}
              stations={grp.stations}
            />
          ))
        )}
      </div>
    </div>
  );
};
