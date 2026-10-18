import { useEffect, useState } from 'react';
import ArtworkManager from '../components/ArtworkManager';
import WorkshopManager from '../components/WorkshopManager';
import artistsService from '../services/artists';
import { apiError } from '../services/auth';
import type { Artist } from '../types/artist';
import '../styles/management.css';

type ManagementTab = 'artworks' | 'workshops';

export default function Management() {
  const [activeTab, setActiveTab] = useState<ManagementTab>('artworks');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    artistsService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setArtists(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <section className="management-page" aria-labelledby="management-title">
      <header className="management-heading">
        <p className="eyebrow">EXPO / GESTIÓN</p>
        <h1 id="management-title">Panel de gestión</h1>
        <p>Crea, edita y elimina el contenido publicado de la exposición.</p>
      </header>

      <div className="management-tabs" role="tablist" aria-label="Tipo de contenido">
        <button type="button" role="tab" aria-selected={activeTab === 'artworks'}
          onClick={() => setActiveTab('artworks')}>Obras</button>
        <button type="button" role="tab" aria-selected={activeTab === 'workshops'}
          onClick={() => setActiveTab('workshops')}>Talleres</button>
      </div>

      {loading ? <p role="status">Cargando artistas…</p> : error ? <p role="alert">{error}</p> : artists.length === 0 ? (
        <p role="alert">Necesitas al menos un artista antes de crear obras o talleres.</p>
      ) : activeTab === 'artworks' ? <ArtworkManager artists={artists} /> : <WorkshopManager artists={artists} />}
    </section>
  );
}
