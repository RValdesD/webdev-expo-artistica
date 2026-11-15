import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import axios from "axios";
import SocialImage from "../components/SocialImage";
import ArtistPortrait from "../components/ArtistPortrait";
import artistsService from "../services/artists";
import { type Artist } from "../types/artist";
import { socialPlatforms } from "../components/socialPlatforms";
import "../styles/artists.css";

const defaultSocialImages = {
  instagram: "/images/insta.png",
  website: "/images/website.png",
  twitter: "/images/twitter.png",
  behance: "/images/behance.png",
  pixiv: "/images/pixiv.png",
};

type Result =
  | { status: "loading" }
  | { status: "ready"; artist: Artist }
  | { status: "missing" }
  | { status: "error" };

// Keying the content by id resets its state when navigating between artists.
export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  return <ArtistProfile key={id} id={id} />;
}

function ArtistProfile({ id }: { id: string | undefined }) {
  const [result, setResult] = useState<Result>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) {
      setResult({ status: "missing" });
      return;
    }

    const controller = new AbortController();
    setResult({ status: "loading" });

    artistsService
      .getById(id, controller.signal)
      .then((artist) => {
        if (!controller.signal.aborted) setResult({ status: "ready", artist });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const missing =
          axios.isAxiosError(error) && error.response?.status === 404;
        setResult({ status: missing ? "missing" : "error" });
      });

    return () => controller.abort();
  }, [id, attempt]);

  if (
    result.status === "ready" &&
    result.artist.slug &&
    id !== result.artist.slug
  ) {
    return <Navigate to={`/artists/${result.artist.slug}`} replace />;
  }

  return (
    <section className="artists-page">
      <Link className="artist-back" to="/artists">
        ← Volver a artistas
      </Link>

      {result.status === "loading" && <p role="status">Cargando perfil…</p>}

      {result.status === "missing" && (
        <div>
          <h1>Artista no encontrado</h1>
          <p>Este perfil no existe o ya no está disponible.</p>
        </div>
      )}

      {result.status === "error" && (
        <div role="alert">
          <h1>No pudimos cargar el perfil</h1>
          <button
            className="button"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {result.status === "ready" && (
        <article className="artist-profile">
          <div className="artist-profile__media">
            <ArtistPortrait
              name={result.artist.name}
              imageUrl={result.artist.imageUrl}
            />
          </div>
          <div>
            <p className="artist-discipline">{result.artist.discipline}</p>
            <h1>{result.artist.name}</h1>
            {result.artist.isSample && (
              <p className="artist-sample">Perfil ficticio de demostración</p>
            )}
            <h2>Sobre el artista</h2>
            <p className="artist-biography">{result.artist.bio}</p>
            <section
              className="artist-socials"
              aria-label="Redes y enlaces del artista"
            >
              <h2>Contacto</h2>
              <div className="artist-socials-links">
                {socialPlatforms.map(({ key, label }) => {
                  const href = result.artist.socials?.[key];
                  const content = (
                    <>
                    <SocialImage
                      src={result.artist.socialImages?.[key] || defaultSocialImages[key]}
                      fallback={<span aria-hidden="true">▧</span>}
                    />
                      <span>{label}</span>
                    </>
                  );
                  return href ? (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="artist-social-link artist-social-link--image"
                      aria-label={`${label} de ${result.artist.name} (abre en otra pestaña)`}
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      key={key}
                      className="artist-social-link artist-social-link--image artist-social-link--empty"
                    >
                      {content}
                      <small>Sin enlace</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </article>
      )}
    </section>
  );
}
