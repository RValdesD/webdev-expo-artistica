import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import registrationsService from '../services/registrations';
import guidedToursService from '../services/guidedTours';
import { apiError } from '../services/auth';
import type { Workshop } from '../types/workshop';
import type { GuidedTour } from '../types/guidedTour';
import '../styles/my-visit.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'full',
  timeStyle: 'short',
  hourCycle: 'h23',
  timeZone: 'America/Santiago',
});

// Talleres y visitas guiadas en una misma lista, para mostrar lo próximo de la agenda.
interface AgendaItem { key: string; kind: 'workshop' | 'tour'; id: string; title: string; date: string; place: string; detail: string }

const fromWorkshop = (workshop: Workshop): AgendaItem => ({
  key: `workshop-${workshop.id}`, kind: 'workshop', id: workshop.id, title: workshop.title, date: workshop.date,
  place: workshop.location, detail: workshop.artist ? `Taller con ${workshop.artist.name}` : 'Taller',
});
const fromTour = (tour: GuidedTour): AgendaItem => ({
  key: `tour-${tour.id}`, kind: 'tour', id: tour.id, title: `Visita guiada: ${tour.exhibition?.title ?? 'exposición'}`, date: tour.date,
  place: tour.meetingPoint, detail: [tour.guide && `Con ${tour.guide}`, tour.language, `${tour.durationMinutes} min`].filter(Boolean).join(' · '),
});

export default function MyVisit() {
  const { user, refresh } = useAuthStore();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [tours, setTours] = useState<GuidedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([registrationsService.getMine(controller.signal), guidedToursService.getMine(controller.signal)])
      .then(([mineWorkshops, mineTours]) => { if (!controller.signal.aborted) { setWorkshops(mineWorkshops); setTours(mineTours); } })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  const agenda = [...tours.map(fromTour), ...workshops.map(fromWorkshop)].sort((a, b) => a.date.localeCompare(b.date));
  const next = agenda.find(item => new Date(item.date).getTime() > Date.now()) ?? null;

  async function cancel(item: AgendaItem) {
    if (cancelling) return;
    setCancelling(item.key);
    setError('');
    try {
      if (item.kind === 'tour') {
        await guidedToursService.cancel(item.id);
        setTours(current => current.filter(tour => tour.id !== item.id));
      } else {
        await registrationsService.cancel(item.id);
        setWorkshops(current => current.filter(workshop => workshop.id !== item.id));
      }
    } catch (reason: unknown) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally {
      setCancelling(null);
    }
  }

  const list = (kind: AgendaItem['kind'], title: string) => {
    const items = agenda.filter(item => item.kind === kind);
    if (items.length === 0) return null;
    return <section className="my-visit__group" aria-labelledby={`my-visit-${kind}`}>
      <h2 id={`my-visit-${kind}`} className="my-visit__group-title">{title}</h2>
      <div className="my-visit__list">
        {items.map(item => (
          <article className="visit-registration" key={item.key}>
            <div>
              <p className="visit-registration__date"><time dateTime={item.date}>{dateFormatter.format(new Date(item.date))}</time></p>
              <h3>{item.title}</h3>
              <p>{item.detail} · {item.place}</p>
            </div>
            <button className="visit-registration__cancel" type="button" disabled={cancelling !== null} onClick={() => void cancel(item)}>
              {cancelling === item.key ? 'Cancelando…' : item.kind === 'tour' ? 'Cancelar reserva' : 'Cancelar inscripción'}
            </button>
          </article>
        ))}
      </div>
    </section>;
  };

  return (
    <section className="my-visit" aria-labelledby="my-visit-title">
      <header className="my-visit__heading">
        <p className="eyebrow">EXPO / MI VISITA</p>
        <h1 id="my-visit-title">Tu recorrido, {user?.name}.</h1>
        <p>Revisa tus visitas guiadas y talleres, y cancela una reserva cuando tus planes cambien.</p>
      </header>

      {loading ? <p role="status">Cargando tu agenda…</p> : error && agenda.length === 0 ? (
        <div role="alert">
          <p>{error}</p>
          <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
        </div>
      ) : agenda.length === 0 ? (
        <div className="my-visit__empty">
          <h2>Aún no tienes reservas.</h2>
          <p>Reserva una visita guiada a una exposición o inscríbete en un taller.</p>
          <div className="my-visit__empty-actions">
            <Link className="button" to="/visitas">Planificar visita</Link>
            <Link className="button button--secondary" to="/workshops">Ver workshops</Link>
          </div>
        </div>
      ) : (
        <>
          <section className="next-workshop" aria-labelledby="next-item-title">
            <p className="next-workshop__label">LO PRÓXIMO</p>
            {next ? (
              <>
                <h2 id="next-item-title">{next.title}</h2>
                <p><time dateTime={next.date}>{dateFormatter.format(new Date(next.date))}</time></p>
                <p>{next.place}</p>
              </>
            ) : (
              <><h2 id="next-item-title">Nada próximo en tu agenda</h2><p>Tus reservas restantes ya pasaron.</p></>
            )}
          </section>
          {list('tour', 'Visitas guiadas')}
          {list('workshop', 'Talleres')}
          {error && <p role="alert" className="my-visit__error">{error}</p>}
        </>
      )}
    </section>
  );
}
