import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArtworkGallery from '../components/ArtworkGallery';
import artworksService from '../services/artworks';
import type { Artwork } from '../types/artwork';
import '../styles/catalog.css';

export default function ArtworkDetail() {
  const { id = '' } = useParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setNotFound(false);
    artworksService.getOne(id, controller.signal)
      .then(data => { if (!controller.signal.aborted) setArtwork(data); })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const status = (reason as { response?: { status?: number } }).response?.status;
        if (status === 404) setNotFound(true); else setError(true);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]);

  if (loading) return <section className="catalog-page" role="status">Cargando obra…</section>;
  if (error || notFound || !artwork) {
    return (
      <section className="catalog-page">
        {error ? (
          <div role="alert">
            <p>No pudimos cargar la obra.</p>
            <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar</button>
          </div>
        ) : <h1>Obra no encontrada</h1>}
        <Link to="/catalog">← Volver al catálogo</Link>
      </section>
    );
  }

  const images = [artwork.imageUrl, ...(artwork.images ?? [])].filter(Boolean);

  return (
    <section className="catalog-page artwork-detail" aria-labelledby="artwork-title">
      <Link to="/catalog">← Volver al catálogo</Link>
      <div className="artwork-detail__layout">
        <ArtworkGallery key={artwork.id} title={artwork.title} images={images} />
        <div className="artwork-detail__info">
          <p className="artwork-card__medium">{artwork.medium} · {artwork.year}</p>
          <h1 id="artwork-title">{artwork.title}</h1>
          <p>
            {artwork.artist ? (
              <Link to={`/artists/${encodeURIComponent(artwork.artist.id)}`}>{artwork.artist.name}</Link>
            ) : 'Artista no disponible'}
          </p>
          {artwork.description && <p className="artwork-card__description">{artwork.description}</p>}
          {artwork.isSample && <p className="artwork-card__sample">Obra ficticia de demostración</p>}
        </div>
      </div>
    </section>
  );
}
