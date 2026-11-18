import { useRef, useState } from 'react';
import { apiError } from '../services/auth';
import { imageFileError, uploadArtistImage } from '../services/artistImages';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  label: string;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}

// Varias imágenes de una misma obra: se agregan de a una o varias a la vez
// (botón o arrastrando) y se pueden quitar antes de enviar.
export default function ImageListUpload({ value, onChange, max, label, onBusy, disabled = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = progress !== null;
  const remaining = max - value.length;

  async function upload(files: File[]) {
    if (busy || disabled || files.length === 0) return;
    const problems: string[] = [];
    if (files.length > remaining) problems.push(`Solo puedes agregar ${remaining} imagen${remaining === 1 ? '' : 'es'} más (máximo ${max}).`);
    const valid = files.slice(0, Math.max(0, remaining)).filter(file => {
      const error = imageFileError(file);
      if (error) problems.push(error);
      return !error;
    });
    setErrors(problems);
    if (valid.length === 0) return;
    setProgress({ done: 0, total: valid.length });
    onBusy(true);
    const urls = [...value];
    // De a una, en orden: el servidor procesa cada imagen y el progreso se ve claro.
    for (const file of valid) {
      try { urls.push(await uploadArtistImage(file)); onChange([...urls]); }
      catch (reason) { problems.push(`«${file.name}»: ${apiError(reason)}`); setErrors([...problems]); }
      setProgress(current => current && { ...current, done: current.done + 1 });
    }
    setProgress(null);
    onBusy(false);
    if (input.current) input.current.value = '';
  }

  return (
    <div
      className={`image-list-upload${dragging ? ' image-upload--dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); void upload([...event.dataTransfer.files]); }}
    >
      <p className="image-list-upload__title">{label} <span>({value.length} de {max})</span></p>
      {value.length > 0 && (
        <ul className="image-list-upload__list">
          {value.map((url, position) => (
            <li key={url}>
              <img src={url} alt={`Imagen adicional ${position + 1}`} />
              <button type="button" className="image-list-upload__remove" disabled={busy || disabled}
                aria-label={`Quitar imagen adicional ${position + 1}`}
                onClick={() => onChange(value.filter(item => item !== url))}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
      <p className="image-list-upload__hint">
        {progress ? `Subiendo ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…`
          : remaining > 0 ? 'Otras vistas de la obra: detalles, otro ángulo o el montaje. Puedes seleccionar varias a la vez.'
          : 'Llegaste al máximo de imágenes adicionales.'}
      </p>
      <input ref={input} className="visually-hidden" type="file" multiple accept="image/jpeg,image/png,image/webp"
        tabIndex={-1} aria-label={label} disabled={busy || disabled || remaining <= 0}
        onChange={event => void upload([...(event.target.files ?? [])])} />
      <button className="button button--secondary" type="button" disabled={busy || disabled || remaining <= 0} onClick={() => input.current?.click()}>
        {busy ? 'Subiendo…' : 'Agregar imágenes'}
      </button>
      {errors.length > 0 && <ul className="field-error image-list-upload__errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
    </div>
  );
}
