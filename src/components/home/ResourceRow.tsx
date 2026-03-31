import React from 'react';

interface ResourceRowProps {
  res: string;
  scu: number;
  delivered: boolean;
  onToggle: () => void;
}

export const ResourceRow: React.FC<ResourceRowProps> = ({
  res,
  scu,
  delivered,
  onToggle,
}) => {
  return (
    <div className={`resource-row${delivered ? ' delivered' : ''}`}>
      <div className="res-name">{res}</div>
      <div className="res-scu">{scu}</div>
      <div className="res-unit">SCU</div>
      <div
        className={`res-check${delivered ? ' checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {delivered ? '✓' : ''}
      </div>
    </div>
  );
};
