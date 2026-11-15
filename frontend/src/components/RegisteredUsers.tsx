import { useEffect, useState } from 'react';
import axiosSecure from '../utils/axiosSecure';
import { apiError } from '../services/auth';
import '../styles/registered-users.css';

type Account = {
  id: string; username: string; name: string; email?: string;
  role: 'organizador' | 'artista' | 'visitante';
  createdVia: 'console' | 'registration' | 'unknown';
};
const roles = { organizador: 'Administrador', artista: 'Artista', visitante: 'Visitante' };
const origins = { console: 'Consola', registration: 'Registro público', unknown: 'No registrado' };

export default function RegisteredUsers() {
  const [users, setUsers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    axiosSecure.get<Account[]>('/api/users', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setUsers(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  const sections = [
    { title: 'Cuentas creadas por consola', users: users.filter(user => user.createdVia === 'console') },
    { title: 'Visitantes registrados', users: users.filter(user => user.createdVia === 'registration') },
    { title: 'Cuentas anteriores · origen no registrado', users: users.filter(user => user.createdVia === 'unknown') },
  ];
  return <section className="registered-users" aria-labelledby="registered-users-title">
    <h2 id="registered-users-title">Usuarios registrados</h2>
    <button className="button button--secondary" type="button" disabled={loading} onClick={() => setAttempt(value => value + 1)}>Actualizar listado</button>
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
            </dl>
          </li>)}
        </ul>}
      </section>)}
    </>}
  </section>;
}
