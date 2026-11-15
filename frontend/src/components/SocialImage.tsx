import { useState, type ReactNode } from 'react';

// El enlace aporta el nombre accesible; la imagen es decorativa.
export default function SocialImage({ src, fallback }: { src?: string; fallback: ReactNode }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className="artist-social-image">
      {src && src !== failedUrl ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
      ) : fallback}
    </span>
  );
}
