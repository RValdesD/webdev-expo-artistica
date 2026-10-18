import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../services/auth';
import '../styles/auth.css';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login({ username: username.trim(), password });
      setPassword('');
      const state = location.state;
      const destination = typeof state === 'object' && state !== null && 'from' in state
        && typeof (state as Record<'from', unknown>).from === 'string'
        ? (state as Record<'from', string>).from
        : '/workshops';
      navigate(destination, { replace: true });
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">EXPO / CLIENTES</p>
      <h1>Iniciar sesión</h1>
      {user ? (
        <p>Sesión iniciada como {user.name}. <Link to="/workshops">Ver talleres</Link>.</p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-username">Usuario o correo</label>
          <input id="login-username" autoComplete="username" required minLength={3} maxLength={254} value={username} onChange={event => setUsername(event.target.value)} disabled={busy} />
          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          {error && <p role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Iniciar sesión'}</button>
          <p>¿Primera visita? <Link to="/registro">Crea tu cuenta</Link>.</p>
        </form>
      )}
    </section>
  );
}
