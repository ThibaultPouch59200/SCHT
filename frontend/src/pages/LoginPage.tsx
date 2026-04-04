import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, loading, error, clearError } = useAuthStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'login') {
      login(username, password);
    } else {
      register(username, password);
    }
  }

  function switchMode() {
    clearError();
    setMode((m) => (m === 'login' ? 'register' : 'login'));
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-text">SCHT</span>
          <span className="login-logo-sub">SC Hauling Tracker</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="login-title">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username">Identifiant</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary login-submit" disabled={loading}>
            {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <button className="login-switch" onClick={switchMode} disabled={loading}>
          {mode === 'login'
            ? "Pas encore de compte ? S'inscrire"
            : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  );
}
