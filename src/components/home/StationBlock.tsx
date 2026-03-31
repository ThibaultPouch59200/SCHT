import React, { useState } from 'react';
import { ResourceRow } from './ResourceRow';
import { Modal } from '../ui/Modal';
import { useMissionStore } from '../../store/useMissionStore';

interface StationBlockProps {
  stationKey: string;
  name: string;
  resources: Record<string, number>;
}

export const StationBlock: React.FC<StationBlockProps> = ({
  stationKey,
  name,
  resources,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const delivered = useMissionStore((s) => s.delivered);
  const toggleResource = useMissionStore((s) => s.toggleResource);
  const confirmStation = useMissionStore((s) => s.confirmStation);

  const totalScu = Object.values(resources).reduce((a, v) => a + v, 0);
  const delivScu = Object.entries(resources).reduce(
    (a, [res, scu]) => a + (delivered[`${stationKey}|${res}`] ? scu : 0),
    0
  );
  const allDone = Object.keys(resources).every(
    (res) => !!delivered[`${stationKey}|${res}`]
  );

  const handleConfirm = () => {
    confirmStation(stationKey, resources);
    setModalOpen(false);
  };

  return (
    <>
      <div className={`station-block${allDone ? ' all-done' : ''}`}>
        <div
          className="station-header"
          onClick={() => {
            if (!allDone) setModalOpen(true);
          }}
        >
          <div className="station-title">
            {name}
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
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
            >
              Tout confirmer
            </div>
          )}
        </div>
        <div className="station-resources">
          {Object.entries(resources).map(([res, scu]) => (
            <ResourceRow
              key={res}
              res={res}
              scu={scu}
              delivered={!!delivered[`${stationKey}|${res}`]}
              onToggle={() => toggleResource(stationKey, res)}
            />
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stationName={name}
        resources={resources}
        onConfirm={handleConfirm}
      />
    </>
  );
};
