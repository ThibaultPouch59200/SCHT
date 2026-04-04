import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Home } from './pages/Home';
import { Missions } from './pages/Missions';
import { History } from './pages/History';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { AppLoader } from './components/AppLoader';
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const theme = useThemeStore((s) => s.theme);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!token) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <AppLoader />
      <Sidebar />
      <div className="main">
        <Topbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/history" element={<History />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
