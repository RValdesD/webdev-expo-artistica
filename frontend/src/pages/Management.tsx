import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RegisteredUsers from '../components/RegisteredUsers';
import ArtistManager from '../components/ArtistManager';
import ArtworkManager from '../components/ArtworkManager';
import WorkshopManager from '../components/WorkshopManager';
import { useArtistsStore } from '../stores/artistsStore';
import '../styles/management.css';

type ManagementTab = 'artworks' | 'workshops' | 'artists' | 'users';

export default function Management() {
  const [activeTab, setActiveTab] = useState<ManagementTab>('artworks');
  // Lista de artistas del store global; si falla una recarga, los paneles siguen visibles.
  const { artists, status, error, load } = useArtistsStore();
  const loaded = status === 'ready';
  // Después de crear, editar o borrar un artista se pide de nuevo: el servidor define la lista y su orden.
  const reloadArtists = () => void load(true);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="management-page" aria-labelledby="management-title">
      <header className="management-heading">
        <p className="eyebrow">EXPO / GESTIÓN</p>
        <h1 id="management-title">Panel de gestión</h1>
        <p>Crea, edita y elimina el contenido publicado de la exposición.</p>
        <Link className="button" to="/gestion/envios">Revisar obras de artistas</Link>
        <Link className="button" to="/gestion/exposiciones">Gestionar exposiciones del inicio</Link>
      </header>

      <div className="management-tabs" role="tablist" aria-label="Tipo de contenido">
        <button type="button" role="tab" aria-selected={activeTab === 'artworks'}
          onClick={() => setActiveTab('artworks')}>Obras</button>
        <button type="button" role="tab" aria-selected={activeTab === 'workshops'}
          onClick={() => setActiveTab('workshops')}>Talleres</button>
        <button type="button" role="tab" aria-selected={activeTab === 'artists'}
          onClick={() => setActiveTab('artists')}>Artistas y Redes</button>
        <button type="button" role="tab" aria-selected={activeTab === 'users'}
          onClick={() => setActiveTab('users')}>Usuarios registrados</button>
      </div>

      {activeTab !== 'users' && error && (
        <p role="alert">
          {error}{' '}
          <button className="button button--secondary" type="button" onClick={reloadArtists}>
            Reintentar
          </button>
        </p>
      )}

      {activeTab === 'users' ? <RegisteredUsers /> : !loaded ? (!error && <p role="status">Cargando artistas…</p>) : (
        activeTab === 'artists' ? (
          <ArtistManager artists={artists} onChanged={reloadArtists} />
        ) : artists.length === 0 ? (
          <p role="alert">Necesitas al menos un artista antes de crear obras o talleres.</p>
        ) : activeTab === 'artworks' ? (
          <ArtworkManager artists={artists} />
        ) : (
          <WorkshopManager artists={artists} />
        )
      )}
    </section>
  );
}
