import React from 'react';
import { NavLink } from 'react-router-dom';
import { Info, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_ITEMS = [
  { to: '/operations', label: 'Route' },
  { to: '/missions', label: 'Missions' },
  { to: '/history', label: 'Journal' },
  { to: '/settings', label: 'Réglages' },
];

export const NavBar: React.FC = () => {
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="ct-topbar">
      <div className="ct-brand">
        HAUL<b>{'//'}</b>OPS
      </div>

      <nav className="ct-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'on' : undefined)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="ct-topbar-actions">
        <NavLink
          to="/info"
          className={({ isActive }) => `ct-icon-btn${isActive ? ' on' : ''}`}
          title="Info"
        >
          <Info size={15} />
        </NavLink>
        <button className="ct-icon-btn" onClick={logout} title="Se déconnecter">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};
