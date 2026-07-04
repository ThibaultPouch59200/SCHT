import React from 'react';
export const Clamp: React.FC<{ checked: boolean; disabled?: boolean; onToggle: () => void }> =
  ({ checked, disabled, onToggle }) => (
    <button type="button" className={`ct-clamp${checked ? ' on' : ''}`} disabled={disabled}
      aria-pressed={checked} onClick={onToggle} />
  );
