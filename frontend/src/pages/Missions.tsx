import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, Copy } from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { useListsStore } from '../store/useListsStore';
import { useShipStore } from '../store/useShipStore';
import { ComboSelect } from '../components/ui/ComboSelect';
import { CapacityGauge } from '../components/route/CapacityGauge';

interface CargoFormLine {
  id: number;
  res: string;
  scu: string;
  origin: string;
  dest: string;
}

function blankLine(id: number): CargoFormLine {
  return { id, res: '', scu: '', origin: '', dest: '' };
}

export const Missions: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const addMission = useMissionStore((s) => s.addMission);
  const deleteMission = useMissionStore((s) => s.deleteMission);
  const copyMission = useMissionStore((s) => s.copyMission);

  const locations = useListsStore((s) => s.locations);
  const resources = useListsStore((s) => s.resources);
  const addLocation = useListsStore((s) => s.addLocation);
  const addResource = useListsStore((s) => s.addResource);

  const selectedShip = useShipStore((s) => s.selectedShip);
  const loadSelectedShip = useShipStore((s) => s.loadSelectedShip);

  useEffect(() => {
    loadSelectedShip();
  }, [loadSelectedShip]);

  const locationNames = locations.map((l) => l.name);

  const cargoIdRef = useRef(1);
  const [cargoLines, setCargoLines] = useState<CargoFormLine[]>([blankLine(1)]);

  const addCargoLine = () => {
    cargoIdRef.current += 1;
    setCargoLines((lines) => [...lines, blankLine(cargoIdRef.current)]);
  };

  const removeCargoLine = (id: number) => {
    setCargoLines((lines) => lines.filter((l) => l.id !== id));
  };

  const updateCargo = (id: number, field: keyof Omit<CargoFormLine, 'id'>, value: string) => {
    setCargoLines((lines) => lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const resetForm = () => {
    cargoIdRef.current += 1;
    setCargoLines([blankLine(cargoIdRef.current)]);
  };

  const saveMission = () => {
    const cargos = cargoLines
      .map((l) => ({
        res: l.res.trim(),
        scu: Number.parseInt(l.scu, 10) || 0,
        origin: l.origin.trim(),
        dest: l.dest.trim(),
      }))
      .filter((c) => c.scu > 0);

    if (!cargos.length) {
      alert('Ajoute au moins une cargaison avec des SCU.');
      return;
    }

    addMission(cargos);
    resetForm();
  };

  const activeMissions = missions.filter((m) => !m.completedAt);
  const completedMissions = missions.filter((m) => m.completedAt);

  const renderMissionCard = (m: (typeof missions)[number], done: boolean) => (
    <div key={m.id} className={`ct-mission-card${done ? ' done' : ''}`}>
      <div className="ct-mission-head">
        <span className="ct-mission-id">MISSION #{m.id}</span>
        <div className="ct-mission-actions">
          <button className="ct-mission-btn" onClick={() => copyMission(m.id)}>
            <Copy size={11} style={{ marginRight: 5 }} />
            Copier
          </button>
          <button className="ct-mission-btn danger" onClick={() => deleteMission(m.id)}>
            <X size={11} style={{ marginRight: 5 }} />
            Supprimer
          </button>
        </div>
      </div>
      <div className="ct-mission-body">
        {m.cargos.map((c) => (
          <div key={c.id ?? `${c.res}-${c.origin}-${c.dest}`} className="ct-mission-cargo">
            <span className="rt">
              {c.origin} <b>→</b> {c.dest}
            </span>
            <span>{c.res}</span>
            <span>{c.scu} SCU</span>
            <span className={`st ${c.status.toLowerCase()}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const loaded = missions
    .filter((m) => !m.completedAt)
    .flatMap((m) => m.cargos)
    .filter((c) => c.status === 'LOADED')
    .reduce((n, c) => n + c.scu, 0);

  const incoming = cargoLines.reduce((sum, l) => sum + (Number.parseInt(l.scu, 10) || 0), 0);

  return (
    <div className="ct-page">
      <div className="ct-page-bar">
        <CapacityGauge loaded={loaded} incoming={incoming} capacity={selectedShip?.scu ?? null} />
      </div>
      <div className="ct-content">
        <div className="ct-h">Nouvelle mission</div>
        <div className="ct-sub">Une ligne = une cargaison. Où la charger ▲, où la déposer ▼. C'est tout.</div>

        <div className="ct-form-head">
          <span>Commodité</span>
          <span>SCU</span>
          <span className="ld">▲ Charge</span>
          <span className="dp">▼ Dépôt</span>
          <span />
        </div>

        {cargoLines.map((line) => (
          <div key={line.id} className="ct-form-line">
            <div className="ct-form-in">
              <ComboSelect
                options={resources}
                value={line.res}
                onChange={(v) => updateCargo(line.id, 'res', v)}
                onCreateNew={(name) => addResource(name)}
                placeholder="Commodité…"
                style={{ width: '100%' }}
              />
            </div>
            <div className="ct-form-in num">
              <input
                type="number"
                min={1}
                placeholder="—"
                value={line.scu}
                onChange={(e) => updateCargo(line.id, 'scu', e.target.value)}
              />
            </div>
            <div className="ct-form-in load">
              <ComboSelect
                options={locationNames}
                value={line.origin}
                onChange={(v) => updateCargo(line.id, 'origin', v)}
                onCreateNew={(name) => addLocation({ name, system: 'Stanton', planet: 'Autre' })}
                placeholder="Station…"
                style={{ width: '100%' }}
              />
            </div>
            <div className="ct-form-in drop">
              <ComboSelect
                options={locationNames}
                value={line.dest}
                onChange={(v) => updateCargo(line.id, 'dest', v)}
                onCreateNew={(name) => addLocation({ name, system: 'Stanton', planet: 'Autre' })}
                placeholder="Station…"
                style={{ width: '100%' }}
              />
            </div>
            <button
              className="ct-form-rm"
              onClick={() => removeCargoLine(line.id)}
              aria-label="Supprimer cette cargaison"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button className="ct-form-add" onClick={addCargoLine}>
          <Plus size={12} style={{ marginRight: 6, verticalAlign: -2 }} />
          Ajouter une cargaison
        </button>

        <div className="ct-form-actions">
          <button className="ct-btn-save" onClick={saveMission}>
            Enregistrer
          </button>
          <button className="ct-btn-cancel" onClick={resetForm}>
            Annuler
          </button>
        </div>

        <div className="ct-h" style={{ marginTop: 28 }}>
          Missions actives
        </div>

        {activeMissions.length === 0 ? (
          <div className="ct-empty">Aucune mission active. Enregistre une mission ci-dessus.</div>
        ) : (
          activeMissions.map((m) => renderMissionCard(m, false))
        )}

        {completedMissions.length > 0 && (
          <>
            <div className="ct-dash-sec">Terminées</div>
            {completedMissions.map((m) => renderMissionCard(m, true))}
          </>
        )}
      </div>
    </div>
  );
};
