import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Home, Package, Clock, TrendingUp, Settings, CircleHelp } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { fmtShort } from '../../utils/parseAmount';
import { useBackendStatus } from '../../hooks/useBackendStatus';

export const Sidebar: React.FC = () => {
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const wallet = useFinanceStore((s) => s.wallet);

  const backendStatus = useBackendStatus();
  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const completedMissions = missions.filter((m) => completedIds.includes(m.id));
  const totalScu = missions.reduce(
    (acc, m) => acc + m.cargos.reduce((a, c) => a + c.scu, 0),
    0
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-top">Hauling Tracker</div>
        <div className="logo-main">
          SC<span>HT</span>
        </div>
        <div className="logo-sub">Hauling Tracker v3.2</div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Navigation</div>

        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <LayoutDashboard className="nav-icon" size={18} />
          Dashboard
        </NavLink>

        <NavLink
          to="/operations"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Home className="nav-icon" size={18} />
          Operations
        </NavLink>

        <NavLink
          to="/missions"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Package className="nav-icon" size={18} />
          Missions
          {activeMissions.length > 0 && (
            <span className="nav-badge">{activeMissions.length}</span>
          )}
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Clock className="nav-icon" size={18} />
          Historique
          {completedMissions.length > 0 && (
            <span className="nav-badge" style={{ borderColor: 'rgba(0,255,176,0.3)', color: 'var(--green)', background: 'var(--green-dim)' }}>
              {completedMissions.length}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/finance"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <TrendingUp className="nav-icon" size={18} />
          Finance
        </NavLink>

        <div className="nav-label" style={{ marginTop: 16 }}>Système</div>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Settings className="nav-icon" size={18} />
          Réglages
        </NavLink>

        <NavLink
          to="/info"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <CircleHelp className="nav-icon" size={18} />
          Info
        </NavLink>
      </nav>

      <div className="sidebar-status">
        <div className="status-row">
          <div className={`status-dot${backendStatus === 'offline' ? ' status-dot--offline' : backendStatus === 'checking' ? ' status-dot--checking' : ''}`} />
          {backendStatus === 'online' ? 'BACKEND ONLINE' : backendStatus === 'offline' ? 'BACKEND OFFLINE' : 'CONNECTING...'}
        </div>
        <div style={{ marginTop: '6px', color: 'var(--amber)', fontSize: '11px' }}>
          WALLET : {fmtShort(wallet)} aUEC
        </div>
        <div style={{ marginTop: '3px', fontSize: '10px' }}>
          {totalScu} SCU EN TRANSIT
        </div>
      </div>
    </aside>
  );
};
