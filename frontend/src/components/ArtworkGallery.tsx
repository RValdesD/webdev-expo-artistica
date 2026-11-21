import { useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';

const SWIPE_PX = 50;

interface Props {
  title: string;
  images: string[];
}

// Galería de las imágenes de una obra: se pasa a la imagen del lado con las flechas,
// las miniaturas, el teclado (← →) o deslizando el dedo en el celular. No avanza sola.
// Al hacer clic en la imagen se abre en grande.
export default function ArtworkGallery({ title, images }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const visible = [...new Set(images.filter(Boolean))].filter(src => !failed.includes(src));
  const total = visible.length;

  if (total === 0) return <div className="gallery__placeholder">Imagen no disponible</div>;

  const current = Math.min(index, total - 1);
  const goTo = (next: number) => setIndex((next + total) % total);
  const label = total > 1 ? `${title}, imagen ${current + 1} de ${total}` : title;

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(current + 1); }
  }

  const swipe = {
    onTouchStart: (event: TouchEvent<HTMLElement>) => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      if (touchStart.current === null) return;
      const touch = event.changedTouches[0];
      const distance = touch.clientX - touchStart.current.x;
      const vertical = touch.clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(distance) >= SWIPE_PX && Math.abs(distance) > Math.abs(vertical)) goTo(distance < 0 ? current + 1 : current - 1);
    },
    onTouchCancel: () => { touchStart.current = null; },
  };

  const arrows = total > 1 && (
    <>
      <IconButton className="gallery__arrow gallery__arrow--prev" aria-label="Imagen anterior" onClick={() => goTo(current - 1)}>
        <ChevronLeftIcon fontSize="large" />
      </IconButton>
      <IconButton className="gallery__arrow gallery__arrow--next" aria-label="Imagen siguiente" onClick={() => goTo(current + 1)}>
        <ChevronRightIcon fontSize="large" />
      </IconButton>
    </>
  );

  return (
    <section
      className="gallery"
      aria-roledescription="carousel"
      aria-label={`Imágenes de ${title}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...swipe}
    >
      <div className="gallery__viewport" aria-live="polite">
        <ButtonBase className="gallery__zoom" aria-label={`Ampliar ${label}`} onClick={() => setZoomed(true)}>
          <img
            key={visible[current]}
            className="gallery__image"
            src={visible[current]}
            alt={label}
            onError={() => setFailed(list => [...list, visible[current]])}
          />
          <span className="gallery__zoom-hint" aria-hidden="true"><ZoomInIcon fontSize="small" /></span>
        </ButtonBase>
        {arrows}
      </div>

      <Typography className="gallery__counter" role="status" variant="body2">Imagen {current + 1} de {total}</Typography>
      {total > 1 && (
        <div className="gallery__thumbs">
          {visible.map((src, position) => (
            <ButtonBase
              key={src}
              className="gallery__thumb"
              aria-label={`Ver imagen ${position + 1} de ${total}`}
              aria-current={position === current ? 'true' : undefined}
              onClick={() => goTo(position)}
            >
              <img src={src} alt="" loading="lazy" />
            </ButtonBase>
          ))}
        </div>
      )}

      <Dialog
        open={zoomed}
        onClose={() => setZoomed(false)}
        fullScreen
        // El teclado y el deslizamiento llegan a la <section> igual: en React los eventos de un portal suben por el árbol de componentes.
        PaperProps={{ className: 'gallery-lightbox', 'aria-label': `${title} ampliada` }}
      >
        <IconButton className="gallery-lightbox__close" aria-label="Cerrar imagen ampliada" onClick={() => setZoomed(false)}>
          <CloseIcon />
        </IconButton>
        <img className="gallery-lightbox__image" src={visible[current]} alt={label} />
        {arrows}
        {total > 1 && <Typography className="gallery-lightbox__counter" variant="body2">Imagen {current + 1} de {total}</Typography>}
      </Dialog>
    </section>
  );
}
