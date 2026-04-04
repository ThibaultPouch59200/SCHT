import React from 'react';
import { useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

const pageTitles: Record<string, string> = {
  '/': 'DASHBOARD',
  '/operations': 'OPERATIONS',
  '/missions': 'MISSIONS',
  '/history': 'HISTORY',
  '/finance': 'FINANCE',
  '/info': 'INFO',
  '/settings': 'SETTINGS',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { username, logout } = useAuthStore();

  const title = pageTitles[location.pathname] ?? 'SC HAULING';

  return (
    <div className="topbar">
      <div className="topbar-title">
        HAULING OPS · <span>{title}</span>
      </div>
      <div className="topbar-sep" />
      <a
        className="topbar-repo-link"
        href="https://github.com/ThibaultPouch59200/SCHT"
        target="_blank"
        rel="noreferrer"
      >
        START THE PROJECT
      </a>
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
