import { useEffect, useState, type FormEvent } from 'react';
import artworksService from '../services/artworks';
import { apiError } from '../services/auth';
import type { Artist } from '../types/artist';
import type { Artwork, ArtworkInput } from '../types/artwork';

const emptyArtwork = (): ArtworkInput => ({
  id: '',
  title: '',
  artistId: '',
  medium: '',
  imageUrl: '',
  year: new Date().getFullYear(),
  description: '',
});

export default function ArtworkManager({ artists }: { artists: Artist[] }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [form, setForm] = useState<ArtworkInput>(emptyArtwork);
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
    artworksService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setArtworks(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  function resetForm() {
    setForm(emptyArtwork());
    setEditingId(null);
  }

  function editArtwork(artwork: Artwork) {
    setEditingId(artwork.id);
    setForm({
      id: artwork.id,
      title: artwork.title,
      artistId: artwork.artistId,
      medium: artwork.medium,
      imageUrl: artwork.imageUrl,
      year: artwork.year,
      description: artwork.description,
    });
    setError('');
    setMessage('');
  }

  async function submitArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await artworksService.update(editingId, form);
        setMessage('Obra actualizada.');
      } else {
        await artworksService.create(form);
        setMessage('Obra creada.');
      }
      resetForm();
      setAttempt(value => value + 1);
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setSaving(false); }
  }

  async function deleteArtwork(artwork: Artwork) {
    if (!window.confirm(`¿Eliminar la obra “${artwork.title}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(artwork.id);
    setError('');
    setMessage('');
    try {
      await artworksService.remove(artwork.id);
      if (editingId === artwork.id) resetForm();
      setMessage('Obra eliminada.');
      setAttempt(value => value + 1);
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setDeletingId(null); }
  }

  return (
    <section className="manager" aria-labelledby="artwork-manager-title">
      <form className="management-form" onSubmit={submitArtwork}>
        <div className="management-form__heading">
          <h2 id="artwork-manager-title">{editingId ? 'Editar obra' : 'Nueva obra'}</h2>
          {editingId && <button type="button" onClick={resetForm}>Cancelar edición</button>}
        </div>

        <label htmlFor="artwork-id">Identificador</label>
        <input id="artwork-id" required pattern="[a-z0-9-]+" maxLength={80} disabled={editingId !== null || saving}
          value={form.id} onChange={event => setForm(current => ({ ...current, id: event.target.value }))} />

        <label htmlFor="artwork-title">Título</label>
        <input id="artwork-title" required maxLength={200} disabled={saving}
          value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />

        <label htmlFor="artwork-artist">Artista</label>
        <select id="artwork-artist" required disabled={saving} value={form.artistId}
          onChange={event => setForm(current => ({ ...current, artistId: event.target.value }))}>
          <option value="">Selecciona un artista</option>
          {artists.map(artist => <option value={artist.id} key={artist.id}>{artist.name}</option>)}
        </select>

        <div className="management-form__row">
          <div><label htmlFor="artwork-medium">Medio</label><input id="artwork-medium" required maxLength={100} disabled={saving}
            value={form.medium} onChange={event => setForm(current => ({ ...current, medium: event.target.value }))} /></div>
          <div><label htmlFor="artwork-year">Año</label><input id="artwork-year" type="number" required disabled={saving}
            value={form.year} onChange={event => setForm(current => ({ ...current, year: Number(event.target.value) }))} /></div>
        </div>

        <label htmlFor="artwork-image">URL o ruta de imagen</label>
        <input id="artwork-image" maxLength={1000} disabled={saving} placeholder="/images/obra.jpg"
          value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} />

        <label htmlFor="artwork-description">Descripción</label>
        <textarea id="artwork-description" maxLength={3000} disabled={saving} rows={5}
          value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} />

        <button className="button" type="submit" disabled={saving || artists.length === 0}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear obra'}
        </button>
      </form>

      <div className="management-list">
        <h2>Obras publicadas</h2>
        {loading ? <p role="status">Cargando obras…</p> : artworks.length === 0 ? <p>No hay obras publicadas.</p> : artworks.map(artwork => (
          <article className="management-item" key={artwork.id}>
            <div><h3>{artwork.title}</h3><p>{artwork.artist?.name ?? 'Artista no disponible'} · {artwork.medium} · {artwork.year}</p></div>
            <div className="management-item__actions">
              <button type="button" onClick={() => editArtwork(artwork)}>Editar</button>
              <button type="button" disabled={deletingId !== null} onClick={() => void deleteArtwork(artwork)}>
                {deletingId === artwork.id ? 'Eliminando…' : 'Eliminar'}
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
