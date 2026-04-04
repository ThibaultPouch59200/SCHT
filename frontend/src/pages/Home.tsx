import React from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useShipStore } from '../store/useShipStore';
import { PlanetGroup } from '../components/home/PlanetGroup';

export interface CargoLineInfo {
  id: number;
  res: string;
  scu: number;
}

export interface StationInfo {
  key: string;       // `${missionId}|${stationName}`
  missionId: number;
  name: string;
  cargos: CargoLineInfo[];
}

export interface PlanetGroupData {
  system: string;
  planet: string;
  stations: StationInfo[];
}

function buildGroups(
  missions: ReturnType<typeof useMissionStore.getState>['missions'],
  sysFilter: string
): Record<string, PlanetGroupData> {
  const planets: Record<string, PlanetGroupData> = {};

  missions.forEach((m) => {
    if (sysFilter !== 'all' && m.system !== sysFilter) return;

    // Group this mission's cargos by destination station
    const byStation: Record<string, CargoLineInfo[]> = {};
    m.cargos.forEach((c: any) => {
      if (!byStation[c.dest]) byStation[c.dest] = [];
      byStation[c.dest].push({ id: c.id, res: c.res, scu: c.scu });
    });

    Object.entries(byStation).forEach(([dest, cargos]) => {
      // Find planet for this destination
      const planet = m.cargos.find((c: any) => c.dest === dest)?.planet ?? m.system;
      const planetKey = `${m.system}|${planet}`;
      if (!planets[planetKey]) {
        planets[planetKey] = { system: m.system, planet, stations: [] };
      }
      planets[planetKey].stations.push({
        key: `${m.id}|${dest}`,
        missionId: m.id,
        name: dest,
        cargos,
      });
    });
  });

  return planets;
}

const SYSTEMS = ['Tous', 'Stanton', 'Pyro', 'Nyx'];

export const Home: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const sysFilter = useMissionStore((s) => s.sysFilter);
  const setSysFilter = useMissionStore((s) => s.setSysFilter);

  const selectedShip = useShipStore((s) => s.selectedShip);

  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const planetGroups = buildGroups(activeMissions, sysFilter);
  const entries = Object.entries(planetGroups);

  const totalActiveScu = activeMissions.reduce(
    (sum, m) => sum + m.cargos.reduce((s, c) => s + c.scu, 0),
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
