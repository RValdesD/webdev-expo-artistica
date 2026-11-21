import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import axiosSecure from '../utils/axiosSecure';
import { apiError } from '../services/auth';
import ImageUpload from '../components/ImageUpload';
import ImageListUpload from '../components/ImageListUpload';
import '../styles/profile.css';

interface Submission { _id: string; title: string; status: string; reviewNote: string; imageUrl: string; images?: string[] }
// Igual que MAX_ARTWORK_IMAGES en el backend.
const MAX_EXTRA_IMAGES = 10;
const emptyWork = () => ({ title: '', medium: '', year: new Date().getFullYear(), description: '', imageUrl: '', images: [] as string[] });
const statusLabels: Record<string, string> = { pending: 'Pendiente de revisión', publishing: 'Publicación en proceso', approved: 'Publicada', rejected: 'Rechazada' };

// "Publicar" (menú del avatar): el artista envía obras a revisión y ve el estado de sus envíos.
export default function PublishArtwork() {
  const { user } = useAuthStore();
  const [hasProfile, setHasProfile] = useState(false);
  const [work, setWork] = useState(emptyWork);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [workUpload, setWorkUpload] = useState(false);
  const [extraUpload, setExtraUpload] = useState(false);

  useEffect(() => {
    if (user?.role !== 'artista') { setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setLoadError('');
    Promise.all([
      // El perfil solo existe (y tiene id) después de guardarlo en Mi perfil.
      axiosSecure.get<{ id?: string }>('/api/artist-account/profile', { signal: controller.signal }),
      axiosSecure.get<Submission[]>('/api/artist-account/submissions', { signal: controller.signal }),
    ]).then(([p, s]) => { if (!controller.signal.aborted) { setHasProfile(Boolean(p.data.id)); setSubmissions(s.data); } })
      .catch(reason => { if (!controller.signal.aborted) setLoadError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.role, attempt]);

  async function submitWork(event: FormEvent) {
    event.preventDefault(); if (saving || workUpload || extraUpload) return; setSaving(true); setError(''); setMessage('');
    try { const { data } = await axiosSecure.post<Submission>('/api/artist-account/submissions', work); setSubmissions(list => [data, ...list]); setWork(emptyWork()); setMessage('Obra enviada. Un organizador debe aprobarla antes de que aparezca en el catálogo.'); }
    catch (reason) { setError(apiError(reason)); } finally { setSaving(false); }
  }

  if (user?.role !== 'artista') return <section className="status"><h1>Publicar una obra</h1><p>Esta sección está disponible solo para cuentas de artista.</p></section>;
  if (loading) return <section className="status" role="status">Cargando…</section>;
  if (loadError) return <section className="status"><p role="alert">{loadError}</p><button onClick={() => setAttempt(n => n + 1)}>Reintentar</button></section>;
  const busy = saving || workUpload || extraUpload;

  return <section className="user-profile">
    <h1>Publicar una obra</h1>
    <p>Cada envío permanece pendiente hasta que lo revise un organizador. Al aprobarlo, aparece en el catálogo.</p>
    {!hasProfile ? (
      <p className="profile-notice" role="status">
        Antes de publicar, completa y guarda tu perfil de artista. <Link to="/mi-perfil">Ir a Mi perfil</Link>
      </p>
    ) : <>
      {error && <p role="alert" className="field-error">{error}</p>}{message && <p role="status">{message}</p>}
      <form className="management-form profile-submission-form" onSubmit={submitWork} aria-labelledby="publish-form-title">
        <h2 id="publish-form-title">Enviar una obra</h2>
        <ImageUpload disabled={saving || extraUpload} label="Imagen principal de la obra" value={work.imageUrl} onChange={imageUrl => setWork(w => ({ ...w, imageUrl }))} onBusy={setWorkUpload} />
        <ImageListUpload disabled={saving || workUpload} label="Imágenes adicionales" max={MAX_EXTRA_IMAGES} value={work.images} onChange={images => setWork(w => ({ ...w, images }))} onBusy={setExtraUpload} />
        <label htmlFor="work-title">Título</label><input id="work-title" required maxLength={200} value={work.title} onChange={e => setWork(w => ({ ...w, title: e.target.value }))} />
        <label htmlFor="work-medium">Técnica</label><input id="work-medium" required maxLength={100} value={work.medium} onChange={e => setWork(w => ({ ...w, medium: e.target.value }))} />
        <label htmlFor="work-year">Año</label><input id="work-year" type="number" min={0} max={9999} required value={work.year} onChange={e => setWork(w => ({ ...w, year: Number(e.target.value) }))} />
        <label htmlFor="work-description">Descripción de la obra</label><textarea id="work-description" rows={5} maxLength={3000} value={work.description} onChange={e => setWork(w => ({ ...w, description: e.target.value }))} />
        <button className="button" disabled={busy || !work.imageUrl}>Enviar a revisión</button>
      </form>
    </>}
    <h2>Mis envíos</h2>{submissions.length === 0 && <p>Aún no has enviado obras.</p>}
    {submissions.map(s => <article className="submission-card" key={s._id}><img src={s.imageUrl} alt={s.title} /><div><h3>{s.title}</h3><p>{statusLabels[s.status] ?? s.status}</p>{s.images && s.images.length > 0 && <p>{s.images.length + 1} imágenes en la galería</p>}{s.reviewNote && <p>Comentario: {s.reviewNote}</p>}</div></article>)}
  </section>;
}
