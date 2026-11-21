import { useEffect, useState } from 'react';
import usersService, { type Account } from '../services/users';
import { apiError } from '../services/auth';

// Cuentas de artista que aún no guardan su perfil: no tienen ficha en "Artistas registrados"
// ni aparecen en el sitio público hasta que lo completen desde "Mi perfil".
// Se vuelve a pedir cuando cambia `reloadWhen` (la lista de artistas tras guardar o borrar).
export default function PendingArtistAccounts({ reloadWhen }: { reloadWhen: unknown }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    usersService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setAccounts(data.filter(account => account.role === 'artista' && !account.artistProfile)); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); });
    return () => controller.abort();
  }, [reloadWhen]);

  if (error) return <p className="management-message management-message--error" role="alert">No pudimos cargar las cuentas de artista: {error}</p>;
  if (accounts.length === 0) return null;

  return (
    <section className="pending-artists" aria-labelledby="pending-artists-title">
      <h3 id="pending-artists-title" className="pending-artists__title">Cuentas de artista sin perfil ({accounts.length})</h3>
      <p className="pending-artists__help">Estas cuentas aún no guardan su perfil. Aparecerán en «Artistas registrados» y en el sitio cuando lo completen desde «Mi perfil».</p>
      {accounts.map(account => (
        <article className="management-item" key={account.id}>
          <div>
            <h4>{account.name}</h4>
            <p>@{account.username}{account.email && ` · ${account.email}`} · Perfil pendiente</p>
          </div>
        </article>
      ))}
    </section>
  );
}
