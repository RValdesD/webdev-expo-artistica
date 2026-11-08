import { useState, type FormEvent } from 'react';
import artistsService from '../services/artists';
import { apiError } from '../services/auth';
import type { Artist, ArtistInput } from '../types/artist';

const emptyArtist = (): ArtistInput => ({
  id: '',
  name: '',
  discipline: '',
  bio: '',
  imageUrl: '',
  socials: {
    instagram: '',
    website: '',
    twitter: '',
    behance: '',
  },
});

interface Props {
  artists: Artist[];
  onArtistCreated?: (artist: Artist) => void;
  onArtistUpdated?: (artist: Artist) => void;
  onArtistDeleted?: (id: string) => void;
}

export default function ArtistManager({ artists, onArtistCreated, onArtistUpdated, onArtistDeleted }: Props) {
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
      socials: {
        instagram: artist.socials?.instagram || '',
        website: artist.socials?.website || '',
        twitter: artist.socials?.twitter || '',
        behance: artist.socials?.behance || '',
      },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        const updated = await artistsService.update(editingId, form);
        setMessage(`Artista "${updated.name}" actualizado correctamente.`);
        onArtistUpdated?.(updated);
      } else {
        const created = await artistsService.create(form);
        setMessage(`Artista "${created.name}" creado con éxito.`);
        onArtistCreated?.(created);
      }
      resetForm();
    } catch (reason: unknown) {
      setError(apiError(reason));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Seguro que deseas eliminar este artista?')) return;
    setDeletingId(id);
    setError('');
    setMessage('');
    try {
      await artistsService.remove(id);
      setMessage('Artista eliminado.');
      onArtistDeleted?.(id);
      if (editingId === id) resetForm();
    } catch (reason: unknown) {
      setError(apiError(reason));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="manager-grid">
      <form className="manager-form" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar artista' : 'Nuevo artista'}</h2>

        <label htmlFor="artist-id">Identificador único (slug)</label>
        <input
          id="artist-id"
          type="text"
          disabled={Boolean(editingId)}
          required
          placeholder="ej: claudia-munoz"
          value={form.id}
          onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
        />

        <label htmlFor="artist-name">Nombre del artista</label>
        <input
          id="artist-name"
          type="text"
          required
          maxLength={120}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />

        <label htmlFor="artist-discipline">Disciplina principal</label>
        <input
          id="artist-discipline"
          type="text"
          required
          maxLength={100}
          placeholder="ej: Óleo sobre tela, Escultura digital"
          value={form.discipline}
          onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}
        />

        <label htmlFor="artist-bio">Biografía</label>
        <textarea
          id="artist-bio"
          required
          rows={4}
          maxLength={5000}
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
        />

        <label htmlFor="artist-image">URL de fotografía o retrato</label>
        <input
          id="artist-image"
          type="url"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
        />

        <fieldset style={{ border: '1px solid var(--border, #514a3d)', padding: '16px', margin: '16px 0' }}>
          <legend style={{ padding: '0 8px', color: 'var(--accent, #c3a777)', fontWeight: 600 }}>
            Redes y enlaces (URLs completas)
          </legend>

          <label htmlFor="artist-ig">Instagram URL</label>
          <input
            id="artist-ig"
            type="url"
            placeholder="https://instagram.com/..."
            value={form.socials?.instagram || ''}
            onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, instagram: e.target.value } }))}
          />

          <label htmlFor="artist-web">Sitio web personal</label>
          <input
            id="artist-web"
            type="url"
            placeholder="https://..."
            value={form.socials?.website || ''}
            onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, website: e.target.value } }))}
          />

          <label htmlFor="artist-tw">X / Twitter URL</label>
          <input
            id="artist-tw"
            type="url"
            placeholder="https://x.com/..."
            value={form.socials?.twitter || ''}
            onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, twitter: e.target.value } }))}
          />

          <label htmlFor="artist-behance">Behance URL</label>
          <input
            id="artist-behance"
            type="url"
            placeholder="https://behance.net/..."
            value={form.socials?.behance || ''}
            onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, behance: e.target.value } }))}
          />
        </fieldset>

        <div className="manager-actions">
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear artista'}
          </button>
          {editingId && (
            <button className="button button--secondary" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>

        {message && <p className="manager-feedback manager-feedback--success">{message}</p>}
        {error && <p className="manager-feedback manager-feedback--error">{error}</p>}
      </form>

      <div className="manager-list">
        <h2>Artistas registrados ({artists.length})</h2>
        {artists.length === 0 ? (
          <p>No hay artistas registrados.</p>
        ) : (
          <ul className="manager-items">
            {artists.map(artist => (
              <li key={artist.id} className="manager-item">
                <div>
                  <strong>{artist.name}</strong> ({artist.discipline})
                  <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--muted, #bcb3a3)' }}>
                    Slug: <code>{artist.id}</code>
                    {artist.socials && Object.values(artist.socials).some(Boolean) && (
                      <span> · Tiene redes vinculadas</span>
                    )}
                  </p>
                </div>
                <div className="manager-item-actions">
                  <button className="button" type="button" onClick={() => editArtist(artist)}>
                    Editar
                  </button>
                  <button
                    className="button button--outline-danger"
                    type="button"
                    disabled={deletingId === artist.id}
                    onClick={() => handleDelete(artist.id)}
                  >
                    {deletingId === artist.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

