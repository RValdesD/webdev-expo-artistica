import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute({ children, organizerOnly = false }: { children: ReactElement; organizerOnly?: boolean }) {
  const { user, loading, unavailable, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <section className="status" role="status">Comprobando sesión…</section>;
  if (unavailable) return <section className="status"><p role="alert">No pudimos comprobar tu sesión.</p><button onClick={() => void refresh()}>Reintentar</button></section>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (organizerOnly && user.role !== 'organizador') return <section className="status"><h1>Acceso restringido</h1><p>Esta sección está disponible solo para organizadores.</p></section>;
  return children;
}
