import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Workshop } from '../types/workshop';
import workshopsService from '../services/workshops';
import { apiError } from '../services/auth';
import { useAuth } from '../auth/AuthContext';

interface Props {
  workshop: Workshop;
  onRegistered: (updated: Workshop) => void;
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Santiago',
});

export default function WorkshopCard({ workshop, onRegistered }: Props) {
  const { user, refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const started = new Date(workshop.date).getTime() <= Date.now();
  const unavailable = started || workshop.availablePlaces === 0;

  async function handleRegister() {
    if (submitting || !user) return;
    setSubmitting(true);
    setError('');
    try {
      onRegistered(await workshopsService.register(workshop.id));
    } catch (reason: unknown) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="workshop-card">
      <p className="workshop-card__date">
        <time dateTime={workshop.date}>{dateFormatter.format(new Date(workshop.date))}</time>
      </p>
      <h2>{workshop.title}</h2>
      {workshop.artist ? (
        <p>Con <Link to={`/artists/${encodeURIComponent(workshop.artist.id)}`}>{workshop.artist.name}</Link></p>
      ) : <p>Artista no disponible</p>}
      <p className="workshop-card__description">{workshop.description}</p>
      <dl className="workshop-card__details">
        <div><dt>Lugar</dt><dd>{workshop.location}</dd></div>
        <div><dt>Duración</dt><dd>{workshop.durationMinutes} minutos</dd></div>
        <div><dt>Cupos</dt><dd>{workshop.availablePlaces} de {workshop.capacity} disponibles</dd></div>
      </dl>
      {workshop.isSample && <p className="workshop-card__sample">Demostración: usa datos ficticios. No es una reserva para un evento real.</p>}

      {workshop.isRegistered && user ? (
        <p className="workshop-card__success" role="status">Ya estás inscrito en este taller.</p>
      ) : unavailable ? (
        <p>{started ? 'Inscripciones cerradas' : 'Sin cupos'}</p>
      ) : !user ? (
        <p><Link to="/login">Inicia sesión</Link> o <Link to="/registro">crea una cuenta</Link> para inscribirte.</p>
      ) : (
        <>
          <p>Inscribirme como {user.name}.</p>
          <button className="button" type="button" disabled={submitting} onClick={handleRegister}>
            {submitting ? 'Guardando…' : 'Confirmar mi inscripción'}
          </button>
        </>
      )}
      {error && <p role="alert">{error} Puedes actualizar los cupos antes de reintentar.</p>}
    </article>
  );
}
