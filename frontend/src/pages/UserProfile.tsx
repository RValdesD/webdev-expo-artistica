import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import axiosSecure from "../utils/axiosSecure";
import { apiError } from "../services/auth";
import ImageUpload from "../components/ImageUpload";
import "../styles/profile.css";
interface Profile {
  name: string;
  discipline: string;
  bio: string;
  imageUrl: string;
}
interface Submission {
  _id: string;
  title: string;
  status: string;
  reviewNote: string;
  imageUrl: string;
}
const emptyWork = () => ({
  title: "",
  medium: "",
  year: new Date().getFullYear(),
  description: "",
  imageUrl: "",
});
const statusLabels: Record<string, string> = {
  pending: "Pendiente de revisión",
  publishing: "Publicación en proceso",
  approved: "Publicada",
  rejected: "Rechazada",
};

export default function UserProfile() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    discipline: "",
    bio: "",
    imageUrl: "",
  });
  const [work, setWork] = useState(emptyWork);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileUpload, setProfileUpload] = useState(false);
  const [workUpload, setWorkUpload] = useState(false);
  useEffect(() => {
    if (user?.role !== "artista") {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    Promise.all([
      axiosSecure.get<Profile>("/api/artist-account/profile", {
        signal: controller.signal,
      }),
      axiosSecure.get<Submission[]>("/api/artist-account/submissions", {
        signal: controller.signal,
      }),
    ])
      .then(([p, s]) => {
        if (!controller.signal.aborted) {
          setProfile(p.data);
          setSubmissions(s.data);
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setLoadError(apiError(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.role, attempt]);
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (saving || profileUpload || workUpload) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await axiosSecure.put("/api/artist-account/profile", profile);
      setMessage("Perfil guardado.");
      await refresh();
    } catch (reason) {
      setError(apiError(reason));
    } finally {
      setSaving(false);
    }
  }
  async function submitWork(event: FormEvent) {
    event.preventDefault();
    if (saving || profileUpload || workUpload) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const { data } = await axiosSecure.post<Submission>(
        "/api/artist-account/submissions",
        work,
      );
      setSubmissions((list) => [data, ...list]);
      setWork(emptyWork());
      setMessage(
        "Obra enviada. Un organizador debe aprobarla antes de que aparezca en el catálogo.",
      );
    } catch (reason) {
      setError(apiError(reason));
    } finally {
      setSaving(false);
    }
  }
  if (user?.role !== "artista")
    return (
      <section className="status">
        <h1>Perfil de artista</h1>
        <p>Esta sección está disponible solo para cuentas de artista.</p>
      </section>
    );
  if (loading)
    return (
      <section className="status" role="status">
        Cargando perfil…
      </section>
    );
  if (loadError)
    return (
      <section className="status">
        <p role="alert">{loadError}</p>
        <button onClick={() => setAttempt((n) => n + 1)}>Reintentar</button>
      </section>
    );
  const busy = saving || profileUpload || workUpload;
  return (
    <section className="user-profile">
      <h1>Mi perfil</h1>
      <p>Personaliza tu perfil público y envía tus obras para revisión.</p>
      <aside className="profile-guidelines">
        <h2>Antes de publicar</h2>
        <p>
          Usa imágenes propias o con autorización. JPG, PNG o WebP sin
          animación, hasta 5 MB. Para
          el retrato se recomienda una imagen cuadrada  entre 100 × 100 y 720 × 720 px. 
        </p>
        <p>
          Describe tu trabajo con respeto, sin datos privados de otras personas,
          suplantación ni contenido discriminatorio. Tu nombre, retrato,
          disciplina y descripción serán públicos al guardar. Las obras
          requieren aprobación. 
        </p>
      </aside>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <form className="management-form" onSubmit={saveProfile}>
        <h2>Imagen de perfil</h2>
        <ImageUpload
          disabled={saving || workUpload}
          circle
          label="Foto de perfil"
          value={profile.imageUrl}
          onChange={(imageUrl) => setProfile((p) => ({ ...p, imageUrl }))}
          onBusy={setProfileUpload}
        />
        <label htmlFor="profile-name">Nombre público</label>
        <input
          id="profile-name"
          required
          maxLength={120}
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        />
        <label htmlFor="profile-discipline">Disciplina</label>
        <input
          id="profile-discipline"
          required
          maxLength={100}
          value={profile.discipline}
          onChange={(e) =>
            setProfile((p) => ({ ...p, discipline: e.target.value }))
          }
        />
        <label htmlFor="profile-bio">Descripción personal</label>
        <textarea
          id="profile-bio"
          className="profile-description"
          required
          rows={10}
          maxLength={5000}
          value={profile.bio}
          onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
        />
        <small>{profile.bio.length} / 5000 caracteres</small>
        <button className="button" disabled={busy}>
          Guardar perfil
        </button>
        <Link to={`/artists/artist-${user.id}`}>
          Ver perfil público (después de guardar)
        </Link>
      </form>
      <form
        className="management-form profile-submission-form"
        onSubmit={submitWork}
      >
        <h2>Enviar una obra</h2>
        <p>
          Guarda primero tu perfil. Cada envío permanece pendiente hasta que lo
          revise un organizador.
        </p>
        <ImageUpload
          disabled={saving || profileUpload}
          label="Imagen de la obra"
          value={work.imageUrl}
          onChange={(imageUrl) => setWork((w) => ({ ...w, imageUrl }))}
          onBusy={setWorkUpload}
        />
        <label htmlFor="work-title">Título</label>
        <input
          id="work-title"
          required
          maxLength={200}
          value={work.title}
          onChange={(e) => setWork((w) => ({ ...w, title: e.target.value }))}
        />
        <label htmlFor="work-medium">Técnica</label>
        <input
          id="work-medium"
          required
          maxLength={100}
          value={work.medium}
          onChange={(e) => setWork((w) => ({ ...w, medium: e.target.value }))}
        />
        <label htmlFor="work-year">Año</label>
        <input
          id="work-year"
          type="number"
          min={0}
          max={9999}
          required
          value={work.year}
          onChange={(e) =>
            setWork((w) => ({ ...w, year: Number(e.target.value) }))
          }
        />
        <label htmlFor="work-description">Descripción de la obra</label>
        <textarea
          id="work-description"
          rows={5}
          maxLength={3000}
          value={work.description}
          onChange={(e) =>
            setWork((w) => ({ ...w, description: e.target.value }))
          }
        />
        <button className="button" disabled={busy || !work.imageUrl}>
          Enviar a revisión
        </button>
      </form>
      <h2>Mis envíos</h2>
      {submissions.length === 0 && <p>Aún no has enviado obras.</p>}
      {submissions.map((s) => (
        <article className="submission-card" key={s._id}>
          <img src={s.imageUrl} alt={s.title} />
          <div>
            <h3>{s.title}</h3>
            <p>{statusLabels[s.status] ?? s.status}</p>
            {s.reviewNote && <p>Comentario: {s.reviewNote}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
