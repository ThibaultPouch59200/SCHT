import React, { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { useListsStore } from '../store/useListsStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ComboSelect } from '../components/ui/ComboSelect';
import { parseAmount, fmtShort } from '../utils/parseAmount';
import type { CargoLine } from '../types';

interface CargoFormLine {
  id: number;
  res: string;
  scu: string;
  dest: string;
  planet: string;
}

export const Missions: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const addMission = useMissionStore((s) => s.addMission);
  const deleteMission = useMissionStore((s) => s.deleteMission);

  const locations = useListsStore((s) => s.locations);
  const resources = useListsStore((s) => s.resources);
  const addLocation = useListsStore((s) => s.addLocation);
  const addResource = useListsStore((s) => s.addResource);

  const locationNames = locations.map((l) => l.name);

  const [formOpen, setFormOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [system, setSystem] = useState('Stanton');
  const [pay, setPay] = useState('');
  const [cargoLines, setCargoLines] = useState<CargoFormLine[]>([]);
  const cargoIdRef = useRef(0);

  const openForm = () => {
    cargoIdRef.current += 1;
    setOrigin('');
    setSystem('Stanton');
    setPay('');
    setCargoLines([{ id: cargoIdRef.current, res: '', scu: '', dest: '', planet: '' }]);
    setFormOpen(true);
  };

  const addCargoLine = () => {
    cargoIdRef.current += 1;
    setCargoLines((lines) => [
      ...lines,
      { id: cargoIdRef.current, res: '', scu: '', dest: '', planet: '' },
    ]);
  };

  const removeCargoLine = (id: number) => {
    setCargoLines((lines) => lines.filter((l) => l.id !== id));
  };

  const updateCargo = (id: number, field: keyof CargoFormLine, value: string) => {
    setCargoLines((lines) =>
      lines.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  // Origin created via "Créer" → add to locations using current system
  const handleOriginCreate = (name: string) => {
    addLocation({ name, system, planet: 'Autre' });
    setOrigin(name);
  };

  // Destination selected from list → auto-fill planet
  const handleDestSelect = (id: number, name: string) => {
    const loc = locations.find((l) => l.name === name);
    setCargoLines((lines) =>
      lines.map((l) =>
        l.id === id ? { ...l, dest: name, planet: loc ? loc.planet : l.planet } : l
      )
    );
  };

  // Destination created via "Créer" → add to locations using mission system
  const handleDestCreate = (id: number, name: string) => {
    const line = cargoLines.find((l) => l.id === id);
    const planet = line?.planet.trim() || 'Autre';
    addLocation({ name, system, planet });
    setCargoLines((lines) =>
      lines.map((l) => (l.id === id ? { ...l, dest: name } : l))
    );
  };

  const saveMission = () => {
    if (!origin.trim()) {
      alert('Remplis le lieu de récupération.');
      return;
    }
    const cargos: CargoLine[] = cargoLines
      .map((l) => ({
        res: l.res.trim() || 'Inconnu',
        scu: parseInt(l.scu) || 0,
        dest: l.dest.trim() || 'Station inconnue',
        planet: l.planet.trim() || 'Autre',
      }))
      .filter((c) => c.scu > 0);

    if (!cargos.length) {
      alert('Ajoute au moins une cargaison avec des SCU.');
      return;
    }

    // Auto-add values not yet in lists
    if (!locations.some((l) => l.name === origin.trim())) {
      addLocation({ name: origin.trim(), system, planet: 'Autre' });
    }
    cargos.forEach((c) => {
      if (c.res !== 'Inconnu' && !resources.includes(c.res)) addResource(c.res);
      if (c.dest !== 'Station inconnue' && !locations.some((l) => l.name === c.dest)) {
        addLocation({ name: c.dest, system, planet: c.planet });
      }
    });

    addMission({ origin: origin.trim(), system, pay: parseAmount(pay), cargos });
    setFormOpen(false);
  };

  return (
    <div className="page-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content">
        {!formOpen && (
          <button className="mission-add-btn" onClick={openForm}>
            <Plus size={14} />
            Nouvelle mission
          </button>
        )}

        {formOpen && (
          <div className="mission-form-panel">
            <div className="form-title">// Enregistrement mission cargo</div>
            <div className="form-grid-3">
              <div className="form-field">
                <label>Lieu de récupération</label>
                <ComboSelect
                  options={locationNames}
                  value={origin}
                  onChange={(v) => {
                    setOrigin(v);
                    const loc = locations.find((l) => l.name === v);
                    if (loc) setSystem(loc.system);
                  }}
                  onCreateNew={handleOriginCreate}
                  placeholder="Ex: Everus Harbor"
                />
              </div>
              <div className="form-field">
                <label>Système stellaire</label>
                <select value={system} onChange={(e) => setSystem(e.target.value)}>
                  <option>Stanton</option>
                  <option>Pyro</option>
                  <option>Nyx</option>
                </select>
              </div>
              <div className="form-field">
                <label>Paiement mission (aUEC)</label>
                <input
                  type="text"
                  placeholder="Ex: 90k · 1.5M · 450000"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                />
                <div className="form-hint">90k = 90 000 · 1.5M = 1 500 000</div>
              </div>
            </div>

            <div className="cargo-section-title">// Cargaisons — lieux de livraison</div>
            <div className="cargo-inputs">
              {cargoLines.map((line) => {
                const destInList = locations.some((l) => l.name === line.dest);
                const showPlanet = line.dest.trim().length > 0 && !destInList;
                return (
                  <div key={line.id} className="cargo-input-row">
                    <ComboSelect
                      options={resources}
                      value={line.res}
                      onChange={(v) => updateCargo(line.id, 'res', v)}
                      onCreateNew={(name) => {
                        addResource(name);
                        updateCargo(line.id, 'res', name);
                      }}
                      placeholder="Matière"
                      style={{ flex: 2 }}
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="SCU"
                      style={{ flex: '0 0 72px' }}
                      value={line.scu}
                      onChange={(e) => updateCargo(line.id, 'scu', e.target.value)}
                    />
                    <ComboSelect
                      options={locationNames}
                      value={line.dest}
                      onChange={(v) => handleDestSelect(line.id, v)}
                      onCreateNew={(name) => handleDestCreate(line.id, name)}
                      placeholder="Destination"
                      style={{ flex: 2 }}
                    />
                    {showPlanet && (
                      <input
                        type="text"
                        placeholder="Planète"
                        style={{ flex: '0 0 110px' }}
                        value={line.planet}
                        onChange={(e) => updateCargo(line.id, 'planet', e.target.value)}
                      />
                    )}
                    <button
                      className="cargo-rm"
                      onClick={() => removeCargoLine(line.id)}
                      aria-label="Supprimer cette cargaison"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="add-cargo-line" onClick={addCargoLine}>
              + Ajouter destination / matière
            </button>

            <div className="form-actions">
              <button className="btn-confirm" onClick={saveMission}>
                Enregistrer mission
              </button>
              <button className="btn-cancel-form" onClick={() => setFormOpen(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="section-head" style={{ marginTop: '4px' }}>
          <h2>Missions enregistrées</h2>
        </div>

        <div className="missions-list">
          {missions.filter((m) => !completedIds.includes(m.id)).length === 0 ? (
            <div className="empty-state">
              // NO ACTIVE MISSIONS
              <br />
              Crée une nouvelle mission ou consulte l'historique.
            </div>
          ) : (
            missions.filter((m) => !completedIds.includes(m.id)).map((m) => {
              const allDone = false;
              const totalScu = m.cargos.reduce((a, c) => a + c.scu, 0);
              const uniqueDests = [...new Set(m.cargos.map((c) => c.dest))];

              const byDest: Record<string, typeof m.cargos> = {};
              m.cargos.forEach((c) => {
                if (!byDest[c.dest]) byDest[c.dest] = [];
                byDest[c.dest].push(c);
              });

              return (
                <div key={m.id} className={`mission-card${allDone ? ' done-mission' : ''}`}>
                  <div className="mission-card-header">
                    <div className="mission-route-info">
                      <div className="mission-route">
                        {m.origin}
                        <span className="arr">→</span>
                        [{uniqueDests.length} dest.]
                      </div>
                      <div className="mission-meta">
                        Système<span>{m.system}</span>{totalScu} SCU total
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mission-pay-label">PAIEMENT</div>
                      <div className="mission-pay">
                        {m.pay > 0 ? `${fmtShort(m.pay)} aUEC` : '—'}
                      </div>
                    </div>
                    <StatusBadge variant={allDone ? 'done' : 'active'} />
                    <button
                      className="mission-del"
                      onClick={() => deleteMission(m.id)}
                      aria-label="Supprimer cette mission"
                    >
                      SUPPR.
                    </button>
                  </div>
                  <div className="mission-card-body">
                    <div className="delivery-targets">
                      {Object.entries(byDest).map(([dest, cgs]) => (
                        <div key={dest} className="delivery-target">
                          <div className="dt-arrow">▶</div>
                          <div className="dt-dest">{dest}</div>
                          <div className="dt-res">
                            {cgs.map((c) => c.res).join(', ')}
                          </div>
                          <div className="dt-scu">
                            {cgs.reduce((a, c) => a + c.scu, 0)} SCU
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
