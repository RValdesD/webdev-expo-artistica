import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import type { Artist } from '../types/artist';
import ArtistPortrait from './ArtistPortrait';

// La foto lleva a la página del artista, igual que el botón "Ver perfil".
export default function ArtistCard({ artist }: { artist: Artist }) {
  const profileUrl = `/artists/${encodeURIComponent(artist.slug ?? artist.id)}`;

  return (
    <Card component="article" className="artist-card">
      <CardActionArea
        component={RouterLink}
        to={profileUrl}
        className="artist-card__media"
        // Atajo para el mouse: el botón "Ver perfil" ya es el enlace para teclado y lectores de pantalla.
        tabIndex={-1}
        aria-hidden="true"
      >
        <ArtistPortrait name={artist.name} imageUrl={artist.imageUrl} decorative />
      </CardActionArea>
      <CardContent className="artist-card__body">
        <p className="artist-discipline">{artist.discipline}</p>
        <h2>{artist.name}</h2>
        {artist.isSample && <p className="artist-sample">Perfil ficticio de demostración</p>}
        <p className="artist-card__bio">{artist.bio}</p>
      </CardContent>
      <CardActions className="artist-card__actions">
        <Button component={RouterLink} to={profileUrl} variant="outlined" size="small" endIcon={<ArrowOutwardIcon />}>
          Ver perfil <span className="artist-sr-only">de {artist.name}</span>
        </Button>
      </CardActions>
    </Card>
  );
}
