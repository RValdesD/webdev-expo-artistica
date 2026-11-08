import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ArtistPortrait from '../components/ArtistPortrait';
import artistsService from '../services/artists';
import type { Artist } from '../types/artist';
import '../styles/artists.css';

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

            {result.artist.socials && Object.values(result.artist.socials).some(Boolean) && (
              <div className="artist-socials">
                <h2>Redes y enlaces</h2>
                <div className="artist-socials-links">
                  {result.artist.socials.instagram && (
                    <a
                      href={result.artist.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link"
                      aria-label={`Instagram de ${result.artist.name}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      <span>Instagram</span>
                    </a>
                  )}
                  {result.artist.socials.website && (
                    <a
                      href={result.artist.socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link"
                      aria-label={`Sitio web de ${result.artist.name}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      <span>Sitio web</span>
                    </a>
                  )}
                  {result.artist.socials.twitter && (
                    <a
                      href={result.artist.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link"
                      aria-label={`X / Twitter de ${result.artist.name}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                      </svg>
                      <span>X / Twitter</span>
                    </a>
                  )}
                  {result.artist.socials.behance && (
                    <a
                      href={result.artist.socials.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link"
                      aria-label={`Behance de ${result.artist.name}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 8h5a3 3 0 0 1 0 6H3V8z"></path>
                        <path d="M3 14h5.5a3.5 3.5 0 0 1 0 7H3V14z"></path>
                        <path d="M15 13a4 4 0 1 0 7.5 -1.5"></path>
                        <line x1="15" y1="9" x2="22" y2="9"></line>
                      </svg>
                      <span>Behance</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
