import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Artwork } from '../types/artwork';

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = artwork.imageUrl && failedUrl !== artwork.imageUrl;

  return (
    <article className="artwork-card">
      {hasImage ? (
        <img
          className="artwork-card__image"
          src={artwork.imageUrl}
          alt={artwork.title}
          loading="lazy"
          onError={() => setFailedUrl(artwork.imageUrl)}
        />
      ) : (
        <div className="artwork-card__placeholder">Imagen no disponible</div>
      )}

      <div className="artwork-card__body">
        <p className="artwork-card__medium">{artwork.medium} · {artwork.year}</p>
        <h2>{artwork.title}</h2>
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
