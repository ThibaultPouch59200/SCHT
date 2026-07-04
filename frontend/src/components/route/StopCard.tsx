import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Stop } from '../../lib/route';
import { Clamp } from './Clamp';
import { useMissionStore } from '../../store/useMissionStore';

interface StopCardProps {
  stop: Stop; leg: number;
  onMoveUp: () => void; onMoveDown: () => void;
  canUp: boolean; canDown: boolean;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, leg, onMoveUp, onMoveDown, canUp, canDown }) => {
  const setStatus = useMissionStore((s) => s.setCargoStatus);
  return (
    <div className={`ct-stop${stop.done ? ' done' : ''}`}>
      <div className="ct-index">
        <div className="code">{stop.code}</div>
        <div className="leg">LEG {String(leg).padStart(2, '0')}</div>
        <div className="ct-reorder">
          <button className="ct-arrow" onClick={onMoveUp} disabled={!canUp} aria-label="Monter l'arrêt"><ChevronUp size={14} /></button>
          <button className="ct-arrow" onClick={onMoveDown} disabled={!canDown} aria-label="Descendre l'arrêt"><ChevronDown size={14} /></button>
        </div>
      </div>
      <div className="ct-stop-main">
        <div className="ct-station">{stop.station}<small>{stop.planet}</small></div>
        {stop.drops.length > 0 && (
          <>
            <div className="ct-op ct-op-drop">▼ DÉPÔT</div>
            {stop.drops.map((d) => (
              <div key={`d${d.cargoId}`} className={`ct-row${d.locked ? ' lock' : ''}`}>
                <Clamp checked={d.status === 'DELIVERED'} disabled={d.locked}
                  onToggle={() => setStatus(d.missionId, d.cargoId, d.status === 'DELIVERED' ? 'LOADED' : 'DELIVERED')} />
                <span className="ct-nm">{d.res}</span><span className="ct-scu">{d.scu} SCU</span>
                <span className="ct-mn">M#{d.missionId}</span>
              </div>
            ))}
            {stop.drops.some((d) => d.locked) && <div className="ct-stripe" />}
            {stop.drops.filter((d) => d.locked).map((d) => (
              <div key={`n${d.cargoId}`} className="ct-note">⊘ VERROUILLÉ — CHARGER À {d.loadCode}</div>
            ))}
          </>
        )}
        {stop.loads.length > 0 && (
          <>
            <div className="ct-op ct-op-load">▲ CHARGEMENT</div>
            {stop.loads.map((l) => (
              <div key={`l${l.cargoId}`} className="ct-row">
                <Clamp checked={l.status !== 'PENDING'}
                  onToggle={() => setStatus(l.missionId, l.cargoId, l.status === 'PENDING' ? 'LOADED' : l.status === 'LOADED' ? 'PENDING' : 'LOADED')} />
                <span className="ct-nm">{l.res}</span><span className="ct-scu">{l.scu} SCU</span>
                <span className="ct-mn">M#{l.missionId}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
