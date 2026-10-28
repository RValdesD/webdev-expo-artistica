import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import service from '../services/exhibitions';
import { apiError } from '../services/auth';
import type { Exhibition, ExhibitionInput } from '../types/exhibition';
import '../styles/exhibitions.css';
const blank: ExhibitionInput = { title: '', heading: '', description: '', theme: 'sea', imageUrl: '', imageAlt: '', caption: '', order: 2 };
export default function ExhibitionManagement() {
  const [items, setItems] = useState<Exhibition[]>([]);
  const [form, setForm] = useState<ExhibitionInput>({ ...blank });
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    service.getAll(controller.signal).then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(apiError(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  function reset() { setEditing(null); setForm({ ...blank }); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (editing) await service.update(editing, form); else await service.create(form);
      reset(); setNotice('Exposición guardada en la página de inicio.'); setAttempt(n => n + 1);
    } catch (reason) { setError(apiError(reason)); }
    finally { setBusy(false); }
  }
  async function remove(item: Exhibition) {
    if (busy || !window.confirm(`¿Eliminar «${item.title}» del inicio?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await service.remove(item.id); setItems(all => all.filter(x => x.id !== item.id)); if (editing === item.id) reset(); setNotice('Exposición eliminada.'); }
    catch (reason) { setError(apiError(reason)); }
    finally { setBusy(false); }
  }
  return <section className="section expo-editor" aria-labelledby="expo-editor-title">
    <Link to="/">← Ver página de inicio</Link>
    <h1 id="expo-editor-title">Gestionar exposiciones</h1>
    <p>Agrega, edita y ordena las exposiciones del inicio.</p>
    {error && <div role="alert"><p>{error}</p><button type="button" disabled={busy || loading} onClick={() => setAttempt(n => n + 1)}>Reintentar carga</button></div>}
    {notice && <p role="status">{notice}</p>}
    <form onSubmit={save}>
      <fieldset disabled={busy}><legend>{editing ? 'Editar exposición' : 'Nueva exposición'}</legend>
        <label>Nombre<input required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>Título principal<input required maxLength={200} value={form.heading} onChange={e => setForm({ ...form, heading: e.target.value })} /></label>
        <label>Descripción<textarea rows={7} maxLength={5000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
        <label>Tema<select value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value as ExhibitionInput['theme'] })}><option value="sea">Mar / azul</option><option value="green">Verde</option></select></label>
        <label>Orden (menor primero)<input type="number" min={0} max={10000} step={1} required value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} /></label>
        <label>URL de imagen (opcional)<input maxLength={1000} placeholder="/images/imagen.jpg" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></label>
        <label>Descripción de imagen<input maxLength={300} value={form.imageAlt} onChange={e => setForm({ ...form, imageAlt: e.target.value })} /></label>
        <label>Pie de imagen<input maxLength={300} value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} /></label>
        <div className="expo-editor__actions"><button className="button" type="submit">{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar al inicio'}</button>{editing && <button type="button" onClick={reset}>Cancelar edición</button>}</div>
      </fieldset>
    </form>
    <h2>Exposiciones publicadas</h2>
    {loading ? <p role="status">Cargando…</p> : <ul className="expo-editor__list">{items.map(item => <li key={item.id}>
      <span>{item.order} · {item.title}</span><div className="expo-editor__actions">
        <button disabled={busy} onClick={() => { setEditing(item.id); setForm({ ...item }); setNotice(''); }}>Editar</button>
        <button disabled={busy} onClick={() => void remove(item)}>Eliminar</button>
      </div></li>)}</ul>}
  </section>;
}
