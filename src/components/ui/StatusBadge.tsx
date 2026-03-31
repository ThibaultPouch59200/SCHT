import React from 'react';

interface StatusBadgeProps {
  variant: 'active' | 'done' | 'mission' | 'wallet';
  children?: React.ReactNode;
}

const variantMap: Record<string, { className: string; label: string }> = {
  active: { className: 'mission-status-badge badge-active', label: 'ACTIF' },
  done: { className: 'mission-status-badge badge-done', label: 'LIVRÉ' },
  mission: { className: 'txn-type mission', label: 'MISSION' },
  wallet: { className: 'txn-type wallet', label: 'WALLET' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children }) => {
  const config = variantMap[variant];
  return (
    <span className={config.className}>
      {children ?? config.label}
    </span>
  );
};
