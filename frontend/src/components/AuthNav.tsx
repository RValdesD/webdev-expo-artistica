import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiError } from '../services/auth';
import '../styles/auth.css';
import '../styles/profile.css';

export default function AuthNav() {
  const { user, loading, unavailable, refresh, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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
          <Link to="/mi-visita">Mi visita</Link>
          {user.role === 'organizador' && <Link to="/gestion">Gestión</Link>}
          {user.role === 'artista' ? <details className="avatar-menu" open={menuOpen} onToggle={event => setMenuOpen(event.currentTarget.open)} onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false); }}>
            <summary aria-label="Abrir menú de perfil">{user.avatarUrl ? <img className="header-avatar" src={user.avatarUrl} alt={user.name} /> : <span className="header-avatar">{user.name.slice(0, 1)}</span>}</summary>
            <div className="avatar-dropdown"><span>{user.name}</span><Link to="/mi-perfil" onClick={() => setMenuOpen(false)}>Mi perfil</Link></div>
          </details> : <span>{user.name}</span>}
          <button className="auth-nav__logout" type="button" disabled={busy} onClick={handleLogout}>
            {busy ? 'Cerrando…' : 'Cerrar sesión'}
          </button>


        </>
      ) : (
        <><Link to="/registro">Crear cuenta</Link>|<Link to="/login">Iniciar sesión</Link></>
      )}
      {error && <span className="auth-nav__error" role="alert">{error}</span>}
    </div>
  );
}
