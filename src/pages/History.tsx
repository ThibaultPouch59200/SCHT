import React, { useState, useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';
import { fmtShort } from '../utils/parseAmount';
import type { CargoLine, Mission } from '../types';

interface ReplayLine {
  id: number;
  res: string;
  scu: string;
  dest: string;
  planet: string;
}

function toReplayLines(mission: Mission): ReplayLine[] {
  let ctr = 0;
  return mission.cargos.map((c) => ({
    id: ++ctr,
    res: c.res,
    scu: String(c.scu),
    dest: c.dest,
    planet: c.planet,
  }));
}

export const History: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const deleteMission = useMissionStore((s) => s.deleteMission);
  const replayMission = useMissionStore((s) => s.replayMission);

  const completed = missions
    .filter((m) => completedIds.includes(m.id))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [replayId, setReplayId] = useState<number | null>(null);
  const [replayLines, setReplayLines] = useState<ReplayLine[]>([]);
  const [replayPay, setReplayPay] = useState('');
  const lineIdRef = useRef(100);

  const openReplay = (m: Mission) => {
    setReplayId(m.id);
    setReplayLines(toReplayLines(m));
    setReplayPay(m.pay > 0 ? String(m.pay) : '');
  };

  const closeReplay = () => setReplayId(null);

  const updateLine = (id: number, field: keyof ReplayLine, value: string) => {
    setReplayLines((lines) =>
      lines.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const addLine = (m: Mission) => {
    lineIdRef.current += 1;
    setReplayLines((lines) => [
      ...lines,
      { id: lineIdRef.current, res: '', scu: '', dest: '', planet: m.system },
    ]);
  };

  const removeLine = (id: number) => {
    setReplayLines((lines) => lines.filter((l) => l.id !== id));
  };

  const confirmReplay = () => {
    if (replayId === null) return;
    const cargos: CargoLine[] = replayLines
      .map((l) => ({
        res: l.res.trim() || 'Inconnu',
        scu: parseInt(l.scu) || 0,
        dest: l.dest.trim() || 'Station inconnue',
        planet: l.planet.trim() || 'Autre',
      }))
      .filter((c) => c.scu > 0);

    if (!cargos.length) {
      alert('Ajoute au moins une cargaison avec des SCU > 0.');
      return;
    }

    replayMission(replayId, cargos);
    setReplayId(null);
  };

  return (
    <div className="page-anim" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="content">
        <div className="section-head">
          <h2>Historique des missions</h2>
        </div>

        <div className="missions-list">
          {completed.length === 0 ? (
            <div className="empty-state">
              // NO COMPLETED MISSIONS
              <br />
              Les missions livrées apparaîtront ici.
            </div>
          ) : (
            completed.map((m) => {
              const isReplaying = replayId === m.id;
              const totalScu = m.cargos.reduce((a, c) => a + c.scu, 0);
              const uniqueDests = [...new Set(m.cargos.map((c) => c.dest))];
              const byDest: Record<string, typeof m.cargos> = {};
              m.cargos.forEach((c) => {
                if (!byDest[c.dest]) byDest[c.dest] = [];
                byDest[c.dest].push(c);
              });
              const completedAt = new Date(m.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              });

              return (
                <div key={m.id} className="mission-card history-card">
                  <div className="mission-card-header">
                    <div className="mission-route-info">
                      <div className="mission-route">
                        {m.origin}
                        <span className="arr">→</span>
                        [{uniqueDests.length} dest.]
                      </div>
                      <div className="mission-meta">
                        Système<span>{m.system}</span>{totalScu} SCU
                        <span className="history-date">· {completedAt}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mission-pay-label">PAIEMENT</div>
                      <div className="mission-pay">
                        {m.pay > 0 ? `${fmtShort(m.pay)} aUEC` : '—'}
                      </div>
                    </div>
                    <button
                      className="replay-btn"
                      onClick={() => isReplaying ? closeReplay() : openReplay(m)}
                      title="Reprendre cette mission"
                    >
                      <RotateCcw size={12} style={{ marginRight: 5 }} />
                      {isReplaying ? 'Annuler' : 'Reprendre'}
                    </button>
                    <button
                      className="mission-del"
                      onClick={() => deleteMission(m.id)}
                      aria-label="Supprimer"
                    >
                      SUPPR.
                    </button>
                  </div>

                  {!isReplaying && (
                    <div className="mission-card-body">
                      <div className="delivery-targets">
                        {Object.entries(byDest).map(([dest, cgs]) => (
                          <div key={dest} className="delivery-target">
                            <div className="dt-arrow">▶</div>
                            <div className="dt-dest">{dest}</div>
                            <div className="dt-res">{cgs.map((c) => c.res).join(', ')}</div>
                            <div className="dt-scu">{cgs.reduce((a, c) => a + c.scu, 0)} SCU</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isReplaying && (
                    <div className="replay-panel">
                      <div className="replay-panel-title">// Nouvelle run — ajuste les SCU si besoin</div>
                      <div className="replay-lines">
                        {replayLines.map((line) => (
                          <div key={line.id} className="replay-line">
                            <input
                              className="replay-input"
                              type="text"
                              placeholder="Matière"
                              value={line.res}
                              style={{ flex: 2 }}
                              onChange={(e) => updateLine(line.id, 'res', e.target.value)}
                            />
                            <input
                              className="replay-input replay-scu"
                              type="number"
                              min={1}
                              placeholder="SCU"
                              value={line.scu}
                              onChange={(e) => updateLine(line.id, 'scu', e.target.value)}
                            />
                            <input
                              className="replay-input"
                              type="text"
                              placeholder="Destination"
                              value={line.dest}
                              style={{ flex: 2 }}
                              onChange={(e) => updateLine(line.id, 'dest', e.target.value)}
                            />
                            <button
                              className="cargo-rm"
                              onClick={() => removeLine(line.id)}
                              aria-label="Supprimer"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="add-cargo-line" onClick={() => addLine(m)}>
                        + Ajouter ligne
                      </button>
                      <div className="replay-pay-row">
                        <label className="replay-pay-label">Paiement (aUEC)</label>
                        <input
                          className="replay-input"
                          type="text"
                          placeholder="Ex: 90k · 1.5M"
                          value={replayPay}
                          style={{ width: 140 }}
                          onChange={(e) => setReplayPay(e.target.value)}
                        />
                      </div>
                      <div className="form-actions" style={{ marginTop: 12 }}>
                        <button className="btn-confirm" onClick={confirmReplay}>
                          Lancer la mission
                        </button>
                        <button className="btn-cancel-form" onClick={closeReplay}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
