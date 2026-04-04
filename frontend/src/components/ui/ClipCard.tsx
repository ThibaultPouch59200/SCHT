import React from 'react';

interface ClipCardProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const clipPaths: Record<string, string> = {
  sm: 'polygon(8px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 0%)',
  md: 'polygon(12px 0%, 100% 0%, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0% 100%, 0% 0%)',
  lg: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0% 100%, 0% 0%)',
};

export const ClipCard: React.FC<ClipCardProps> = ({
  size = 'md',
  className = '',
  style,
  children,
}) => {
  return (
    <div
      className={className}
      style={{
        clipPath: clipPaths[size],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
