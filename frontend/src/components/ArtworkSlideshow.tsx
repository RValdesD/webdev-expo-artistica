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

  const step = useCallback((delta: number) => setCurrentIndex(prev => (prev + delta + total) % total), [total]);
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
    if (event.key === 'ArrowRight') nextSlide();
    else if (event.key === 'ArrowLeft') prevSlide();
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

  const currentArtwork = validArtworks[currentIndex];

  return (
    <section 
      className="artwork-slideshow" 
      aria-roledescription="carousel" 
      aria-label="Galería destacada de obras"
      onKeyDown={handleKeyDown}
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
            aria-label={isPlaying ? 'Pausar reproducción automática' : 'Reanudar reproducción automática'}
          >
            {isPlaying ? '⏸ Pausar' : '▶ Reproducir'}
          </button>
          <span className="slideshow-counter" aria-live="polite">
            {currentIndex + 1} de {total}
          </span>
        </div>
      </div>

      <div className="slideshow-viewer" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <button 
          type="button" 
          className="slideshow-arrow slideshow-arrow--prev" 
          onClick={prevSlide}
          aria-label="Obra anterior"
        >
          ‹
        </button>

        <div className="slideshow-slide" role="group" aria-roledescription="slide" aria-label={`${currentIndex + 1} de ${total}`}>
          <div className="slideshow-image-wrapper">
            <img 
              src={currentArtwork.imageUrl} 
              alt={currentArtwork.title} 
              className="slideshow-image"
            />
          </div>
          <div className="slideshow-caption">
            <p className="slideshow-medium">{currentArtwork.medium} · {currentArtwork.year}</p>
            <h3 className="slideshow-title">{currentArtwork.title}</h3>
            {currentArtwork.artist ? (
              <p className="slideshow-artist">
                Por <Link to={`/artists/${encodeURIComponent(currentArtwork.artist.id)}`}>{currentArtwork.artist.name}</Link>
              </p>
            ) : null}
            {currentArtwork.description && (
              <p className="slideshow-description">{currentArtwork.description}</p>
            )}
          </div>
        </div>

        <button 
          type="button" 
          className="slideshow-arrow slideshow-arrow--next" 
          onClick={nextSlide}
          aria-label="Siguiente obra"
        >
          ›
        </button>
      </div>

      <div className="slideshow-dots" role="tablist" aria-label="Seleccionar diapositiva">
        {validArtworks.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={idx === currentIndex}
            aria-label={`Ver obra ${idx + 1}: ${item.title}`}
            className={`slideshow-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(ArtworkSlideshow);
