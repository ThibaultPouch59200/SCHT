import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, ChevronRight, Download, Upload, FileDown } from 'lucide-react';
import { useListsStore } from '../store/useListsStore';
import { useShipStore } from '../store/useShipStore';
import { STANTON_LOCATIONS } from '../data/stantonLocations';
import type { Ship } from '../types';

const STORE_KEYS = ['scht-missions', 'scht-finance', 'scht-lists'] as const;

function exportData() {
  const snapshot: Record<string, unknown> = { _version: 1, _exportedAt: new Date().toISOString() };
  STORE_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    snapshot[key] = raw ? JSON.parse(raw) : null;
  });
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scht-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file: File, onDone: (ok: boolean, msg: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      let imported = 0;
      STORE_KEYS.forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          localStorage.setItem(key, JSON.stringify(data[key]));
          imported++;
        }
      });
      if (imported === 0) {
        onDone(false, 'Fichier invalide — aucune donnée reconnue.');
        return;
      }
      onDone(true, `Import réussi (${imported} store(s)). Rechargement…`);
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      onDone(false, 'Fichier JSON invalide.');
    }
  };
  reader.readAsText(file);
}

const SYSTEMS = ['Stanton', 'Pyro', 'Nyx'];

export const Settings: React.FC = () => {
  const locations = useListsStore((s) => s.locations);
  const resources = useListsStore((s) => s.resources);
  const addLocation = useListsStore((s) => s.addLocation);
  const removeLocation = useListsStore((s) => s.removeLocation);
  const addResource = useListsStore((s) => s.addResource);
  const removeResource = useListsStore((s) => s.removeResource);

  const ships = useShipStore((s) => s.ships);
  const selectedShip = useShipStore((s) => s.selectedShip);
  const fetchShips = useShipStore((s) => s.fetchShips);
  const loadSelectedShip = useShipStore((s) => s.loadSelectedShip);
  const setSelectedShip = useShipStore((s) => s.setSelectedShip);

  useEffect(() => {
    fetchShips();
    loadSelectedShip();
  }, [fetchShips, loadSelectedShip]);

  const SHIP_CATEGORIES = ['Petit cargo', 'Cargo moyen', 'Gros cargo'];

  const handleShipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedShip(null);
      return;
    }
    const ship = ships.find((s: Ship) => String(s.id) === val);
    if (ship) setSelectedShip(ship);
  };

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

  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importData(file, (ok, msg) => setImportStatus({ ok, msg }));
    e.target.value = '';
  };

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

        {/* MON VAISSEAU */}
        <div className="settings-section">
          <div className="settings-section-title">// Mon vaisseau</div>
          <div className="ship-select-row">
            <select
              className="ship-select"
              value={selectedShip ? String(selectedShip.id) : ''}
              onChange={handleShipChange}
            >
              <option value="">— Choisir un vaisseau —</option>
              {SHIP_CATEGORIES.map((cat) => {
                const catShips = ships.filter((s: Ship) => s.category === cat);
                if (catShips.length === 0) return null;
                return (
                  <optgroup key={cat} label={cat}>
                    {catShips.map((s: Ship) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} — {s.manufacturer} — {s.scu} SCU
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {selectedShip && (
              <div className="ship-selected-info">
                <span className="ship-selected-name">{selectedShip.name}</span>
                <span className="ship-selected-meta">{selectedShip.manufacturer} · {selectedShip.scu} SCU · {selectedShip.category}</span>
              </div>
            )}
          </div>
        </div>

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

        {/* EXPORT / IMPORT */}
        <div className="settings-section">
          <div className="settings-section-title">// Sauvegarde des données</div>
          <div className="backup-row">
            <div className="backup-card">
              <div className="backup-card-title">Exporter</div>
              <div className="backup-card-desc">
                Télécharge un fichier JSON contenant toutes tes missions, transactions et listes.
              </div>
              <button className="backup-btn export-btn" onClick={exportData}>
                <FileDown size={13} style={{ marginRight: 7 }} />
                Exporter les données
              </button>
            </div>

            <div className="backup-card">
              <div className="backup-card-title">Importer</div>
              <div className="backup-card-desc">
                Restaure un fichier exporté. Les données actuelles seront remplacées.
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                className="backup-btn import-btn"
                onClick={() => { setImportStatus(null); fileInputRef.current?.click(); }}
              >
                <Upload size={13} style={{ marginRight: 7 }} />
                Importer un fichier
              </button>
              {importStatus && (
                <div className={`backup-status${importStatus.ok ? ' ok' : ' err'}`}>
                  {importStatus.msg}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
