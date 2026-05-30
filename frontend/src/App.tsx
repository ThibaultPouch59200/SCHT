import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './AppShell';

function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <AppShell /> : <LoginPage />;
}

export default App;
