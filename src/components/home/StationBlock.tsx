import React, { useState } from 'react';
import { ResourceRow } from './ResourceRow';
import { Modal } from '../ui/Modal';
import { useMissionStore } from '../../store/useMissionStore';

interface StationBlockProps {
  stationKey: string;
  name: string;
  resources: Record<string, number>;
}

// Backward compat: old persisted data may have boolean values
function resolveDelivered(val: unknown, scu: number): number {
  if (val === true) return scu;
  if (!val) return 0;
  return val as number;
}

export const StationBlock: React.FC<StationBlockProps> = ({
  stationKey,
  name,
  resources,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const delivered = useMissionStore((s) => s.delivered);
  const setDeliveredAmount = useMissionStore((s) => s.setDeliveredAmount);
  const confirmStation = useMissionStore((s) => s.confirmStation);

  const totalScu = Object.values(resources).reduce((a, v) => a + v, 0);
  const delivScu = Object.entries(resources).reduce((a, [res, scu]) => {
    const amount = resolveDelivered(delivered[`${stationKey}|${res}`], scu);
    return a + Math.min(amount, scu);
  }, 0);
  const allDone = Object.entries(resources).every(
    ([res, scu]) => resolveDelivered(delivered[`${stationKey}|${res}`], scu) >= scu
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
          <div
            className="station-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </div>
        </div>
        {!collapsed && (
          <div className="station-resources">
            {Object.entries(resources).map(([res, scu]) => (
              <ResourceRow
                key={res}
                res={res}
                scu={scu}
                deliveredAmount={resolveDelivered(delivered[`${stationKey}|${res}`], scu)}
                onSetAmount={(amount) => setDeliveredAmount(stationKey, res, amount)}
              />
            ))}
          </div>
        )}
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
