import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Workshop } from '../types/workshop';
import workshopsService from '../services/workshops';

interface Props {
  workshop: Workshop;
  onRegistered: (updated: Workshop) => void;
}

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Santiago',
});

export default function WorkshopCard({ workshop, onRegistered }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const started = new Date(workshop.date).getTime() <= Date.now();
  const unavailable = started || workshop.availablePlaces === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await workshopsService.register(workshop.id, { name: name.trim(), email: email.trim() });
      onRegistered(updated);
      setSuccess(true);
      setOpen(false);
      setName('');
      setEmail('');
    } catch (reason: unknown) {
      if (axios.isAxiosError<{ error?: string }>(reason) && typeof reason.response?.data.error === 'string') {
        setError(reason.response.data.error);
      } else {
        setError('No pudimos confirmar la inscripción. Actualiza la lista antes de intentar nuevamente.');
      }
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

      {success ? (
        <p role="status" className="workshop-card__success">Inscripción guardada. No se envía un correo de confirmación.</p>
      ) : (
        <button className="button" type="button" disabled={unavailable || submitting}
          aria-expanded={open} aria-controls={`workshop-form-${workshop.id}`}
          onClick={() => setOpen(value => !value)}>
          {started ? 'Inscripciones cerradas' : workshop.availablePlaces === 0 ? 'Sin cupos' : open ? 'Cerrar formulario' : 'Inscribirme'}
        </button>
      )}

      <div id={`workshop-form-${workshop.id}`} hidden={!open}>
        <form className="workshop-form" onSubmit={handleSubmit} aria-label={`Inscripción a ${workshop.title}`}>
          <label htmlFor={`name-${workshop.id}`}>Nombre</label>
          <input id={`name-${workshop.id}`} value={name} onChange={event => setName(event.target.value)}
            required maxLength={120} autoComplete="name" disabled={submitting} />
          <label htmlFor={`email-${workshop.id}`}>Correo</label>
          <input id={`email-${workshop.id}`} type="email" value={email} onChange={event => setEmail(event.target.value)}
            required maxLength={254} autoComplete="email" disabled={submitting} />
          <p>Una inscripción por correo y taller.</p>
          {error && <p role="alert">{error}</p>}
          <button className="button" type="submit" disabled={submitting || unavailable}>
            {submitting ? 'Guardando…' : 'Confirmar inscripción'}
          </button>
        </form>
      </div>
    </article>
  );
}
