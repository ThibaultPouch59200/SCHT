import React from 'react';
import { useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useMissionStore } from '../../store/useMissionStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { fmtShort } from '../../utils/parseAmount';

const pageTitles: Record<string, string> = {
  '/': 'HOME',
  '/missions': 'MISSIONS',
  '/finance': 'FINANCE',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const missions = useMissionStore((s) => s.missions);
  const completedIds = useMissionStore((s) => s.completedIds);
  const wallet = useFinanceStore((s) => s.wallet);
  const { theme, toggleTheme } = useThemeStore();
  const { username, logout } = useAuthStore();

  const activeMissions = missions.filter((m) => !completedIds.includes(m.id));
  const totalScu = missions.reduce(
    (acc, m) => acc + m.cargos.reduce((a, c) => a + c.scu, 0),
    0
  );

  const title = pageTitles[location.pathname] ?? 'SC HAULING';

  return (
    <div className="topbar">
      <div className="topbar-title">
        UEE · <span>{title}</span> · HAULING OPS
      </div>
      <div className="topbar-sep" />
      <div className="topbar-stat">
        MISSIONS <strong>{activeMissions.length}</strong>
      </div>
      <div className="topbar-stat" style={{ marginLeft: '16px' }}>
        SCU <strong>{totalScu}</strong>
      </div>
      <div className="topbar-stat" style={{ marginLeft: '16px' }}>
        WALLET <strong>{fmtShort(wallet)}</strong>
      </div>
      <span className="topbar-user">{username}</span>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <button className="theme-toggle" onClick={logout} title="Se déconnecter">
        <LogOut size={15} />
      </button>
    </div>
  );
};
