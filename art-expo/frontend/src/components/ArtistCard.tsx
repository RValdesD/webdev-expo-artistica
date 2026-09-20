import { Link } from 'react-router-dom';
import type { Artist } from '../types/artist';
import ArtistPortrait from './ArtistPortrait';

export default function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <article className="artist-card">
      <ArtistPortrait name={artist.name} imageUrl={artist.imageUrl} />
      <div className="artist-card__body">
        <p className="artist-discipline">{artist.discipline}</p>
        <h2>{artist.name}</h2>
        {artist.isSample && <p className="artist-sample">Perfil ficticio de demostración</p>}
        <p className="artist-card__bio">{artist.bio}</p>
        <Link className="artist-profile-link" to={`/artists/${encodeURIComponent(artist.id)}`}>
          Ver perfil <span className="artist-sr-only">de {artist.name}</span>
          <span aria-hidden="true"> ↗</span>
        </Link>
      </div>
    </article>
  );
}
