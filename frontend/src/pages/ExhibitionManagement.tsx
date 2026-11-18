import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import service from '../services/exhibitions';
import { useArtistsStore } from '../stores/artistsStore';
import { apiError, apiFields, apiMessage } from '../services/auth';
import FieldError, { fieldProps, type FieldErrors } from '../components/FieldError';
import CoverPicker from '../components/CoverPicker';
import type { Exhibition, ExhibitionInput } from '../types/exhibition';
import '../styles/exhibitions.css';
const blank: ExhibitionInput = {
  title: '', heading: '', description: '', theme: 'sea', imageUrl: '', imageAlt: '', caption: '', order: 2,
  featured: true, discipline: '', room: '', artistId: '', startDate: '', endDate: '', visitHours: '', visitNotes: '',
};
// "2027-06-12T16:00:00.000Z" -> "2027-06-12", que es lo que usa <input type="date">.
const day = (value?: string) => value ? value.slice(0, 10) : '';
const toForm = (item: Exhibition): ExhibitionInput => ({
  ...blank, ...item, featured: item.featured !== false, startDate: day(item.startDate), endDate: day(item.endDate),
});
export default function ExhibitionManagement() {
  const [items, setItems] = useState<Exhibition[]>([]);
  const [form, setForm] = useState<ExhibitionInput>({ ...blank });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fields, setFields] = useState<FieldErrors>({});
  const [attempt, setAttempt] = useState(0);
  // Artistas para elegir en el formulario, desde el store global.
  const { artists, load: loadArtists } = useArtistsStore();
  useEffect(() => { void loadArtists(); }, [loadArtists]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    service.getAll(controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  function reset() { setEditing(null); setForm({ ...blank }); setFields({}); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice(''); setFields({});
    try {
      if (editing) await service.update(editing, form); else await service.create(form);
      reset(); setNotice(form.featured ? 'Exposición guardada en la página de inicio.' : 'Exposición guardada en Otras exposiciones.'); setAttempt(n => n + 1);
    } catch (reason) { setError(apiMessage(reason)); setFields(apiFields(reason)); }
    finally { setBusy(false); }
  }
  async function remove(item: Exhibition) {
    if (busy || !window.confirm(`¿Eliminar la exposición «${item.title}»?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await service.remove(item.id); setItems(all => all.filter(x => x.id !== item.id)); if (editing === item.id) reset(); setNotice('Exposición eliminada.'); }
    catch (reason) { setError(apiError(reason)); }
    finally { setBusy(false); }
  }
  return <section className="section expo-editor" aria-labelledby="expo-editor-title">
    <Link to="/">← Ver página de inicio</Link>
    <h1 id="expo-editor-title">Gestionar exposiciones</h1>
    <p>Agrega, edita y ordena las exposiciones: las del inicio y las de «Otras exposiciones».</p>
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy || loading} onClick={() => setAttempt(n => n + 1)}>Reintentar carga</button></div>}
    {notice && <p role="status">{notice}</p>}
    <form onSubmit={save}>
      <fieldset disabled={busy}><legend>{editing ? 'Editar exposición' : 'Nueva exposición'}</legend>
        <label>Nombre<input id="exhibition-title" {...fieldProps(fields, 'title', 'exhibition-title')} required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><FieldError fields={fields} name="title" id="exhibition-title" />
        <label>Título principal<input id="exhibition-heading" {...fieldProps(fields, 'heading', 'exhibition-heading')} required maxLength={200} value={form.heading} onChange={e => setForm({ ...form, heading: e.target.value })} /></label><FieldError fields={fields} name="heading" id="exhibition-heading" />
        <label>Descripción<textarea id="exhibition-description" {...fieldProps(fields, 'description', 'exhibition-description')} rows={7} maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><FieldError fields={fields} name="description" id="exhibition-description" />
        <label>Tema<select id="exhibition-theme" {...fieldProps(fields, 'theme', 'exhibition-theme')} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value as ExhibitionInput['theme'] })}><option value="sea">Mar / azul</option><option value="green">Verde</option></select></label><FieldError fields={fields} name="theme" id="exhibition-theme" />
        <label>Orden (menor primero)<input id="exhibition-order" {...fieldProps(fields, 'order', 'exhibition-order')} type="number" min={0} max={10000} step={1} required value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></label><FieldError fields={fields} name="order" id="exhibition-order" />
        <CoverPicker value={form.imageUrl} error={fields.imageUrl} onChange={imageUrl => setForm({ ...form, imageUrl })} /><FieldError fields={fields} name="imageUrl" id="exhibition-imageUrl" />
        {form.imageUrl && <>
          <label>Descripción de la portada (para lectores de pantalla)<input id="exhibition-imageAlt" {...fieldProps(fields, 'imageAlt', 'exhibition-imageAlt')} required maxLength={300} value={form.imageAlt} onChange={e => setForm({ ...form, imageAlt: e.target.value })} /></label><FieldError fields={fields} name="imageAlt" id="exhibition-imageAlt" />
          <label>Pie de la portada (opcional)<input id="exhibition-caption" {...fieldProps(fields, 'caption', 'exhibition-caption')} maxLength={300} value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} /></label><FieldError fields={fields} name="caption" id="exhibition-caption" />
        </>}
        <label className="expo-editor__check"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />Mostrar grande en el inicio (si no, va en «Otras exposiciones»)</label>
        <label>Disciplina<input id="exhibition-discipline" {...fieldProps(fields, 'discipline', 'exhibition-discipline')} maxLength={100} placeholder="Pintura, Escultura…" value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value })} /></label><FieldError fields={fields} name="discipline" id="exhibition-discipline" />
        <label>Sala<input id="exhibition-room" {...fieldProps(fields, 'room', 'exhibition-room')} maxLength={80} placeholder="Sala A" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></label><FieldError fields={fields} name="room" id="exhibition-room" />
        <label>Artista<select id="exhibition-artistId" {...fieldProps(fields, 'artistId', 'exhibition-artistId')} value={form.artistId} onChange={e => setForm({ ...form, artistId: e.target.value })}><option value="">Sin artista</option>{artists.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><FieldError fields={fields} name="artistId" id="exhibition-artistId" />
        <div className="expo-editor__dates">
          <label>Desde<input id="exhibition-startDate" {...fieldProps(fields, 'startDate', 'exhibition-startDate')} type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
          <label>Hasta<input id="exhibition-endDate" {...fieldProps(fields, 'endDate', 'exhibition-endDate')} type="date" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label>
        </div>
        <FieldError fields={fields} name="startDate" id="exhibition-startDate" /><FieldError fields={fields} name="endDate" id="exhibition-endDate" />
        <label>Horario de visita<input id="exhibition-visitHours" {...fieldProps(fields, 'visitHours', 'exhibition-visitHours')} maxLength={200} placeholder="Martes a domingo, 10:00 a 19:00" value={form.visitHours} onChange={e => setForm({ ...form, visitHours: e.target.value })} /></label><FieldError fields={fields} name="visitHours" id="exhibition-visitHours" />
        <label>Recomendaciones para la visita<textarea id="exhibition-visitNotes" {...fieldProps(fields, 'visitNotes', 'exhibition-visitNotes')} rows={4} maxLength={2000} placeholder="Duración sugerida, qué traer, restricciones…" value={form.visitNotes} onChange={e => setForm({ ...form, visitNotes: e.target.value })} /></label><FieldError fields={fields} name="visitNotes" id="exhibition-visitNotes" />
        <div className="expo-editor__actions"><button className="button" type="submit">{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar exposición'}</button>{editing && <button type="button" onClick={reset}>Cancelar edición</button>}</div>
      </fieldset>
    </form>
    <h2>Exposiciones publicadas</h2>
    {loading ? <p role="status">Cargando…</p> : <ul className="expo-editor__list">{items.map(item => <li key={item.id}>
      <span>{item.order} · {item.title} · {item.featured === false ? 'Otras exposiciones' : 'Inicio'}</span><div className="expo-editor__actions">
        <button disabled={busy} onClick={() => { setEditing(item.id); setForm(toForm(item)); setFields({}); setNotice(''); }}>Editar</button>
        <button disabled={busy} onClick={() => void remove(item)}>Eliminar</button>
      </div></li>)}</ul>}
  </section>;
}
