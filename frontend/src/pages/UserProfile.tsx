import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useArtistsStore } from '../stores/artistsStore';
import axiosSecure from '../utils/axiosSecure';
import { apiError } from '../services/auth';
import ImageUpload from '../components/ImageUpload';
import '../styles/profile.css';
interface Profile { slug?: string; name: string; discipline: string; bio: string; imageUrl: string }

// "Mi perfil": datos públicos del artista. Las obras se envían desde "Publicar" (/publicar).
export default function UserProfile() {
  const { user, refresh } = useAuthStore();
  const [profile, setProfile] = useState<Profile>({ name: '', discipline: '', bio: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileUpload, setProfileUpload] = useState(false);
  useEffect(() => {
    if (user?.role !== 'artista') { setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setLoadError('');
    axiosSecure.get<Profile>('/api/artist-account/profile', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setProfile(data); })
      .catch(reason => { if (!controller.signal.aborted) setLoadError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.role, attempt]);
  async function saveProfile(event: FormEvent) {
    event.preventDefault(); if (saving || profileUpload) return; setSaving(true); setError(''); setMessage('');
    try { const { data } = await axiosSecure.put<Profile>('/api/artist-account/profile', profile); setProfile(data); setMessage('Perfil guardado.'); void useArtistsStore.getState().load(true); await refresh(); }
    catch (reason) { setError(apiError(reason)); } finally { setSaving(false); }
  }
  if (user?.role !== 'artista') return <section className="status"><h1>Perfil de artista</h1><p>Esta sección está disponible solo para cuentas de artista.</p></section>;
  if (loading) return <section className="status" role="status">Cargando perfil…</section>;
  if (loadError) return <section className="status"><p role="alert">{loadError}</p><button onClick={() => setAttempt(n => n + 1)}>Reintentar</button></section>;
  const busy = saving || profileUpload;
  return <section className="user-profile">
    <h1>Mi perfil</h1>
    <p>Personaliza tu perfil público. Para enviar obras a revisión, ve a <Link to="/publicar">Publicar una obra</Link>.</p>
    <aside className="profile-guidelines"><h2>Antes de publicar</h2><p>Usa imágenes propias o con autorización. JPG, PNG o WebP sin animación, hasta 5 MB y entre 100 × 100 y 25 millones de píxeles. Para el retrato se recomienda una imagen cuadrada. Se optimizarán a WebP.</p><p>Describe tu trabajo con respeto, sin datos privados de otras personas, suplantación ni contenido discriminatorio. Tu nombre, retrato, disciplina y descripción serán públicos al guardar. Las obras requieren aprobación.</p></aside>
    {error && <p role="alert" className="field-error">{error}</p>}{message && <p role="status">{message}</p>}
    <form className="management-form" onSubmit={saveProfile}>
      <h2>Imagen de perfil</h2>
      <ImageUpload disabled={saving} circle label="Foto de perfil" value={profile.imageUrl} onChange={imageUrl => setProfile(p => ({ ...p, imageUrl }))} onBusy={setProfileUpload} />
      <label htmlFor="profile-name">Nombre público</label><input id="profile-name" required maxLength={120} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
      <label htmlFor="profile-discipline">Disciplina</label><input id="profile-discipline" required maxLength={100} value={profile.discipline} onChange={e => setProfile(p => ({ ...p, discipline: e.target.value }))} />
      <label htmlFor="profile-bio">Descripción personal</label><textarea id="profile-bio" className="profile-description" required rows={10} maxLength={5000} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
      <small>{profile.bio.length} / 5000 caracteres</small><button className="button" disabled={busy}>Guardar perfil</button>
      {profile.slug && <Link to={`/artists/${profile.slug}`}>Ver perfil público</Link>}
    </form>
  </section>;
}
