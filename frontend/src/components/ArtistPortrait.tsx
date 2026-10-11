import { useState } from 'react';

interface Props {
  name: string;
  imageUrl: string;
}

// Missing or broken images show initials instead of a broken-image icon.
export default function ArtistPortrait({ name, imageUrl }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('');

  if (!imageUrl || failedUrl === imageUrl) {
    return (
      <div className="artist-portrait artist-portrait--placeholder" role="img" aria-label={`Sin retrato de ${name}`}>
        <span aria-hidden="true">{initials}</span>
      </div>
    );
  }

  return (
    <img
      className="artist-portrait"
      src={imageUrl}
      alt={`Retrato de ${name}`}
      loading="lazy"
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}
