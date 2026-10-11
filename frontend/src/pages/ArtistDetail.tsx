import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ArtistPortrait from '../components/ArtistPortrait';
import ArtworkCard from '../components/ArtworkCard';
import artistsService from '../services/artists';
import artworksService from '../services/artworks';
import workshopsService from '../services/workshops';
import type { Artist } from '../types/artist';
import type { Artwork } from '../types/artwork';
import type { Workshop } from '../types/workshop';
import '../styles/artists.css';
import '../styles/catalog.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Santiago',
});

type Result =
  | { status: 'loading' }
  | { status: 'ready'; artist: Artist; artworks: Artwork[]; workshops: Workshop[] }
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

  useEffect(() => {
    if (!id) {
      setResult({ status: 'missing' });
      return;
    }

    const controller = new AbortController();
    setResult({ status: 'loading' });

    // El perfil, sus obras y sus talleres se piden a la vez.
    Promise.all([
      artistsService.getById(id, controller.signal),
      artworksService.getAll(controller.signal),
      workshopsService.getAll(controller.signal),
    ])
      .then(([artist, artworks, workshops]) => {
        if (controller.signal.aborted) return;
        setResult({
          status: 'ready',
          artist,
          artworks: artworks.filter(artwork => artwork.artistId === artist.id),
          workshops: workshops.filter(workshop => workshop.artistId === artist.id),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const missing = axios.isAxiosError(error) && error.response?.status === 404;
        setResult({ status: missing ? 'missing' : 'error' });
      });

    return () => controller.abort();
  }, [id, attempt]);

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
        <article className="artist-profile">
          <ArtistPortrait name={result.artist.name} imageUrl={result.artist.imageUrl} />
          <div>
            <p className="artist-discipline">{result.artist.discipline}</p>
            <h1>{result.artist.name}</h1>
            {result.artist.isSample && <p className="artist-sample">Perfil ficticio de demostración</p>}
            <h2>Sobre el artista</h2>
            <p className="artist-biography">{result.artist.bio}</p>
          </div>
        </article>
      )}

      {result.status === 'ready' && (
        <section className="artist-section" aria-labelledby="artist-artworks-title">
          <h2 id="artist-artworks-title">Obras en exposición</h2>
          {result.artworks.length > 0 ? (
            <div className="catalog-grid">
              {result.artworks.map(artwork => <ArtworkCard key={artwork.id} artwork={artwork} />)}
            </div>
          ) : (
            <p className="artist-empty">Este artista aún no tiene obras publicadas.</p>
          )}
        </section>
      )}

      {result.status === 'ready' && result.workshops.length > 0 && (
        <section className="artist-section" aria-labelledby="artist-workshops-title">
          <h2 id="artist-workshops-title">Talleres que imparte</h2>
          <ul className="artist-workshops">
            {result.workshops.map(workshop => (
              <li key={workshop.id}>
                <p className="artist-discipline">
                  <time dateTime={workshop.date}>{dateFormatter.format(new Date(workshop.date))}</time>
                </p>
                <h3>{workshop.title}</h3>
                <p className="artist-workshops__places">
                  {workshop.availablePlaces} de {workshop.capacity} cupos disponibles
                </p>
                <Link className="artist-profile-link" to="/workshops">Ver talleres e inscribirme</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
