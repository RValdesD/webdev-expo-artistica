import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../services/auth';
import '../styles/auth.css';

export default function AuthNav() {
  const { client, loading, unavailable, refresh, logout } = useAuth();
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
      {client ? (
        <>
          <span>{client.name}</span>
          <button type="button" disabled={busy} onClick={handleLogout}>
            {busy ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </>
      ) : (
        <><Link to="/signup">Crear cuenta</Link>/<Link to="/login">Iniciar sesión</Link></>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
