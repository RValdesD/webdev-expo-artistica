import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import type { Artwork } from '../types/artwork';

export default function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const preview = artwork.previewImageUrl || artwork.imageUrl;
  const hasImage = preview && failedUrl !== preview;
  const detailUrl = `/catalog/${encodeURIComponent(artwork.id)}`;
  const extraImages = artwork.images?.length ?? 0;
  const totalImages = extraImages + (artwork.imageUrl ? 1 : 0);

  return (
    <Card component="article" className="artwork-card">
      <CardActionArea component={RouterLink} to={detailUrl} className="artwork-card__media" aria-label={`Ver ${artwork.title}`}>
        {hasImage ? (
          <img
            className="artwork-card__image"
            src={preview}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(preview)}
          />
        ) : (
          <div className="artwork-card__placeholder">{artwork.title} - vista previa no disponible</div>
        )}
        {extraImages > 0 && (
          <Chip
            className="artwork-card__count"
            icon={<PhotoLibraryOutlinedIcon />}
            label={`${totalImages} imágenes`}
            size="small"
          />
        )}
      </CardActionArea>

      <CardContent className="artwork-card__body">
        <p className="artwork-card__medium">{artwork.medium} · {artwork.year}</p>
        <h2><Link component={RouterLink} to={detailUrl} underline="none">{artwork.title}</Link></h2>
        <p>
          {artwork.artist ? (
            <Link component={RouterLink} to={`/artists/${encodeURIComponent(artwork.artist.id)}`} color="inherit">
              {artwork.artist.name}
            </Link>
          ) : 'Artista no disponible'}
        </p>
        {artwork.description && <p className="artwork-card__description">{artwork.description}</p>}
        {artwork.isSample && <p className="artwork-card__sample">Obra ficticia de demostración</p>}
      </CardContent>
    </Card>
  );
}
