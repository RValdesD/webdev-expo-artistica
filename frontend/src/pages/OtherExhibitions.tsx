import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import exhibitionsService from '../services/exhibitions';
import { useArtistsStore } from '../stores/artistsStore';
import type { Exhibition } from '../types/exhibition';
import '../styles/exhibitions.css';

const dateFormatter = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' });

// "12 jun 2027 – 31 jul 2027"; si falta una fecha, se muestra solo la otra.
function dateRange(item: Exhibition): string {
  const start = item.startDate ? dateFormatter.format(new Date(item.startDate)) : '';
  const end = item.endDate ? dateFormatter.format(new Date(item.endDate)) : '';
  return start && end ? `${start} – ${end}` : start ? `Desde el ${start}` : end ? `Hasta el ${end}` : '';
}

// Carga las exposiciones (o una sola); los artistas salen del store para mostrar su nombre.
function useExhibitions(id?: string) {
  const [items, setItems] = useState<Exhibition[]>([]);
  // Los artistas vienen del store global (solo para mostrar el nombre de cada uno).
  const { artists, load } = useArtistsStore();
  useEffect(() => { void load(); }, [load]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    const request = id
      ? exhibitionsService.getOne(id, controller.signal).then(item => [item])
      : exhibitionsService.getAll(controller.signal).then(all => all.filter(item => item.featured === false));
    request
      .then(data => { if (!controller.signal.aborted) { setItems(data); setStatus('ready'); } })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        const notFound = (reason as { response?: { status?: number } }).response?.status === 404;
        setStatus(notFound ? 'missing' : 'error');
      });
    return () => controller.abort();
  }, [id, attempt]);
  const artistOf = (item: Exhibition) => artists.find(artist => artist.id === item.artistId) ?? null;
  return { items, status, artistOf, retry: () => setAttempt(n => n + 1) };
}

export default function OtherExhibitions() {
  const { items, status, artistOf, retry } = useExhibitions();
  return <section className="section other-expos" aria-labelledby="other-expos-title">
    <Link to="/">← Volver al inicio</Link>
    <p className="eyebrow">TAMBIÉN EN LA EXPO</p>
    <h1 id="other-expos-title">Otras exposiciones</h1>
    <p>Recorre las salas y conoce a los artistas detrás de cada muestra.</p>
    {status === 'loading' ? <p role="status">Cargando exposiciones…</p> : status === 'error' ? (
      <div role="alert"><p>No pudimos cargar las exposiciones.</p><button className="button" type="button" onClick={retry}>Reintentar</button></div>
    ) : items.length === 0 ? <p>Aún no hay otras exposiciones publicadas.</p> : (
      <ul className="other-expos__grid">
        {items.map(item => {
          const artist = artistOf(item);
          const meta = [item.room, item.discipline].filter(Boolean).join(' · ');
          return <li key={item.id} className="other-expos__card">
            {meta && <p className="other-expos__meta">{meta}</p>}
            <h2><Link to={`/otras-exposiciones/${encodeURIComponent(item.id)}`}>{item.title}</Link></h2>
            {dateRange(item) && <p className="other-expos__dates">{dateRange(item)}</p>}
            <p>{item.description}</p>
            {artist && <Link to={`/artists/${encodeURIComponent(artist.id)}`}>Conoce a {artist.name} <span aria-hidden="true">→</span></Link>}
          </li>;
        })}
      </ul>
    )}
  </section>;
}

export function ExhibitionDetail() {
  const { id = '' } = useParams();
  const { items: [item], status, artistOf, retry } = useExhibitions(id);
  if (status === 'loading') return <section className="section" role="status">Cargando exposición…</section>;
  if (status !== 'ready' || !item) {
    return <section className="section">
      <Link to="/otras-exposiciones">← Otras exposiciones</Link>
      {status === 'error'
        ? <div role="alert"><p>No pudimos cargar la exposición.</p><button className="button" type="button" onClick={retry}>Reintentar</button></div>
        : <h1>Exposición no encontrada</h1>}
    </section>;
  }
  const artist = artistOf(item);
  const meta = [item.room, item.discipline].filter(Boolean).join(' · ');
  return <section className="section other-expos" aria-labelledby="exhibition-title">
    <Link to="/otras-exposiciones">← Otras exposiciones</Link>
    {meta && <p className="other-expos__meta">{meta}</p>}
    <h1 id="exhibition-title">{item.title}</h1>
    <p className="other-expos__heading">{item.heading}</p>
    {dateRange(item) && <p className="other-expos__dates">{dateRange(item)}</p>}
    {item.imageUrl && <figure className="other-expos__figure">
      <img src={item.imageUrl} alt={item.imageAlt} />
      {item.caption && <figcaption>{item.caption}</figcaption>}
    </figure>}
    <p className="expo-item__description">{item.description}</p>
    {artist && <Link className="button" to={`/artists/${encodeURIComponent(artist.id)}`}>Conoce a {artist.name}</Link>}
  </section>;
}
