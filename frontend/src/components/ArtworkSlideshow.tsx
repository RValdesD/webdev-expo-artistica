import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Artwork } from '../types/artwork';
import '../styles/slideshow.css';

const SWIPE_THRESHOLD_PX = 40;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

interface ArtworkSlideshowProps {
  artworks: Artwork[];
  autoPlayInterval?: number;
}

function ArtworkSlideshow({ artworks, autoPlayInterval = 5000 }: ArtworkSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => !prefersReducedMotion());
  const [isHovered, setIsHovered] = useState(false);

  const validArtworks = useMemo(() => artworks.filter(artwork => Boolean(artwork.imageUrl)), [artworks]);
  const total = validArtworks.length;

  const step = useCallback((delta: number) => setCurrentIndex(prev => total ? (Math.min(prev, total - 1) + delta + total) % total : 0), [total]);
  const nextSlide = () => step(1);
  const prevSlide = () => step(-1);

  // Swipe on touch screens: a mostly horizontal drag past the threshold changes the slide.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(touch.clientY - start.y)) return;
    step(dx < 0 ? 1 : -1);
  };

  // Keyboard navigation (← and →)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); nextSlide(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); prevSlide(); }
  };

  // Autoplay, paused on hover or when toggled off. It starts off for users who prefer reduced motion.
  useEffect(() => {
    if (!isPlaying || isHovered || total < 2) return;
    const timer = window.setInterval(() => step(1), autoPlayInterval);
    return () => window.clearInterval(timer);
  }, [isPlaying, isHovered, total, autoPlayInterval, step]);

  if (total === 0) {
    return null;
  }

  const selectedIndex = Math.min(currentIndex, total - 1);
  const currentArtwork = validArtworks[selectedIndex];

  return (
    <section 
      className="artwork-slideshow" 
      aria-roledescription="carousel" 
      aria-label="Galería destacada de obras"
      onKeyDown={handleKeyDown}
      onFocusCapture={() => setIsPlaying(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
    >
      <div className="slideshow-header">
        <div>
          <span className="eyebrow">OBRAS DESTACADAS</span>
          <h2>Galería en exhibición</h2>
        </div>
        <div className="slideshow-controls-top">
          <button 
            type="button" 
            className="slideshow-autoplay-toggle"
            onClick={() => setIsPlaying(p => !p)}
            disabled={total < 2}
            aria-label={isPlaying ? 'Pausar reproducción automática' : 'Reanudar reproducción automática'}
          >
            {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
          </button>
          <span className="slideshow-counter" aria-live={isPlaying && !isHovered ? 'off' : 'polite'}>
            {selectedIndex + 1} de {total}
          </span>
        </div>
      </div>

      <div className="slideshow-viewer" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button 
          type="button" 
          className="slideshow-arrow slideshow-arrow--prev" 
          onClick={prevSlide}
          disabled={total < 2}
          aria-label="Obra anterior"
        >
          ‹
        </button>

        <div className="slideshow-slide" role="group" aria-roledescription="slide" aria-label={`${selectedIndex + 1} de ${total}`}>
          <div className="slideshow-image-wrapper">
            <img 
              src={currentArtwork.imageUrl} 
              alt={currentArtwork.title} 
              className="slideshow-image"
            />
          </div>
          <div className="slideshow-caption">
            <p className="slideshow-medium">{currentArtwork.medium} · {currentArtwork.year}</p>
            <h3 className="slideshow-title"><Link to={`/catalog/${encodeURIComponent(currentArtwork.id)}`}>{currentArtwork.title}</Link></h3>
            {currentArtwork.artist ? (
              <p className="slideshow-artist">
                Por <Link to={`/artists/${encodeURIComponent(currentArtwork.artist.id)}`}>{currentArtwork.artist.name}</Link>
              </p>
            ) : null}
            {currentArtwork.description && (
              <p className="slideshow-description">{currentArtwork.description}</p>
            )}
            <Link className="button" to={`/catalog/${encodeURIComponent(currentArtwork.id)}`}>Ver obra y sus imágenes</Link>
          </div>
        </div>

        <button 
          type="button" 
          className="slideshow-arrow slideshow-arrow--next" 
          onClick={nextSlide}
          disabled={total < 2}
          aria-label="Siguiente obra"
        >
          ›
        </button>
      </div>

      <div className="slideshow-dots" role="group" aria-label="Seleccionar diapositiva">
        {validArtworks.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            aria-current={idx === selectedIndex ? 'true' : undefined}
            aria-label={`Ver obra ${idx + 1}: ${item.title}`}
            className={`slideshow-dot slideshow-preview ${idx === selectedIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <img src={item.previewImageUrl || item.imageUrl} alt="" loading="lazy" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(ArtworkSlideshow);
