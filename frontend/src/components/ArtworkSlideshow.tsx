import { memo, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Artwork } from '../types/artwork';
import '../styles/slideshow.css';

interface ArtworkSlideshowProps {
  artworks: Artwork[];
  autoPlayInterval?: number;
}

function ArtworkSlideshow({ artworks, autoPlayInterval = 5000 }: ArtworkSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const validArtworks = useMemo(() => artworks.filter(artwork => Boolean(artwork.imageUrl)), [artworks]);
  const total = validArtworks.length;

  const nextSlide = () => setCurrentIndex(prev => (prev + 1) % total);
  const prevSlide = () => setCurrentIndex(prev => (prev - 1 + total) % total);

  // Keyboard navigation (← and →)
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') nextSlide();
    else if (event.key === 'ArrowLeft') prevSlide();
  };

  // Autoplay, paused on hover or when toggled off.
  useEffect(() => {
    if (!isPlaying || isHovered || total < 2) return;
    const timer = window.setInterval(() => setCurrentIndex(prev => (prev + 1) % total), autoPlayInterval);
    return () => window.clearInterval(timer);
  }, [isPlaying, isHovered, total, autoPlayInterval]);

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

      <div className="slideshow-viewer">
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
