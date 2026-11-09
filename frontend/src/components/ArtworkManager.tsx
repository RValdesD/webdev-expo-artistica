import { useEffect, useState, type FormEvent } from 'react';
import artworksService from '../services/artworks';
import { apiError, apiFields, apiMessage } from '../services/auth';
import FieldError, { fieldProps, type FieldErrors } from './FieldError';
import type { Artist } from '../types/artist';
import type { Artwork, ArtworkInput } from '../types/artwork';

const MAX_EXTRA_IMAGES = 10;

const emptyArtwork = (): ArtworkInput => ({
  id: '',
  title: '',
  artistId: '',
  medium: '',
  imageUrl: '',
  images: [],
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
  const [fields, setFields] = useState<FieldErrors>({});
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
    setFields({});
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
      images: artwork.images ?? [],
      year: artwork.year,
      description: artwork.description,
    });
    setError('');
    setMessage('');
  }

  function setImage(position: number, value: string) {
    setForm(current => ({ ...current, images: current.images.map((src, i) => i === position ? value : src) }));
  }

  function removeImage(position: number) {
    setForm(current => ({ ...current, images: current.images.filter((_, i) => i !== position) }));
  }

  async function submitArtwork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    // Las filas que se dejaron vacías no se guardan.
    const payload = { ...form, images: form.images.map(src => src.trim()).filter(Boolean) };
    setSaving(true);
    setError(''); setFields({});
    setMessage('');
    try {
      if (editingId) {
        await artworksService.update(editingId, payload);
        setMessage('Obra actualizada.');
      } else {
        await artworksService.create(payload);
        setMessage('Obra creada.');
      }
      resetForm();
      setAttempt(value => value + 1);
    } catch (reason: unknown) { setError(apiMessage(reason)); setFields(apiFields(reason)); }
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
        <input id="artwork-id" {...fieldProps(fields, 'id', 'artwork-id')} required pattern="[a-z0-9-]+" maxLength={80} disabled={editingId !== null || saving}
          value={form.id} onChange={event => setForm(current => ({ ...current, id: event.target.value }))} />
        <FieldError fields={fields} name="id" id="artwork-id" />

        <label htmlFor="artwork-title">Título</label>
        <input id="artwork-title" {...fieldProps(fields, 'title', 'artwork-title')} required maxLength={200} disabled={saving}
          value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
        <FieldError fields={fields} name="title" id="artwork-title" />

        <label htmlFor="artwork-artist">Artista</label>
        <select id="artwork-artist" {...fieldProps(fields, 'artistId', 'artwork-artist')} required disabled={saving} value={form.artistId}
          onChange={event => setForm(current => ({ ...current, artistId: event.target.value }))}>
          <option value="">Selecciona un artista</option>
          {artists.map(artist => <option value={artist.id} key={artist.id}>{artist.name}</option>)}
        </select>
        <FieldError fields={fields} name="artistId" id="artwork-artist" />

        <div className="management-form__row">
          <div><label htmlFor="artwork-medium">Medio</label><input id="artwork-medium" {...fieldProps(fields, 'medium', 'artwork-medium')} required maxLength={100} disabled={saving}
            value={form.medium} onChange={event => setForm(current => ({ ...current, medium: event.target.value }))} />
        <FieldError fields={fields} name="medium" id="artwork-medium" /></div>
          <div><label htmlFor="artwork-year">Año</label><input id="artwork-year" {...fieldProps(fields, 'year', 'artwork-year')} type="number" required disabled={saving}
            value={form.year} onChange={event => setForm(current => ({ ...current, year: Number(event.target.value) }))} />
        <FieldError fields={fields} name="year" id="artwork-year" /></div>
        </div>

        <label htmlFor="artwork-image">Imagen principal (URL o ruta)</label>
        <input id="artwork-image" {...fieldProps(fields, 'imageUrl', 'artwork-image')} maxLength={1000} disabled={saving} placeholder="/images/obra.jpg"
          value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} />
        <FieldError fields={fields} name="imageUrl" id="artwork-image" />

        <fieldset className="management-images" disabled={saving}>
          <legend>Más imágenes de la obra ({form.images.length} de {MAX_EXTRA_IMAGES})</legend>
          <p>Se ven en la galería de la obra, después de la imagen principal.</p>
          {form.images.map((src, position) => (
            <div className="management-images__row" key={position}>
              <label className="visually-hidden" htmlFor={`artwork-extra-${position}`}>Imagen extra {position + 1}</label>
              <input id={`artwork-extra-${position}`} maxLength={1000} placeholder="https://… o /images/…"
                value={src} onChange={event => setImage(position, event.target.value)} />
              <button type="button" aria-label={`Quitar imagen extra ${position + 1}`} onClick={() => removeImage(position)}>Quitar</button>
            </div>
          ))}
          <button type="button" disabled={form.images.length >= MAX_EXTRA_IMAGES}
            onClick={() => setForm(current => ({ ...current, images: [...current.images, ''] }))}>
            + Agregar imagen
          </button>
          <FieldError fields={fields} name="images" id="artwork-images" />
        </fieldset>

        <label htmlFor="artwork-description">Descripción</label>
        <textarea id="artwork-description" {...fieldProps(fields, 'description', 'artwork-description')} maxLength={3000} disabled={saving} rows={5}
          value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} />
        <FieldError fields={fields} name="description" id="artwork-description" />

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
