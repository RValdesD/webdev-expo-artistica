import { useEffect, useState, type FormEvent } from 'react';
import workshopsService from '../services/workshops';
import { apiError } from '../services/auth';
import type { Artist } from '../types/artist';
import type { Workshop, WorkshopInput } from '../types/workshop';

interface WorkshopForm extends Omit<WorkshopInput, 'date'> { date: string }

const emptyWorkshop = (): WorkshopForm => ({
  id: '', title: '', description: '', artistId: '', date: '',
  durationMinutes: 60, location: '', capacity: 10,
});

function localDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function WorkshopManager({ artists }: { artists: Artist[] }) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [form, setForm] = useState<WorkshopForm>(emptyWorkshop);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    workshopsService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setWorkshops(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  function resetForm() { setForm(emptyWorkshop()); setEditingId(null); }

  function editWorkshop(workshop: Workshop) {
    setEditingId(workshop.id);
    setForm({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      artistId: workshop.artistId,
      date: localDateTime(workshop.date),
      durationMinutes: workshop.durationMinutes,
      location: workshop.location,
      capacity: workshop.capacity,
    });
    setError('');
    setMessage('');
  }

  async function submitWorkshop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const input: WorkshopInput = { ...form, date: new Date(form.date).toISOString() };
      if (editingId) {
        await workshopsService.update(editingId, input);
        setMessage('Taller actualizado.');
      } else {
        await workshopsService.create(input);
        setMessage('Taller creado.');
      }
      resetForm();
      setAttempt(value => value + 1);
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setSaving(false); }
  }

  async function deleteWorkshop(workshop: Workshop) {
    const registered = workshop.capacity - workshop.availablePlaces;
    const detail = registered > 0 ? ` Tiene ${registered} inscripción(es).` : '';
    if (!window.confirm(`¿Eliminar el taller “${workshop.title}”?${detail} Esta acción no se puede deshacer.`)) return;
    setDeletingId(workshop.id);
    setError('');
    setMessage('');
    try {
      await workshopsService.remove(workshop.id);
      if (editingId === workshop.id) resetForm();
      setMessage('Taller eliminado.');
      setAttempt(value => value + 1);
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setDeletingId(null); }
  }

  return (
    <section className="manager" aria-labelledby="workshop-manager-title">
      <form className="management-form" onSubmit={submitWorkshop}>
        <div className="management-form__heading">
          <h2 id="workshop-manager-title">{editingId ? 'Editar taller' : 'Nuevo taller'}</h2>
          {editingId && <button type="button" onClick={resetForm}>Cancelar edición</button>}
        </div>

        <label htmlFor="workshop-id">Identificador</label>
        <input id="workshop-id" required pattern="[a-z0-9-]+" maxLength={80} disabled={editingId !== null || saving}
          value={form.id} onChange={event => setForm(current => ({ ...current, id: event.target.value }))} />

        <label htmlFor="workshop-title">Título</label>
        <input id="workshop-title" required maxLength={200} disabled={saving}
          value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />

        <label htmlFor="workshop-artist">Artista</label>
        <select id="workshop-artist" required disabled={saving} value={form.artistId}
          onChange={event => setForm(current => ({ ...current, artistId: event.target.value }))}>
          <option value="">Selecciona un artista</option>
          {artists.map(artist => <option value={artist.id} key={artist.id}>{artist.name}</option>)}
        </select>

        <label htmlFor="workshop-description">Descripción</label>
        <textarea id="workshop-description" required maxLength={3000} rows={5} disabled={saving}
          value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} />

        <div className="management-form__row">
          <div><label htmlFor="workshop-date">Fecha y hora</label><input id="workshop-date" type="datetime-local" required disabled={saving}
            value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} /></div>
          <div><label htmlFor="workshop-duration">Duración (minutos)</label><input id="workshop-duration" type="number" min={1} required disabled={saving}
            value={form.durationMinutes} onChange={event => setForm(current => ({ ...current, durationMinutes: Number(event.target.value) }))} /></div>
        </div>

        <label htmlFor="workshop-location">Lugar</label>
        <input id="workshop-location" required maxLength={300} disabled={saving}
          value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} />

        <label htmlFor="workshop-capacity">Capacidad</label>
        <input id="workshop-capacity" type="number" min={1} max={200} required disabled={saving}
          value={form.capacity} onChange={event => setForm(current => ({ ...current, capacity: Number(event.target.value) }))} />

        <button className="button" type="submit" disabled={saving || artists.length === 0}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear taller'}
        </button>
      </form>

      <div className="management-list">
        <h2>Talleres publicados</h2>
        {loading ? <p role="status">Cargando talleres…</p> : workshops.length === 0 ? <p>No hay talleres publicados.</p> : workshops.map(workshop => (
          <article className="management-item" key={workshop.id}>
            <div>
              <h3>{workshop.title}</h3>
              <p>{workshop.artist?.name ?? 'Artista no disponible'} · {new Date(workshop.date).toLocaleString('es-CL')}</p>
              <p>{workshop.capacity - workshop.availablePlaces} inscrito(s) de {workshop.capacity}</p>
            </div>
            <div className="management-item__actions">
              <button type="button" onClick={() => editWorkshop(workshop)}>Editar</button>
              <button type="button" disabled={deletingId !== null} onClick={() => void deleteWorkshop(workshop)}>
                {deletingId === workshop.id ? 'Eliminando…' : 'Eliminar'}
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
