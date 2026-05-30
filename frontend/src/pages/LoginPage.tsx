import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const { login, register, loading, error } = useAuthStore();

  function handleSubmit() {
    if (isRegister) {
      register(username, password);
    } else {
      login(username, password);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-text">SCHT</span>
          <span className="login-logo-sub">Hauling Ops Terminal</span>
        </div>
        <div className="login-form">
          <div className="login-title">{isRegister ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}</div>
          {error && <div className="login-error">{error}</div>}
          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="login-submit">
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? '…' : isRegister ? 'CREATE ACCOUNT' : 'LOGIN'}
            </button>
          </div>
          <button className="login-switch" onClick={() => setIsRegister((v) => !v)}>
            {isRegister ? 'ALREADY HAVE AN ACCOUNT?' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </div>
    </div>
  );
}
