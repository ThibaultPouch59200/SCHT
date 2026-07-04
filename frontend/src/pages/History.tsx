import React from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useMissionStore } from '../store/useMissionStore';

export const History: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const copyMission = useMissionStore((s) => s.copyMission);
  const deleteMission = useMissionStore((s) => s.deleteMission);

  const completed = missions
    .filter((m) => !!m.completedAt)
    .slice()
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  return (
    <div className="ct-page">
      <div className="ct-content">
        <div className="ct-h">Journal</div>
        <div className="ct-sub">Missions terminées, de la plus récente à la plus ancienne.</div>

        {completed.length === 0 ? (
          <div className="ct-empty">Aucune mission terminée. Les missions livrées apparaîtront ici.</div>
        ) : (
          completed.map((m) => {
            const totalScu = m.cargos.reduce((n, c) => n + c.scu, 0);
            const uniqueDests = [...new Set(m.cargos.map((c) => c.dest))];
            const completedAt = new Date(m.completedAt!).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
            });

            return (
              <div key={m.id} className="ct-mission-card">
                <div className="ct-mission-head">
                  <span className="ct-mission-id">MISSION #{m.id} · {completedAt}</span>
                  <div className="ct-mission-actions">
                    <button className="ct-mission-btn" onClick={() => copyMission(m.id)}>
                      <RotateCcw size={11} style={{ marginRight: 5 }} />
                      Rejouer
                    </button>
                    <button className="ct-mission-btn danger" onClick={() => deleteMission(m.id)}>
                      <X size={11} style={{ marginRight: 5 }} />
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="ct-mission-stats">
                  <span>{uniqueDests.length} station{uniqueDests.length > 1 ? 's' : ''} de destination</span>
                  <span>{totalScu} SCU livrées</span>
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
          })
        )}
      </div>
    </div>
  );
};
