import React, { useState } from 'react';
import { ResourceRow } from './ResourceRow';
import { Modal } from '../ui/Modal';
import { useMissionStore } from '../../store/useMissionStore';
import type { StationInfo } from '../../pages/Home';

interface StationBlockProps {
  station: StationInfo;
}

export const StationBlock: React.FC<StationBlockProps> = ({ station }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const deliveredById = useMissionStore((s) => s.deliveredById);
  const setDeliveredAmount = useMissionStore((s) => s.setDeliveredAmount);
  const confirmStation = useMissionStore((s) => s.confirmStation);

  const totalScu = station.cargos.reduce((a, c) => a + c.scu, 0);
  const delivScu = station.cargos.reduce(
    (a, c) => a + Math.min(deliveredById[c.id] ?? 0, c.scu),
    0
  );
  const allDone = station.cargos.every((c) => (deliveredById[c.id] ?? 0) >= c.scu);

  const handleConfirm = () => {
    confirmStation(station.missionId, station.name);
    setModalOpen(false);
  };

  // Build resources map for Modal (res -> scu)
  const resourcesForModal: Record<string, number> = {};
  station.cargos.forEach((c) => {
    resourcesForModal[c.res] = (resourcesForModal[c.res] ?? 0) + c.scu;
  });

  return (
    <>
      <div className={`station-block${allDone ? ' all-done' : ''}`}>
        <div
          className="station-header"
          onClick={() => { if (!allDone) setModalOpen(true); }}
        >
          <div className="station-title">
            {station.name}
            {allDone ? ' ✓' : ''}
          </div>
          <div>
            <div className="scu-label">TOTAL</div>
            <div className="scu-val scu-total-val">{totalScu} SCU</div>
          </div>
          <div>
            <div className="scu-label">LIVRÉ</div>
            <div className="scu-val scu-deliv-val">{delivScu} SCU</div>
          </div>
          {allDone ? (
            <div className="confirm-all-btn done-btn">Livré ✓</div>
          ) : (
            <div
              className="confirm-all-btn"
              onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            >
              Tout confirmer
            </div>
          )}
          <div
            className="station-collapse-btn"
            onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </div>
        </div>
        {!collapsed && (
          <div className="station-resources">
            {station.cargos.map((c) => (
              <ResourceRow
                key={c.id}
                res={c.res}
                scu={c.scu}
                deliveredAmount={deliveredById[c.id] ?? 0}
                onSetAmount={(amount) =>
                  setDeliveredAmount(station.missionId, c.id, amount)
                }
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stationName={station.name}
        resources={resourcesForModal}
        onConfirm={handleConfirm}
      />
    </>
  );
};
