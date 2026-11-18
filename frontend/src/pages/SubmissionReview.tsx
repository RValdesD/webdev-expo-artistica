import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosSecure from '../utils/axiosSecure';
import { apiError } from '../services/auth';
import '../styles/profile.css';
interface Item { _id: string; artistId: string; title: string; description: string; medium: string; year: number; imageUrl: string; images?: string[]; status: string; reviewNote: string }
export default function SubmissionReview() {
  const [items, setItems] = useState<Item[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); const [busy, setBusy] = useState<string | null>(null); const [notes, setNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setError('');
    axiosSecure.get<Item[]>('/api/submissions', { signal: c.signal }).then(r => { if (!c.signal.aborted) setItems(r.data); }).catch(e => { if (!c.signal.aborted) setError(apiError(e)); }).finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [attempt]);
  async function review(id: string, decision: string) {
    if (busy) return; setBusy(id); setError('');
    try { const { data } = await axiosSecure.post<Item>(`/api/submissions/${id}/review`, { decision, reviewNote: notes[id] ?? '' }); setItems(list => list.map(x => x._id === id ? data : x)); }
    catch (e) { setError(apiError(e)); } finally { setBusy(null); }
  }
  return <section className="user-profile"><Link to="/gestion">← Gestión</Link><h1>Obras recibidas</h1><p>Aprobar publica la obra en el catálogo. Después puedes editarla o incluirla en el slideshow desde Gestión → Obras.</p>
    {error && <p role="alert">{error} <button onClick={() => setAttempt(n => n + 1)}>Actualizar</button></p>}{loading ? <p role="status">Cargando…</p> : items.length === 0 ? <p>No hay envíos.</p> : items.map(item => <article className="submission-card" key={item._id}>
      <img src={item.imageUrl} alt={item.title} /><div><h2>{item.title}</h2><Link to={`/artists/${item.artistId}`}>Ver artista</Link><p>{item.medium} · {item.year}</p><p>{item.description}</p>
      {item.images && item.images.length > 0 && <><p>{item.images.length} imágenes adicionales:</p><ul className="submission-card__extra">{item.images.map((src, position) => <li key={src}><a href={src} target="_blank" rel="noreferrer"><img src={src} alt={`${item.title}, imagen adicional ${position + 1}`} /></a></li>)}</ul></>}
      {['pending', 'publishing'].includes(item.status) ? <><label htmlFor={`note-${item._id}`}>Comentario para el artista</label><textarea id={`note-${item._id}`} rows={3} maxLength={1000} value={notes[item._id] ?? ''} onChange={e => setNotes(n => ({ ...n, [item._id]: e.target.value }))} /><div className="submission-actions"><button className="button" disabled={!!busy} onClick={() => void review(item._id, 'approved')}>{item.status === 'publishing' ? 'Reintentar publicación' : 'Aprobar y publicar'}</button><button className="button button--secondary" disabled={!!busy || item.status === 'publishing'} onClick={() => void review(item._id, 'rejected')}>Rechazar</button></div></> : <p>{item.status === 'approved' ? 'Publicada' : 'Rechazada'}{item.reviewNote && `: ${item.reviewNote}`}</p>}</div>
    </article>)}</section>;
}
