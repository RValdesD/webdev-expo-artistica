import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import axiosSecure from '../utils/axiosSecure';
import usersService, { type Account } from '../services/users';
import { apiError } from '../services/auth';
import '../styles/registered-users.css';

const roles = { organizador: 'Administrador', artista: 'Artista', visitante: 'Visitante' };
const origins = { console: 'Consola', registration: 'Registro público', unknown: 'No registrado' };

export default function RegisteredUsers() {
  const { user: currentUser } = useAuthStore();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    usersService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setUsers(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  async function deleteUser(account: Account) {
    if (deleting || !window.confirm(`¿Eliminar la cuenta de ${account.name} (@${account.username})?\n\nSe eliminará su acceso y sus inscripciones a talleres. Su perfil de artista, obras e imágenes se conservarán. Esta acción no se puede deshacer.`)) return;
    setDeleting(account.id); setDeleteError(''); setMessage('');
    try {
      await axiosSecure.delete(`/api/users/${account.id}`);
      setUsers(list => list.filter(item => item.id !== account.id));
      setMessage(`Cuenta de ${account.username} eliminada.`);
    } catch (reason) { setDeleteError(apiError(reason)); }
    finally { setDeleting(null); }
  }

  const sections = [
    { title: 'Cuentas creadas por consola', users: users.filter(user => user.createdVia === 'console') },
    { title: 'Visitantes registrados', users: users.filter(user => user.createdVia === 'registration') },
    { title: 'Cuentas anteriores · origen no registrado', users: users.filter(user => user.createdVia === 'unknown') },
  ];
  return <section className="registered-users" aria-labelledby="registered-users-title">
    <h2 id="registered-users-title">Usuarios registrados</h2>
    <button className="button button--secondary" type="button" disabled={loading || deleting !== null} onClick={() => setAttempt(value => value + 1)}>Actualizar listado</button>
    {deleteError && <p role="alert">{deleteError} Puedes reintentar la eliminación para completar la limpieza de inscripciones.</p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p role="status">Cargando cuentas…</p> : error ? <p role="alert">{error} Usa «Actualizar listado» para reintentar.</p> : <>
      <p>Las cuentas se agrupan por su origen; el rol indica sus permisos actuales. Las cuentas anteriores a esta actualización no tienen un origen registrado.</p>
      {sections.map(section => <section key={section.title}>
        <h3>{section.title} ({section.users.length})</h3>
        {section.users.length === 0 ? <p>No hay cuentas en esta sección.</p> : <ul className="registered-users__list">
          {section.users.map(user => <li key={user.id}>
            <h4>{user.name}</h4>
            <dl>
              <dt>Usuario</dt><dd>{user.username}</dd>
              <dt>Correo</dt><dd>{user.email || 'Sin correo registrado'}</dd>
              <dt>Rol</dt><dd>{roles[user.role]}</dd>
              <dt>Origen</dt><dd>{origins[user.createdVia]}</dd>
              {user.role === 'artista' && <><dt>Perfil público</dt><dd>{user.artistProfile ? 'Publicado' : 'Pendiente: aún no lo guarda'}</dd></>}
            </dl>
            <button className="button button--secondary registered-users__delete" type="button"
              disabled={deleting !== null || user.id === currentUser?.id}
              aria-label={`Eliminar usuario ${user.username}`}
              onClick={() => void deleteUser(user)}>
              {deleting === user.id ? 'Eliminando…' : 'Eliminar usuario'}
            </button>
            {user.id === currentUser?.id && <p>Tu cuenta actual</p>}
          </li>)}
        </ul>}
      </section>)}
    </>}
  </section>;
}
