import { useEffect, useState, type FormEvent } from 'react';
import guidedToursService from '../services/guidedTours';
import exhibitionsService from '../services/exhibitions';
import { apiError, apiFields, apiMessage } from '../services/auth';
import FieldError, { fieldProps, type FieldErrors } from './FieldError';
import { formatTourDate } from './GuidedTourCard';
import type { Exhibition } from '../types/exhibition';
import type { GuidedTour, GuidedTourInput } from '../types/guidedTour';

const MAX_CAPACITY = 60;
const emptyTour = (): GuidedTourInput => ({
  exhibitionId: '', date: '', durationMinutes: 45, capacity: 15, guide: '', language: 'Español', meetingPoint: '',
});

// "2027-06-12T15:00:00.000Z" -> "2027-06-12T11:00" en la hora local, para <input type="datetime-local">.
function localDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// Gestión → Visitas guiadas: crear, editar y eliminar visitas a cada exposición.
export default function GuidedTourManager() {
  const [tours, setTours] = useState<GuidedTour[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [form, setForm] = useState<GuidedTourInput>(emptyTour);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    Promise.all([guidedToursService.getAll(undefined, controller.signal), exhibitionsService.getAll(controller.signal)])
      .then(([tourList, exhibitionList]) => { if (!controller.signal.aborted) { setTours(tourList); setExhibitions(exhibitionList); } })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  function resetForm() { setForm(emptyTour()); setEditingId(null); setFields({}); }
  const set = <K extends keyof GuidedTourInput>(key: K, value: GuidedTourInput[K]) => setForm(current => ({ ...current, [key]: value }));

  function editTour(tour: GuidedTour) {
    setEditingId(tour.id);
    setForm({
      exhibitionId: tour.exhibitionId, date: localDateTime(tour.date), durationMinutes: tour.durationMinutes,
      capacity: tour.capacity, guide: tour.guide, language: tour.language, meetingPoint: tour.meetingPoint,
    });
    setFields({}); setError(''); setMessage('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setFields({}); setMessage('');
    try {
      const input = { ...form, date: new Date(form.date).toISOString() };
      if (editingId) { await guidedToursService.update(editingId, input); setMessage('Visita guiada actualizada.'); }
      else { await guidedToursService.create(input); setMessage('Visita guiada creada.'); }
      resetForm();
      setAttempt(value => value + 1);
    } catch (reason) { setError(apiMessage(reason)); setFields(apiFields(reason)); }
    finally { setSaving(false); }
  }

  async function deleteTour(tour: GuidedTour) {
    const booked = tour.capacity - tour.availablePlaces;
    const detail = booked > 0 ? ` Tiene ${booked} reserva(s), que se cancelarán.` : '';
    if (!window.confirm(`¿Eliminar la visita guiada del ${formatTourDate(tour.date)}?${detail} Esta acción no se puede deshacer.`)) return;
    setDeletingId(tour.id); setError(''); setMessage('');
    try {
      await guidedToursService.remove(tour.id);
      if (editingId === tour.id) resetForm();
      setMessage('Visita guiada eliminada.');
      setAttempt(value => value + 1);
    } catch (reason) { setError(apiError(reason)); }
    finally { setDeletingId(null); }
  }

  return (
    <section className="manager" aria-labelledby="tour-manager-title">
      <form className="management-form" onSubmit={submit}>
        <div className="management-form__heading">
          <h2 id="tour-manager-title">{editingId ? 'Editar visita guiada' : 'Nueva visita guiada'}</h2>
          {editingId && <button type="button" onClick={resetForm}>Cancelar edición</button>}
        </div>

        <label htmlFor="tour-exhibition">Exposición</label>
        <select id="tour-exhibition" {...fieldProps(fields, 'exhibitionId', 'tour-exhibition')} required disabled={saving} value={form.exhibitionId}
          onChange={event => set('exhibitionId', event.target.value)}>
          <option value="">Selecciona una exposición</option>
          {exhibitions.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <FieldError fields={fields} name="exhibitionId" id="tour-exhibition" />

        <div className="management-form__row">
          <div>
            <label htmlFor="tour-date">Fecha y hora</label>
            <input id="tour-date" {...fieldProps(fields, 'date', 'tour-date')} type="datetime-local" required disabled={saving}
              value={form.date} onChange={event => set('date', event.target.value)} />
            <FieldError fields={fields} name="date" id="tour-date" />
          </div>
          <div>
            <label htmlFor="tour-duration">Duración (minutos)</label>
            <input id="tour-duration" {...fieldProps(fields, 'durationMinutes', 'tour-duration')} type="number" min={10} max={480} required disabled={saving}
              value={form.durationMinutes} onChange={event => set('durationMinutes', Number(event.target.value))} />
            <FieldError fields={fields} name="durationMinutes" id="tour-duration" />
          </div>
        </div>

        <div className="management-form__row">
          <div>
            <label htmlFor="tour-guide">Guía (opcional)</label>
            <input id="tour-guide" {...fieldProps(fields, 'guide', 'tour-guide')} maxLength={120} disabled={saving}
              value={form.guide} onChange={event => set('guide', event.target.value)} />
            <FieldError fields={fields} name="guide" id="tour-guide" />
          </div>
          <div>
            <label htmlFor="tour-language">Idioma</label>
            <input id="tour-language" {...fieldProps(fields, 'language', 'tour-language')} required maxLength={60} disabled={saving}
              value={form.language} onChange={event => set('language', event.target.value)} />
            <FieldError fields={fields} name="language" id="tour-language" />
          </div>
        </div>

        <label htmlFor="tour-meeting-point">Punto de encuentro</label>
        <input id="tour-meeting-point" {...fieldProps(fields, 'meetingPoint', 'tour-meeting-point')} required maxLength={200} disabled={saving}
          placeholder="Hall de acceso" value={form.meetingPoint} onChange={event => set('meetingPoint', event.target.value)} />
        <FieldError fields={fields} name="meetingPoint" id="tour-meeting-point" />

        <label htmlFor="tour-capacity">Cupos</label>
        <input id="tour-capacity" {...fieldProps(fields, 'capacity', 'tour-capacity')} type="number" min={1} max={MAX_CAPACITY} required disabled={saving}
          value={form.capacity} onChange={event => set('capacity', Number(event.target.value))} />
        <FieldError fields={fields} name="capacity" id="tour-capacity" />

        <button className="button" type="submit" disabled={saving || exhibitions.length === 0}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear visita guiada'}
        </button>
        {!loading && exhibitions.length === 0 && <p>Necesitas al menos una exposición antes de crear visitas guiadas.</p>}
      </form>

      <div className="management-list">
        <h2>Visitas guiadas programadas</h2>
        {loading ? <p role="status">Cargando visitas guiadas…</p> : tours.length === 0 ? <p>No hay visitas guiadas.</p> : tours.map(tour => (
          <article className="management-item" key={tour.id}>
            <div>
              <h3>{tour.exhibition?.title ?? 'Exposición eliminada'}</h3>
              <p>{formatTourDate(tour.date)} · {tour.language}{tour.guide && ` · ${tour.guide}`}</p>
              <p>{tour.capacity - tour.availablePlaces} reserva(s) de {tour.capacity}</p>
            </div>
            <div className="management-item__actions">
              <button type="button" onClick={() => editTour(tour)}>Editar</button>
              <button type="button" disabled={deletingId !== null} onClick={() => void deleteTour(tour)}>
                {deletingId === tour.id ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </article>
        ))}
      </div>
      {error && <p className="management-message management-message--error" role="alert">{error}</p>}
      {message && <p className="management-message" role="status">{message}</p>}
    </section>
  );
}
