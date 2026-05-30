import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, loading, error, clearError } = useAuthStore();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isRegister) {
      register(username, password);
    } else {
      login(username, password);
    }
  }

  function switchMode() {
    clearError();
    setIsRegister((v) => !v);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-text">SCHT</span>
          <span className="login-logo-sub">Hauling Ops Terminal</span>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-title">{isRegister ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}</div>
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="login-submit">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '…' : isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>
          </div>
        </form>
        <button type="button" className="login-switch" onClick={switchMode}>
          {isRegister ? 'ALREADY HAVE AN ACCOUNT?' : 'CREATE ACCOUNT'}
        </button>
      </div>
    </div>
  );
}
