import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import type { Workshop } from '../types/workshop';
import workshopsService from '../services/workshops';
import registrationsService from '../services/registrations';
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
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const started = new Date(workshop.date).getTime() <= Date.now();
  const unavailable = started || workshop.availablePlaces === 0;
  const percentFilled = Math.min(100, Math.max(0, Math.round(((workshop.capacity - workshop.availablePlaces) / workshop.capacity) * 100)));
  const isFull = workshop.availablePlaces === 0;
  const isLowPlaces = !isFull && workshop.availablePlaces <= 3;

  async function handleRegister() {
    if (submitting || !user) return;
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await workshopsService.register(workshop.id);
      onRegistered(updated);
      setShowConfirmModal(false);
      setSuccessMsg('¡Inscripción confirmada con éxito! Puedes revisarla en tu perfil.');
    } catch (reason: unknown) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (cancelling || !user) return;
    setCancelling(true);
    setError('');
    setSuccessMsg('');
    try {
      await registrationsService.cancel(workshop.id);
      onRegistered({
        ...workshop,
        isRegistered: false,
        availablePlaces: workshop.availablePlaces + 1,
      });
      setSuccessMsg('Tu inscripción ha sido cancelada.');
    } catch (reason: unknown) {
      setError(apiError(reason));
      if (axios.isAxiosError(reason) && reason.response?.status === 401) await refresh();
    } finally {
      setCancelling(false);
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
        <div>
          <dt>Cupos</dt>
          <dd>
            <div className="workshop-places-header">
              <span>{workshop.availablePlaces} de {workshop.capacity} disponibles</span>
              {isFull ? (
                <span className="badge badge--full">Lleno</span>
              ) : isLowPlaces ? (
                <span className="badge badge--low">¡Últimos cupos!</span>
              ) : null}
            </div>
            <div className="workshop-capacity-bar" aria-label={`Capacidad ocupada: ${percentFilled}%`}>
              <div 
                className={`workshop-capacity-fill ${isFull ? 'full' : isLowPlaces ? 'low' : ''}`} 
                style={{ width: `${percentFilled}%` }} 
              />
            </div>
          </dd>
        </div>
      </dl>

      {workshop.isSample && <p className="workshop-card__sample">Demostración: usa datos ficticios. No es una reserva para un evento real.</p>}

      {successMsg && (
        <div className="workshop-alert workshop-alert--success" role="status">
          <p>{successMsg}</p>
          <Link to="/mi-visita" className="workshop-visit-link">Ver en Mi visita →</Link>
        </div>
      )}

      {workshop.isRegistered && user ? (
        <div className="workshop-card__registered-box">
          <p className="workshop-card__success" role="status">✓ Estás inscrito en este taller.</p>
          <div className="workshop-registered-actions">
            <Link to="/mi-visita" className="button button--secondary">Ir a Mi visita</Link>
            <button 
              type="button" 
              className="button button--outline-danger" 
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? 'Cancelando…' : 'Cancelar inscripción'}
            </button>
          </div>
        </div>
      ) : unavailable ? (
        <p className="workshop-card__unavailable">{started ? 'Inscripciones cerradas (evento iniciado)' : 'Sin cupos disponibles'}</p>
      ) : !user ? (
        <div>
          <p>Necesitas una cuenta para guardar este taller en Mi visita.</p>
          <Link className="button" to="/login" state={{ from: '/workshops' }}>Iniciar sesión para inscribirme</Link>
        </div>
      ) : (
        <>
          <p>Inscribirme como <strong>{user.name}</strong>.</p>
          <button className="button" type="button" onClick={() => setShowConfirmModal(true)}>
            Inscribirme a este taller
          </button>
        </>
      )}

      {error && <p className="workshop-alert workshop-alert--error" role="alert">{error}</p>}

      {showConfirmModal && (
        <div className="workshop-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="workshop-modal">
            <h3 id="modal-title">Confirmar inscripción al taller</h3>
            <p>Por favor revisa los detalles antes de confirmar tu asistencia:</p>
            <ul className="workshop-modal-details">
              <li><strong>Taller:</strong> {workshop.title}</li>
              <li><strong>Fecha y hora:</strong> {dateFormatter.format(new Date(workshop.date))}</li>
              <li><strong>Lugar:</strong> {workshop.location}</li>
              <li><strong>Duración:</strong> {workshop.durationMinutes} minutos</li>
            </ul>
            <p className="workshop-modal-user">Se registrará a nombre de: <strong>{user?.name}</strong> ({user?.username})</p>
            <div className="workshop-modal-actions">
              <button 
                type="button" 
                className="button button--secondary" 
                disabled={submitting} 
                onClick={() => setShowConfirmModal(false)}
              >
                Volver
              </button>
              <button 
                type="button" 
                className="button" 
                disabled={submitting} 
                onClick={handleRegister}
              >
                {submitting ? 'Confirmando…' : 'Confirmar asistencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
