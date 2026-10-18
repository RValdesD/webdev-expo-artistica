import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ArtistPortrait from '../components/ArtistPortrait';
import ArtworkCard from '../components/ArtworkCard';
import artistsService from '../services/artists';
import artworksService from '../services/artworks';
import type { Artist } from '../types/artist';
import type { Artwork } from '../types/artwork';
import '../styles/artists.css';
import '../styles/catalog.css';

type Result =
  | { status: 'loading' }
  | { status: 'ready'; artist: Artist }
  | { status: 'missing' }
  | { status: 'error' };

// Keying the content by id resets its state when navigating between artists.
export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  return <ArtistProfile key={id} id={id} />;
}

function ArtistProfile({ id }: { id: string | undefined }) {
  const [result, setResult] = useState<Result>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    if (!id) {
      setResult({ status: 'missing' });
      return;
    }

    const controller = new AbortController();
    setResult({ status: 'loading' });

    artistsService.getById(id, controller.signal)
      .then(artist => {
        if (!controller.signal.aborted) setResult({ status: 'ready', artist });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const missing = axios.isAxiosError(error) && error.response?.status === 404;
        setResult({ status: missing ? 'missing' : 'error' });
      });

    return () => controller.abort();
  }, [id, attempt]);

  // Obras del artista: si fallan, el perfil se muestra igual, sin esa sección.
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    artworksService.getAll(controller.signal)
      .then(all => {
        if (!controller.signal.aborted) setArtworks(all.filter(artwork => artwork.artistId === id));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [id]);

  return (
    <section className="artists-page">
      <Link className="artist-back" to="/artists">← Volver a artistas</Link>

      {result.status === 'loading' && <p role="status">Cargando perfil…</p>}

      {result.status === 'missing' && (
        <div>
          <h1>Artista no encontrado</h1>
          <p>Este perfil no existe o ya no está disponible.</p>
        </div>
      )}

      {result.status === 'error' && (
        <div role="alert">
          <h1>No pudimos cargar el perfil</h1>
          <button className="button" type="button" onClick={() => setAttempt(value => value + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {result.status === 'ready' && (
        <>
          <article className="artist-profile">
            <ArtistPortrait name={result.artist.name} imageUrl={result.artist.imageUrl} />
            <div className="artist-profile__info">
              <p className="artist-discipline">{result.artist.discipline}</p>
              <h1>{result.artist.name}</h1>
              {result.artist.isSample && <p className="artist-sample">Perfil ficticio de demostración</p>}
              <h2>Sobre el artista</h2>
              <p className="artist-biography">{result.artist.bio}</p>
              <dl className="artist-profile__facts">
                <div><dt>Disciplina</dt><dd>{result.artist.discipline}</dd></div>
                <div><dt>Obras en la expo</dt><dd>{artworks.length}</dd></div>
              </dl>
            </div>
          </article>

          {artworks.length > 0 && (
            <section className="artist-works" aria-labelledby="artist-works-title">
              <h2 id="artist-works-title">Obras en la expo</h2>
              <div className="catalog-grid">
                {artworks.map(artwork => <ArtworkCard key={artwork.id} artwork={artwork} />)}
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
