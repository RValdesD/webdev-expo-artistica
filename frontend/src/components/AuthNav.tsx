import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuthStore } from '../stores/authStore';
import { apiError } from '../services/auth';
import '../styles/auth.css';

const roleLabels = { organizador: 'Administrador', artista: 'Artista', visitante: 'Visitante' } as const;

// Lado derecho del header. Con sesión: "Gestión" visible para organizadores y el resto
// de la cuenta (nombre, Mi visita, Mi perfil, Publicar, Cerrar sesión) en el menú del avatar,
// para que el header quepa en una sola fila.
export default function AuthNav() {
  const { user, loading, unavailable, refresh, logout } = useAuthStore();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => setAnchor(null);

  async function handleLogout() {
    close();
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
          {user.role === 'organizador' && <Link to="/gestion">Gestión</Link>}
          <IconButton
            className="auth-nav__avatar-button"
            aria-label="Abrir menú de cuenta"
            aria-controls={anchor ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={anchor ? 'true' : undefined}
            disabled={busy}
            onClick={event => setAnchor(event.currentTarget)}
          >
            <Avatar className="header-avatar" src={user.avatarUrl || undefined} alt="">
              {user.name.slice(0, 1).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            id="account-menu"
            anchorEl={anchor}
            open={Boolean(anchor)}
            onClose={close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { className: 'account-menu' } }}
            disableScrollLock
          >
            <li className="account-menu__identity" aria-hidden="true">
              <span className="auth-nav__name">{user.name}</span>
              <small>{roleLabels[user.role]}</small>
            </li>
            <Divider component="li" />
            {user.role === 'artista' && <MenuItem component={Link} to="/mi-perfil" onClick={close}>Mi perfil</MenuItem>}
            {user.role === 'artista' && <MenuItem component={Link} to="/publicar" onClick={close}>Publicar</MenuItem>}
            <MenuItem component={Link} to="/mi-visita" onClick={close}>Mi visita</MenuItem>
            <Divider component="li" />
            <MenuItem onClick={() => void handleLogout()}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </>
      ) : (
        <><Link to="/registro">Crear cuenta</Link>|<Link to="/login">Iniciar sesión</Link></>
      )}
      {busy && <span role="status">Cerrando sesión…</span>}
      {error && <span className="auth-nav__error" role="alert">{error}</span>}
    </div>
  );
}
