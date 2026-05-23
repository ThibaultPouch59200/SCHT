import React from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, Package, Clock, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { useAuthStore } from '../../store/useAuthStore';

export const NavBar: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const deliveredById = useMissionStore((s) => s.deliveredById);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const totalScu = activeMissions.reduce(
    (acc, m) =>
      acc +
      m.cargos.reduce(
        (a, c) => a + Math.max(0, c.scu - (c.id != null ? (deliveredById[c.id] ?? 0) : 0)),
        0
      ),
    0
  );

  return (
    <header className="navbar">
      <div className="navbar-logo">
        SC<span>HT</span>
      </div>

      <nav className="nav-dock">
        <NavLink
          to="/operations"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          <Truck size={15} />
          Opérations
        </NavLink>

        <NavLink
          to="/missions"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          <Package size={15} />
          Missions
          {activeMissions.length > 0 && (
            <span className="nav-badge">{activeMissions.length}</span>
          )}
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          <Clock size={15} />
          Historique
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          <Settings size={15} />
          Réglages
        </NavLink>

        <NavLink
          to="/info"
          className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
        >
          <HelpCircle size={15} />
          Info
        </NavLink>
      </nav>

      <div className="navbar-right">
        <span className="navbar-status">
          <strong>{totalScu}</strong> SCU en transit
        </span>
        <span className="topbar-user">{username}</span>
        <button className="navbar-logout" onClick={logout} title="Se déconnecter">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};
