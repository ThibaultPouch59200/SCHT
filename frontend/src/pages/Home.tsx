import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useShipStore } from '../store/useShipStore';
import { PlanetGroup } from '../components/home/PlanetGroup';

export interface CargoLineInfo {
  id: number;
  missionId: number;
  res: string;
  scu: number;
}

export interface StationInfo {
  key: string;       // `${system}|${planet}|${normalizedStationName}`
  name: string;
  cargos: CargoLineInfo[];
}

export interface PlanetGroupData {
  system: string;
  planet: string;
  stations: StationInfo[];
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildGroups(
  missions: ReturnType<typeof useMissionStore.getState>['missions'],
  sysFilter: string
): Record<string, PlanetGroupData> {
  const planets: Record<string, PlanetGroupData> = {};

  missions.forEach((m) => {
    if (sysFilter !== 'all' && m.system !== sysFilter) return;

    m.cargos.forEach((c: any) => {
      const stationName = String(c.dest ?? '').trim();
      const planetName = String(c.planet ?? '').trim() || m.system;
      if (!stationName) return;

      const normalizedPlanet = normalizeText(planetName);
      const planetKey = `${m.system}|${normalizedPlanet}`;

      if (!planets[planetKey]) {
        planets[planetKey] = { system: m.system, planet: planetName, stations: [] };
      }

      const stationKey = normalizeText(stationName);
      const station = planets[planetKey].stations.find(
        (s) => normalizeText(s.name) === stationKey
      );

      const cargoLine: CargoLineInfo = {
        id: c.id,
        missionId: m.id,
        res: c.res,
        scu: c.scu,
      };

      if (station) {
        station.cargos.push(cargoLine);
      } else {
        planets[planetKey].stations.push({
          key: `${m.system}|${normalizedPlanet}|${stationKey}`,
          name: stationName,
          cargos: [cargoLine],
        });
      }
    });
  });

  Object.values(planets).forEach((planetGroup) => {
    planetGroup.stations.sort((a, b) => a.name.localeCompare(b.name));
  });

  return planets;
}

const SYSTEMS = ['Tous', 'Stanton', 'Pyro', 'Nyx'];

export const Home: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const deliveredById = useMissionStore((s) => s.deliveredById);
  const sysFilter = useMissionStore((s) => s.sysFilter);
  const setSysFilter = useMissionStore((s) => s.setSysFilter);

  const selectedShip = useShipStore((s) => s.selectedShip);

  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const planetGroups = buildGroups(activeMissions, sysFilter);
  const entries = Object.entries(planetGroups);

  const totalActiveScu = activeMissions.reduce(
    (sum, m) => sum + m.cargos.reduce((s, c) => s + Math.max(0, c.scu - (c.id != null ? (deliveredById[c.id] ?? 0) : 0)), 0),
    0
  );
  const cap = selectedShip?.scu ?? null;
  const pct = cap ? totalActiveScu / cap : 0;
  const scuColor = cap === null
    ? 'var(--text-dim)'
    : totalActiveScu > cap
      ? 'var(--red)'
      : pct > 0.8
        ? 'var(--amber)'
        : 'var(--green)';

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
        <div className="scu-ops-indicator" style={{ color: scuColor }}>
          <span className="scu-ops-label">CARGO</span>
          <span className="scu-ops-value">
            {totalActiveScu} / {cap !== null ? `${cap} SCU` : '— SCU'}
          </span>
          {cap !== null && totalActiveScu > cap && (
            <span className="scu-ops-overload">SURCHARGE</span>
          )}
        </div>
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
