import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import guidedToursService from '../services/guidedTours';
import { apiError } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import type { GuidedTour } from '../types/guidedTour';

const zone = 'America/Santiago';
const dayFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: zone });
const dayWithYearFormatter = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: zone });
const yearFormatter = new Intl.DateTimeFormat('es-CL', { year: 'numeric', timeZone: zone });
const timeFormatter = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone });
// "sábado, 12 de junio, 11:00 h"; con el año si no es el año actual.
export function formatTourDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = yearFormatter.format(date) === yearFormatter.format(new Date());
  return `${(sameYear ? dayFormatter : dayWithYearFormatter).format(date)}, ${timeFormatter.format(date)}\u00a0h`;
}

interface Props {
  tour: GuidedTour;
  onChange: (updated: GuidedTour) => void;
}

// Una visita guiada: datos, cupos y el botón para reservar o cancelar la reserva.
export default function GuidedTourCard({ tour, onChange }: Props) {
  const { user, refresh } = useAuthStore();
  const location = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const confirmButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirming) confirmButton.current?.focus(); }, [confirming]);

  const started = new Date(tour.date).getTime() <= Date.now();
  const full = tour.availablePlaces === 0;
  const fewLeft = !full && tour.availablePlaces <= 3;
  const taken = tour.capacity - tour.availablePlaces;
  const titleId = `tour-${tour.id}`;

  async function run(action: () => Promise<GuidedTour>, success: string) {
    if (pending) return;
    setPending(true); setError(''); setNotice('');
    try { onChange(await action()); setConfirming(false); setNotice(success); }
    catch (reason) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally { setPending(false); }
  }
  const book = () => run(() => guidedToursService.book(tour.id), 'Reserva confirmada. La encontrarás en Mi visita.');
  // La cancelación no devuelve cuerpo: el cupo liberado se aplica aquí.
  const cancel = () => run(async () => {
    await guidedToursService.cancel(tour.id);
    return { ...tour, isBooked: false, availablePlaces: tour.availablePlaces + 1 };
  }, 'Reserva cancelada.');

  return (
    <article className="tour-card" aria-labelledby={titleId}>
      <header className="tour-card__header">
        <h3 id={titleId}><time dateTime={tour.date}>{formatTourDate(tour.date)}</time></h3>
        {tour.isBooked ? <span className="tour-badge tour-badge--booked">Reservada</span>
          : full ? <span className="tour-badge tour-badge--full">Sin cupos</span>
          : fewLeft ? <span className="tour-badge tour-badge--low">Últimos cupos</span> : null}
      </header>
      <dl className="tour-card__details">
        <div><dt>Duración</dt><dd>{tour.durationMinutes} min</dd></div>
        <div><dt>Idioma</dt><dd>{tour.language}</dd></div>
        {tour.guide && <div><dt>Guía</dt><dd>{tour.guide}</dd></div>}
        <div><dt>Punto de encuentro</dt><dd>{tour.meetingPoint}</dd></div>
      </dl>
      <div className="tour-card__places">
        <p>{tour.availablePlaces} de {tour.capacity} cupos disponibles</p>
        <progress max={tour.capacity} value={taken} aria-label={`${taken} de ${tour.capacity} cupos reservados`} />
      </div>
      {tour.isSample && <p className="tour-card__sample">Visita de demostración con datos ficticios.</p>}

      <div className="tour-card__actions">
        {tour.isBooked && user ? (
          <button type="button" className="button button--outline-danger" disabled={pending} onClick={() => void cancel()}>
            {pending ? 'Cancelando…' : 'Cancelar reserva'}
          </button>
        ) : started ? <p className="tour-card__closed">Esta visita ya comenzó.</p>
          : full ? <p className="tour-card__closed">No quedan cupos.</p>
          : !user ? (
            <Link className="button" to="/login" state={{ from: location.pathname }}>Inicia sesión para reservar</Link>
          ) : confirming ? (
            <div className="tour-card__confirm" role="group" aria-label="Confirmar reserva">
              <p>Reservar un cupo a nombre de <strong>{user.name}</strong>.</p>
              <div className="tour-card__confirm-actions">
                <button ref={confirmButton} type="button" className="button" disabled={pending} onClick={() => void book()}>
                  {pending ? 'Reservando…' : 'Confirmar reserva'}
                </button>
                <button type="button" className="button button--secondary" disabled={pending} onClick={() => setConfirming(false)}>Volver</button>
              </div>
            </div>
          ) : (
            <button type="button" className="button" onClick={() => { setNotice(''); setConfirming(true); }}>Reservar cupo</button>
          )}
      </div>
      {notice && <p className="tour-card__notice" role="status">{notice} {tour.isBooked && <Link to="/mi-visita">Ir a Mi visita →</Link>}</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </article>
  );
}
