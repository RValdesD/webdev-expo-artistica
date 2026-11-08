import { useState, type FormEvent } from 'react';
import artistsService from '../services/artists';
import { apiError } from '../services/auth';
import { hasSocials, type Artist, type ArtistInput } from '../types/artist';
import { socialPlatforms } from './socialPlatforms';

const emptyArtist = (): ArtistInput => ({
  id: '',
  name: '',
  discipline: '',
  bio: '',
  imageUrl: '',
  socials: {},
});

interface Props {
  artists: Artist[];
  // Called after any create, update or delete so the owner can reload the list.
  onChanged: () => void;
}

export default function ArtistManager({ artists, onChanged }: Props) {
  const [form, setForm] = useState<ArtistInput>(emptyArtist);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function resetForm() {
    setForm(emptyArtist());
    setEditingId(null);
  }

  function editArtist(artist: Artist) {
    setEditingId(artist.id);
    setForm({
      id: artist.id,
      name: artist.name,
      discipline: artist.discipline,
      bio: artist.bio,
      imageUrl: artist.imageUrl,
      socials: { ...artist.socials },
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        const updated = await artistsService.update(editingId, form);
        setMessage(`Artista "${updated.name}" actualizado correctamente.`);
      } else {
        const created = await artistsService.create(form);
        setMessage(`Artista "${created.name}" creado con éxito.`);
      }
      resetForm();
      onChanged();
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setSaving(false); }
  }

  async function handleDelete(artist: Artist) {
    if (!window.confirm(`¿Eliminar al artista “${artist.name}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(artist.id);
    setError('');
    setMessage('');
    try {
      await artistsService.remove(artist.id);
      if (editingId === artist.id) resetForm();
      setMessage('Artista eliminado.');
      onChanged();
    } catch (reason: unknown) { setError(apiError(reason)); }
    finally { setDeletingId(null); }
  }

  return (
    <section className="manager" aria-labelledby="artist-manager-title">
      <form className="management-form" onSubmit={handleSubmit}>
        <div className="management-form__heading">
          <h2 id="artist-manager-title">{editingId ? 'Editar artista' : 'Nuevo artista'}</h2>
          {editingId && <button type="button" onClick={resetForm}>Cancelar edición</button>}
        </div>

        <label htmlFor="artist-id">Identificador único (slug)</label>
        <input id="artist-id" required pattern="[a-z0-9-]+" disabled={editingId !== null || saving}
          placeholder="ej: claudia-munoz"
          value={form.id} onChange={event => setForm(current => ({ ...current, id: event.target.value }))} />

        <label htmlFor="artist-name">Nombre del artista</label>
        <input id="artist-name" required maxLength={120} disabled={saving}
          value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />

        <label htmlFor="artist-discipline">Disciplina principal</label>
        <input id="artist-discipline" required maxLength={100} disabled={saving}
          placeholder="ej: Óleo sobre tela, Escultura digital"
          value={form.discipline} onChange={event => setForm(current => ({ ...current, discipline: event.target.value }))} />

        <label htmlFor="artist-bio">Biografía</label>
        <textarea id="artist-bio" required rows={4} maxLength={5000} disabled={saving}
          value={form.bio} onChange={event => setForm(current => ({ ...current, bio: event.target.value }))} />

        <label htmlFor="artist-image">URL de fotografía o retrato</label>
        <input id="artist-image" type="url" placeholder="https://..." disabled={saving}
          value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} />

        <fieldset className="management-form__group" disabled={saving}>
          <legend>Redes y enlaces (URLs completas)</legend>
          {socialPlatforms.map(({ key, inputLabel, placeholder }) => (
            <div key={key}>
              <label htmlFor={`artist-social-${key}`}>{inputLabel}</label>
              <input id={`artist-social-${key}`} type="url" placeholder={placeholder}
                value={form.socials?.[key] ?? ''}
                onChange={event => setForm(current => ({
                  ...current,
                  socials: { ...current.socials, [key]: event.target.value },
                }))} />
            </div>
          ))}
        </fieldset>

        <button className="button" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear artista'}
        </button>
      </form>

      <div className="management-list">
        <h2>Artistas registrados ({artists.length})</h2>
        {artists.length === 0 ? <p>No hay artistas registrados.</p> : artists.map(artist => (
          <article className="management-item" key={artist.id}>
            <div>
              <h3>{artist.name}</h3>
              <p>
                {artist.discipline} · <code>{artist.id}</code>
                {hasSocials(artist.socials) && ' · Tiene redes vinculadas'}
              </p>
            </div>
            <div className="management-item__actions">
              <button type="button" onClick={() => editArtist(artist)}>Editar</button>
              <button type="button" disabled={deletingId !== null} onClick={() => void handleDelete(artist)}>
                {deletingId === artist.id ? 'Eliminando…' : 'Eliminar'}
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
