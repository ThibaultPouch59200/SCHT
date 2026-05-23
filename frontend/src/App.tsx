import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavBar } from './components/layout/NavBar';
import { Home } from './pages/Home';
import { Missions } from './pages/Missions';
import { History } from './pages/History';
import { Info } from './pages/Info';
import { Settings } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { AppLoader } from './components/AppLoader';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <AppLoader />
      <div className="app">
        <NavBar />
        <div className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/operations" replace />} />
            <Route path="/operations" element={<Home />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/history" element={<History />} />
            <Route path="/info" element={<Info />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
