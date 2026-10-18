import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import registrationsService from '../services/registrations';
import { apiError } from '../services/auth';
import type { Workshop } from '../types/workshop';
import '../styles/my-visit.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Santiago',
});

export default function MyVisit() {
  const { user, refresh } = useAuth();
  const [registrations, setRegistrations] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    registrationsService.getMine(controller.signal)
      .then(data => { if (!controller.signal.aborted) setRegistrations(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  const nextWorkshop = registrations.find(workshop => new Date(workshop.date).getTime() > Date.now()) ?? null;

  async function cancelRegistration(workshop: Workshop) {
    if (cancellingId) return;
    setCancellingId(workshop.id);
    setError('');
    try {
      await registrationsService.cancel(workshop.id);
      setRegistrations(current => current.filter(item => item.id !== workshop.id));
    } catch (reason: unknown) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="my-visit" aria-labelledby="my-visit-title">
      <header className="my-visit__heading">
        <p className="eyebrow">EXPO / MI VISITA</p>
        <h1 id="my-visit-title">Tu recorrido, {user?.name}.</h1>
        <p>Revisa tus talleres inscritos y cancela una inscripción cuando tus planes cambien.</p>
      </header>

      {loading ? <p role="status">Cargando tus inscripciones…</p> : error && registrations.length === 0 ? (
        <div role="alert">
          <p>{error}</p>
          <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
        </div>
      ) : registrations.length === 0 ? (
        <div className="my-visit__empty">
          <h2>Aún no tienes talleres inscritos.</h2>
          <p>Explora la programación y elige el taller que quieres agregar a tu visita.</p>
          <Link className="button" to="/workshops">Ver workshops</Link>
        </div>
      ) : (
        <>
          <section className="next-workshop" aria-labelledby="next-workshop-title">
            <p className="next-workshop__label">PRÓXIMO TALLER</p>
            {nextWorkshop ? (
              <>
                <h2 id="next-workshop-title">{nextWorkshop.title}</h2>
                <p><time dateTime={nextWorkshop.date}>{dateFormatter.format(new Date(nextWorkshop.date))}</time></p>
                <p>{nextWorkshop.location}</p>
                <Link className="next-workshop__link" to="/workshops">Ver todos los talleres →</Link>
              </>
            ) : (
              <><h2 id="next-workshop-title">Sin próximos talleres</h2><p>Tus inscripciones restantes corresponden a talleres anteriores.</p></>
            )}
          </section>

          <section className="my-visit__registrations" aria-labelledby="my-registrations-title">
          <h2 id="my-registrations-title" className="my-visit__section-title">Mis inscripciones <span>({registrations.length})</span></h2>
          <div className="my-visit__list">
            {registrations.map(workshop => (
              <article className="visit-registration" key={workshop.id}>
                <div>
                  <p className="visit-registration__date"><time dateTime={workshop.date}>{dateFormatter.format(new Date(workshop.date))}</time></p>
                  <h3>{workshop.title}</h3>
                  <p>{workshop.artist ? `Con ${workshop.artist.name}` : 'Artista no disponible'} · {workshop.location}</p>
                </div>
                <button
                  className="visit-registration__cancel"
                  type="button"
                  disabled={cancellingId !== null}
                  onClick={() => void cancelRegistration(workshop)}
                >
                  {cancellingId === workshop.id ? 'Cancelando…' : 'Cancelar inscripción'}
                </button>
              </article>
            ))}
          </div>
          </section>
          {error && <p role="alert" className="my-visit__error">{error}</p>}
        </>
      )}
    </section>
  );
}
