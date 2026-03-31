import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  stationName: string;
  resources: Record<string, number>;
  onConfirm: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  stationName,
  resources,
  onConfirm,
}) => {
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-head-title">Confirmer livraison complète</div>
          <div className="modal-station-name">{stationName}</div>
        </div>
        <div className="modal-body">
          {Object.entries(resources).map(([res, scu]) => (
            <div key={res} className="modal-item">
              <div className="modal-item-res">{res}</div>
              <div className="modal-item-scu">{scu} SCU</div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="modal-btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="modal-btn-ok" onClick={onConfirm}>
            Confirmer tout
          </button>
        </div>
      </div>
    </div>
  );
};
