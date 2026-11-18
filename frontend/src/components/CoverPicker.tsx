import { useEffect, useState } from 'react';
import exhibitionsService, { type CoverImage } from '../services/exhibitions';
import { apiError } from '../services/auth';

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
}

// Portada de una exposición: se elige entre las imágenes de frontend/public/images/.
export default function CoverPicker({ value, onChange, error, disabled = false }: Props) {
  const [images, setImages] = useState<CoverImage[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    exhibitionsService.getCoverImages(controller.signal)
      .then(list => { if (!controller.signal.aborted) { setImages(list); setStatus('ready'); } })
      .catch(reason => { if (!controller.signal.aborted) { setLoadError(apiError(reason)); setStatus('error'); } });
    return () => controller.abort();
  }, [attempt]);

  // Una portada guardada que ya no está en la carpeta se muestra igual, marcada como faltante.
  const missing = value && status === 'ready' && !images.some(image => image.url === value);
  const options = [{ url: '', name: 'Sin portada' }, ...images, ...(missing ? [{ url: value, name: `${value.replace('/images/', '')} (no está en la carpeta)` }] : [])];

  return (
    <fieldset className="cover-picker" disabled={disabled} aria-describedby={error ? 'cover-picker-help exhibition-imageUrl-error' : 'cover-picker-help'}>
      <legend>Portada</legend>
      <p id="cover-picker-help" className="cover-picker__help">
        Imágenes de <code>frontend/public/images/</code>. Para agregar otra, copia el archivo a esa carpeta y recarga esta página.
      </p>
      {status === 'loading' ? <p role="status">Cargando imágenes…</p> : status === 'error' ? (
        <p role="alert">{loadError} <button type="button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></p>
      ) : (
        <div className="cover-picker__grid">
          {options.map(image => (
            <label key={image.url || 'none'} className={`cover-picker__option${value === image.url ? ' cover-picker__option--selected' : ''}`}>
              <input type="radio" name="exhibition-cover" value={image.url} checked={value === image.url} onChange={() => onChange(image.url)} />
              {image.url
                ? <img src={image.url} alt="" loading="lazy" />
                : <span className="cover-picker__none" aria-hidden="true">Sin imagen</span>}
              <span className="cover-picker__name">{image.name}</span>
            </label>
          ))}
        </div>
      )}
      {status === 'ready' && images.length === 0 && <p>No hay imágenes en la carpeta todavía.</p>}
    </fieldset>
  );
}
