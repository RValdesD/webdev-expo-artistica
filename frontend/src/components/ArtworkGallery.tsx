import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';

const SWIPE_PX = 50;

interface Props {
  title: string;
  images: string[];
}

// Galería de las imágenes de una obra: se pasa a la imagen del lado con las flechas,
// los puntos, el teclado (← →) o deslizando el dedo en el celular. No avanza sola.
export default function ArtworkGallery({ title, images }: Props) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const visible = [...new Set(images.filter(Boolean))].filter(src => !failed.includes(src));
  const total = visible.length;

  if (total === 0) return <div className="gallery__placeholder">Imagen no disponible</div>;

  const current = Math.min(index, total - 1);
  const goTo = (next: number) => setIndex((next + total) % total);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(current + 1); }
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStart.current === null) return;
    const touch = event.changedTouches[0];
    const distance = touch.clientX - touchStart.current.x;
    const vertical = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(distance) >= SWIPE_PX && Math.abs(distance) > Math.abs(vertical)) goTo(distance < 0 ? current + 1 : current - 1);
  }

  return (
    <section
      className="gallery"
      aria-roledescription="carousel"
      aria-label={`Imágenes de ${title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { touchStart.current = null; }}
    >
      <div className="gallery__viewport" aria-live="polite">
        <img
          key={visible[current]}
          className="gallery__image"
          src={visible[current]}
          alt={total > 1 ? `${title}, imagen ${current + 1} de ${total}` : title}
          onError={() => setFailed(list => [...list, visible[current]])}
        />
        {total > 1 && (
          <>
            <button type="button" className="gallery__arrow gallery__arrow--prev" aria-label="Imagen anterior" onClick={() => goTo(current - 1)}>
              <span aria-hidden="true">‹</span>
            </button>
            <button type="button" className="gallery__arrow gallery__arrow--next" aria-label="Imagen siguiente" onClick={() => goTo(current + 1)}>
              <span aria-hidden="true">›</span>
            </button>
          </>
        )}
      </div>

      <p className="gallery__counter" role="status">Imagen {current + 1} de {total}</p>
      {total > 1 && (
        <div className="gallery__thumbs">
          {visible.map((src, position) => (
            <button
              key={src}
              type="button"
              className="gallery__thumb"
              aria-label={`Ver imagen ${position + 1} de ${total}`}
              aria-current={position === current ? 'true' : undefined}
              onClick={() => goTo(position)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
