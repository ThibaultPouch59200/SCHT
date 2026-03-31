import React, { useState } from 'react';
import { X, Plus, ChevronRight, Download } from 'lucide-react';
import { useListsStore } from '../store/useListsStore';
import { STANTON_LOCATIONS } from '../data/stantonLocations';

const SYSTEMS = ['Stanton', 'Pyro', 'Nyx'];

export const Settings: React.FC = () => {
  const locations = useListsStore((s) => s.locations);
  const resources = useListsStore((s) => s.resources);
  const addLocation = useListsStore((s) => s.addLocation);
  const removeLocation = useListsStore((s) => s.removeLocation);
  const addResource = useListsStore((s) => s.addResource);
  const removeResource = useListsStore((s) => s.removeResource);

  const alreadyImported = STANTON_LOCATIONS.every((l) =>
    locations.some((existing) => existing.name === l.name)
  );

  const importStanton = () => {
    STANTON_LOCATIONS.forEach((loc) => {
      if (!locations.some((existing) => existing.name === loc.name)) {
        addLocation(loc);
      }
    });
  };

  const [newLocName, setNewLocName] = useState('');
  const [newLocPlanet, setNewLocPlanet] = useState('');
  const [newLocSystem, setNewLocSystem] = useState('Stanton');
  const [newResource, setNewResource] = useState('');

  // Collapsed state per system
  const [collapsedSystems, setCollapsedSystems] = useState<Record<string, boolean>>({});
  const [collapsedPlanets, setCollapsedPlanets] = useState<Record<string, boolean>>({});

  const toggleSystem = (sys: string) =>
    setCollapsedSystems((s) => ({ ...s, [sys]: !s[sys] }));
  const togglePlanet = (key: string) =>
    setCollapsedPlanets((s) => ({ ...s, [key]: !s[key] }));

  const handleAddLocation = () => {
    if (newLocName.trim()) {
      addLocation({
        name: newLocName.trim(),
        planet: newLocPlanet.trim() || 'Autre',
        system: newLocSystem,
      });
      setNewLocName('');
      setNewLocPlanet('');
    }
  };

  const handleAddResource = () => {
    if (newResource.trim()) {
      addResource(newResource.trim());
      setNewResource('');
    }
  };

  // Group locations: system → planet → locations[]
  const grouped: Record<string, Record<string, typeof locations>> = {};
  const sortedLocs = [...locations].sort((a, b) => {
    if (a.system !== b.system) return a.system.localeCompare(b.system);
    if (a.planet !== b.planet) return a.planet.localeCompare(b.planet);
    return a.name.localeCompare(b.name);
  });
  sortedLocs.forEach((loc) => {
    if (!grouped[loc.system]) grouped[loc.system] = {};
    if (!grouped[loc.system][loc.planet]) grouped[loc.system][loc.planet] = [];
    grouped[loc.system][loc.planet].push(loc);
  });

  const systemKeys = Object.keys(grouped).sort();

  return (
    <div className="page-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content">

        {/* LIEUX (origines + destinations fusionnés) */}
        <div className="settings-section">
          <div className="settings-section-title">// Lieux (récupération &amp; destinations)</div>

          {!alreadyImported && (
            <div style={{ marginBottom: 14 }}>
              <button className="import-stanton-btn" onClick={importStanton}>
                <Download size={12} style={{ marginRight: 6 }} />
                Importer Stanton ({STANTON_LOCATIONS.length} lieux)
              </button>
            </div>
          )}

          {locations.length === 0 && (
            <div className="empty-state" style={{ marginBottom: 12 }}>
              Aucun lieu enregistré.
            </div>
          )}

          {systemKeys.map((sys) => {
            const sysCollapsed = collapsedSystems[sys];
            const planetKeys = Object.keys(grouped[sys]).sort();
            return (
              <div key={sys} className="settings-tree-system">
                <div
                  className="settings-tree-system-header"
                  onClick={() => toggleSystem(sys)}
                >
                  <ChevronRight
                    size={12}
                    className={`tree-chevron${sysCollapsed ? '' : ' open'}`}
                  />
                  <span className="settings-tree-sys-label">{sys.toUpperCase()}</span>
                  <span className="settings-tree-count">
                    {Object.values(grouped[sys]).flat().length} lieux
                  </span>
                </div>

                {!sysCollapsed && planetKeys.map((planet) => {
                  const planetKey = `${sys}|${planet}`;
                  const planetCollapsed = collapsedPlanets[planetKey];
                  const locs = grouped[sys][planet];
                  return (
                    <div key={planet} className="settings-tree-planet">
                      <div
                        className="settings-tree-planet-header"
                        onClick={() => togglePlanet(planetKey)}
                      >
                        <ChevronRight
                          size={10}
                          className={`tree-chevron${planetCollapsed ? '' : ' open'}`}
                        />
                        <span className="settings-tree-planet-label">{planet}</span>
                        <span className="settings-tree-count">{locs.length}</span>
                      </div>

                      {!planetCollapsed && locs.map((loc) => (
                        <div key={loc.name} className="settings-tree-item">
                          <span className="settings-item-name">{loc.name}</span>
                          <button
                            className="settings-del-btn"
                            onClick={() => removeLocation(loc.name)}
                            aria-label={`Supprimer ${loc.name}`}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Add form */}
          <div className="settings-add-loc-form">
            <div className="settings-add-loc-row">
              <select
                value={newLocSystem}
                onChange={(e) => setNewLocSystem(e.target.value)}
                className="settings-loc-select"
              >
                {SYSTEMS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input
                type="text"
                placeholder="Planète (ex: MicroTech)"
                value={newLocPlanet}
                onChange={(e) => setNewLocPlanet(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                style={{ flex: 1 }}
              />
              <input
                type="text"
                placeholder="Lieu (ex: New Babbage)"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                style={{ flex: 2 }}
              />
              <button className="settings-add-btn" onClick={handleAddLocation}>
                <Plus size={12} style={{ marginRight: 4 }} />
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* RESSOURCES */}
        <div className="settings-section">
          <div className="settings-section-title">// Ressources / Matières</div>
          {resources.length === 0 && (
            <div className="empty-state" style={{ marginBottom: 12 }}>
              Aucune ressource enregistrée.
            </div>
          )}
          {resources.length > 0 && (
            <div className="settings-list settings-list-grid">
              {[...resources].sort().map((r) => (
                <div key={r} className="settings-item">
                  <span className="settings-item-name">{r}</span>
                  <button
                    className="settings-del-btn"
                    onClick={() => removeResource(r)}
                    aria-label={`Supprimer ${r}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="settings-add-row">
            <input
              type="text"
              placeholder="Matière (ex: Titanium)"
              value={newResource}
              onChange={(e) => setNewResource(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
            />
            <button className="settings-add-btn" onClick={handleAddResource}>
              <Plus size={12} style={{ marginRight: 4 }} />
              Ajouter
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
