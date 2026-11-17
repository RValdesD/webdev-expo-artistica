import { useEffect, useState } from 'react';
import ArtistCard from '../components/ArtistCard';
import { useArtistsStore } from '../stores/artistsStore';
import '../styles/artists.css';

// Search ignores case, accents and surrounding whitespace.
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function ArtistList() {
  // La lista viene del store global: si ya se cargó en otra vista, no se pide otra vez.
  const { artists, status, load } = useArtistsStore();
  const [search, setSearch] = useState('');
  const loading = status === 'idle' || status === 'loading';
  const error = status === 'error';

  useEffect(() => { void load(); }, [load]);

  const filteredArtists = artists.filter(artist =>
    normalize(artist.name).includes(normalize(search)),
  );

  return (
    <section className="artists-page" aria-labelledby="artists-title">
      <header className="artists-heading">
        <p className="eyebrow">EXPO / ARTISTAS</p>
        <h1 id="artists-title">Conoce a nuestros queridos artistas!</h1>
      </header>

      {loading ? (
        <p role="status">Cargando…</p>
      ) : error ? (
        <div role="alert">
          <p>No pudimos cargar los artistas. Inténtalo nuevamente.</p>
          <button className="button" type="button" onClick={() => void load(true)}>
            Reintentar
          </button>
        </div>
      ) : artists.length === 0 ? (
        <p>Aún no hay artistas publicados.</p>
      ) : (
        <>
          <div className="artists-search">
            <label htmlFor="artist-search">Buscar por nombre</label>
            <input
              id="artist-search"
              type="search"
              value={search}
              placeholder="Escribe el nombre de un artista…"
              onChange={event => setSearch(event.target.value)}
            />
            <p role="status">{filteredArtists.length} de {artists.length} artistas</p>
          </div>

          {filteredArtists.length > 0 ? (
            <div className="artists-grid">
              {filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} />)}
            </div>
          ) : (
            <div>
              <p>No se encontraron artistas con ese nombre.</p>
              <button className="button" type="button" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
