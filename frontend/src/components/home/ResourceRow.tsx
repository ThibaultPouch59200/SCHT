import React from 'react';

interface ResourceRowProps {
  res: string;
  scu: number;
  deliveredAmount: number;
  onSetAmount: (amount: number) => void;
}

export const ResourceRow: React.FC<ResourceRowProps> = ({
  res,
  scu,
  deliveredAmount,
  onSetAmount,
}) => {
  const isFull = deliveredAmount >= scu;
  const isPartial = deliveredAmount > 0 && deliveredAmount < scu;

  return (
    <div className={`resource-row${isFull ? ' delivered' : isPartial ? ' partial' : ''}`}>
      <div className="res-name">{res}</div>
      <input
        className="res-scu-input"
        type="number"
        min={0}
        max={scu}
        value={deliveredAmount === 0 ? '' : deliveredAmount}
        placeholder="0"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const val = Math.min(scu, Math.max(0, Number(e.target.value) || 0));
          onSetAmount(val);
        }}
      />
      <div className="res-unit">/ {scu} SCU</div>
      <div
        className={`res-check${isFull ? ' checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSetAmount(isFull ? 0 : scu);
        }}
      >
        {isFull ? '✓' : ''}
      </div>
    </div>
  );
};
