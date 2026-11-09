import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Artwork } from '../types/artwork';

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = artwork.imageUrl && failedUrl !== artwork.imageUrl;
  const detailUrl = `/catalog/${encodeURIComponent(artwork.id)}`;
  const extraImages = artwork.images?.length ?? 0;

  return (
    <article className="artwork-card">
      <Link className="artwork-card__media" to={detailUrl} aria-label={`Ver ${artwork.title}`}>
        {hasImage ? (
          <img
            className="artwork-card__image"
            src={artwork.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(artwork.imageUrl)}
          />
        ) : (
          <div className="artwork-card__placeholder">Imagen no disponible</div>
        )}
        {extraImages > 0 && <span className="artwork-card__count">+{extraImages} {extraImages === 1 ? 'imagen' : 'imágenes'}</span>}
      </Link>

      <div className="artwork-card__body">
        <p className="artwork-card__medium">{artwork.medium} · {artwork.year}</p>
        <h2><Link to={detailUrl}>{artwork.title}</Link></h2>
        <p>
          {artwork.artist ? (
            <Link to={`/artists/${encodeURIComponent(artwork.artist.id)}`}>
              {artwork.artist.name}
            </Link>
          ) : 'Artista no disponible'}
        </p>
        {artwork.description && <p className="artwork-card__description">{artwork.description}</p>}
        {artwork.isSample && <p className="artwork-card__sample">Obra ficticia de demostración</p>}
      </div>
    </article>
  );
}
