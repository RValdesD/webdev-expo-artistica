import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../services/auth';
import '../styles/auth.css';

export default function AuthNav() {
  const { user, loading, unavailable, refresh, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setBusy(true);
    setError('');
    try { await logout(); } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setBusy(false); }
  }

  if (loading) return <span role="status">Cargando sesión…</span>;
  if (unavailable) return <button type="button" onClick={() => void refresh()}>Reintentar sesión</button>;

  return (
    <div className="auth-nav">
      {user ? (
        <>
          <Link to="/cuenta">{user.name}</Link>
          <button type="button" disabled={busy} onClick={handleLogout}>
            {busy ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </>
      ) : (
        <><Link to="/registro">Crear cuenta</Link><Link to="/login">Iniciar sesión</Link></>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
