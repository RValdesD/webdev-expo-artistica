import { useEffect, useState } from 'react';
import ArtworkCard from '../components/ArtworkCard';
import artworksService from '../services/artworks';
import type { Artwork } from '../types/artwork';
import '../styles/catalog.css';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function Catalog() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [search, setSearch] = useState('');
  const [medium, setMedium] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    artworksService.getAll(controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setArtworks(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const mediums = [...new Set(artworks.map(artwork => artwork.medium))]
    .sort((a, b) => a.localeCompare(b, 'es'));

  const filteredArtworks = artworks.filter(artwork => {
    const matchesMedium = !medium || artwork.medium === medium;
    const searchableText = `${artwork.title} ${artwork.artist?.name ?? ''}`;
    return matchesMedium && normalize(searchableText).includes(normalize(search));
  });

  function clearFilters() {
    setSearch('');
    setMedium('');
  }

  return (
    <section className="catalog-page" aria-labelledby="catalog-title">
      <header className="catalog-heading">
        <p className="eyebrow">EXPO / CATÁLOGO</p>
        <h1 id="catalog-title">Coleccion de obras!</h1>
        <p>Explora las obras maestras en nuestro catalogo</p>
      </header>

      {loading ? (
        <p role="status">Cargando obras…</p>
      ) : error ? (
        <div role="alert">
          <p>No pudimos cargar el catálogo. Inténtalo nuevamente.</p>
          <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>
            Reintentar
          </button>
        </div>
      ) : artworks.length === 0 ? (
        <p>Aún no hay obras publicadas.</p>
      ) : (
        <>
          <div className="catalog-filters">
            <div>
              <label htmlFor="artwork-search">Buscar por título o artista</label>
              <input
                id="artwork-search"
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Escribe un título o nombre…"
              />
            </div>
            <div>
              <label htmlFor="artwork-medium">Medio</label>
              <select id="artwork-medium" value={medium} onChange={event => setMedium(event.target.value)}>
                <option value="">Todos los medios</option>
                {mediums.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <button className="button" type="button" onClick={clearFilters} disabled={!search && !medium}>
              Limpiar filtros
            </button>
          </div>

          <p className="catalog-count" role="status">{filteredArtworks.length} de {artworks.length} obras</p>

          {filteredArtworks.length === 0 ? (
            <p>No se encontraron obras con esos filtros.</p>
          ) : (
            <div className="catalog-grid">
              {filteredArtworks.map(artwork => <ArtworkCard key={artwork.id} artwork={artwork} />)}
            </div>
          )}
        </>
      )}
    </section>
  );
}

