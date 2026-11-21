import { useEffect, useState } from 'react';
import { themeClass } from '../exhibitionThemes';
import { Link, useParams } from 'react-router-dom';
import Faq from '../components/Faq';
import GuidedTourCard, { formatTourDate } from '../components/GuidedTourCard';
import expoService from '../services/expo';
import exhibitionsService from '../services/exhibitions';
import guidedToursService from '../services/guidedTours';
import { useAuthStore } from '../stores/authStore';
import { dateRange } from '../utils/exhibitionDates';
import type { ExpoInformation } from '../types/expo';
import type { Exhibition } from '../types/exhibition';
import type { GuidedTour } from '../types/guidedTour';
import '../styles/visits.css';

type Status = 'loading' | 'ready' | 'error' | 'missing';
const isNotFound = (reason: unknown) => (reason as { response?: { status?: number } }).response?.status === 404;
const upcoming = (tours: GuidedTour[]) => tours.filter(tour => new Date(tour.date).getTime() > Date.now());

// Carga la información general, las exposiciones (o una) y sus visitas guiadas.
// Se vuelve a pedir al cambiar la sesión, para saber qué visitas ya reservó la persona.
function useVisitData(exhibitionId?: string) {
  const userId = useAuthStore(state => state.user?.id);
  const [expo, setExpo] = useState<ExpoInformation | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [tours, setTours] = useState<GuidedTour[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus('loading');
    Promise.all([
      // La información general puede no estar publicada aún: la página se muestra igual.
      expoService.getInformation(signal).catch((reason: unknown) => { if (isNotFound(reason)) return null; throw reason; }),
      exhibitionId ? exhibitionsService.getOne(exhibitionId, signal).then(item => [item]) : exhibitionsService.getAll(signal),
      guidedToursService.getAll(exhibitionId, signal),
    ]).then(([info, items, list]) => {
      if (signal.aborted) return;
      setExpo(info); setExhibitions(items); setTours(list); setStatus('ready');
    }).catch((reason: unknown) => {
      if (signal.aborted) return;
      setStatus(isNotFound(reason) ? 'missing' : 'error');
    });
    return () => controller.abort();
  }, [exhibitionId, attempt, userId]);
  const updateTour = (updated: GuidedTour) => setTours(list => list.map(tour => tour.id === updated.id ? updated : tour));
  return { expo, exhibitions, tours, status, updateTour, retry: () => setAttempt(n => n + 1) };
}

function LoadState({ status, retry, backLink }: { status: Status; retry: () => void; backLink?: boolean }) {
  if (status === 'loading') return <section className="section" role="status"><p>Cargando información de la visita…</p></section>;
  return <section className="section">
    {backLink && <Link to="/visitas">← Planifica tu visita</Link>}
    {status === 'missing' ? <h1>Exposición no encontrada</h1> : <div role="alert">
      <h1>No pudimos cargar la información</h1>
      <p>Comprueba tu conexión e inténtalo de nuevo.</p>
      <button className="button" type="button" onClick={retry}>Reintentar</button>
    </div>}
  </section>;
}

// Lugar, acceso, transporte y accesibilidad: lo mismo para todas las exposiciones.
function GettingThere({ expo }: { expo: ExpoInformation }) {
  return <section className="visit-section" aria-labelledby="getting-there-title">
    <h2 id="getting-there-title">Cómo llegar y accesibilidad</h2>
    <div className="visit-columns">
      <div>
        <h3>{expo.venue}</h3>
        <p className="visit-muted">{expo.address}</p>
        <p>{expo.transport}</p>
      </div>
      <div>
        <h3>Accesibilidad</h3>
        <ul className="visit-list">{expo.accessibility.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  </section>;
}

// /visitas: elegir la exposición que se quiere visitar, más la información general.
export default function Visits() {
  const { expo, exhibitions, tours, status, retry } = useVisitData();
  if (status !== 'ready') return <LoadState status={status} retry={retry} />;
  const next = upcoming(tours);
  return (
    <section className="visits" aria-labelledby="visits-title">
      <header className="visits__header">
        <p className="eyebrow">EXPO / VISITAS</p>
        <h1 id="visits-title">Planifica tu visita</h1>
        <p className="visits__intro">Elige una exposición para ver su sala, horario y las visitas guiadas que puedes reservar.</p>
      </header>

      {expo && <dl className="visit-facts" aria-label="Información general">
        <div><dt>Fechas</dt><dd>{expo.dateLabel}</dd></div>
        <div><dt>Horario general</dt><dd>{expo.hours}</dd></div>
        <div><dt>Lugar</dt><dd>{expo.venue}</dd></div>
        <div><dt>Acceso</dt><dd>{expo.admission}</dd></div>
      </dl>}

      <section className="visit-section" aria-labelledby="choose-title">
        <h2 id="choose-title">Elige una exposición</h2>
        {exhibitions.length === 0 ? <p>Aún no hay exposiciones publicadas.</p> : (
          <ul className="visit-expos">
            {exhibitions.map(item => {
              const own = next.filter(tour => tour.exhibitionId === item.id);
              const meta = [item.room, dateRange(item)].filter(Boolean).join(' · ');
              return <li key={item.id} className={`visit-expo ${themeClass(item.theme)}`}>
                {item.imageUrl
                  ? <img className="visit-expo__cover" src={item.imageUrl} alt={item.imageAlt} loading="lazy" />
                  : <div className="visit-expo__cover visit-expo__cover--empty" aria-hidden="true"><span>{item.title}</span></div>}
                <div className="visit-expo__body">
                  {meta && <p className="visit-expo__meta">{meta}</p>}
                  <h3><Link to={`/visitas/${encodeURIComponent(item.id)}`}>{item.title}</Link></h3>
                  <p className="visit-expo__tours">
                    {own.length === 0 ? 'Sin visitas guiadas programadas'
                      : `${own.length} visita${own.length === 1 ? '' : 's'} guiada${own.length === 1 ? '' : 's'} · próxima el ${formatTourDate(own[0].date)}`}
                  </p>
                  <span className="visit-expo__cta" aria-hidden="true">Planificar visita →</span>
                </div>
              </li>;
            })}
          </ul>
        )}
      </section>

      {expo && <GettingThere expo={expo} />}
      {expo && expo.faqs.length > 0 && <section className="visit-section" aria-label="Preguntas frecuentes"><Faq items={expo.faqs} /></section>}
    </section>
  );
}

// /visitas/:id: la visita de una exposición, con sus visitas guiadas para reservar.
export function ExhibitionVisit() {
  const { id = '' } = useParams();
  const { expo, exhibitions: [item], tours, status, updateTour, retry } = useVisitData(id);
  if (status !== 'ready' || !item) return <LoadState status={status === 'ready' ? 'missing' : status} retry={retry} backLink />;
  const next = upcoming(tours);
  const dates = dateRange(item);
  const exhibitionLink = item.featured === false ? `/otras-exposiciones/${encodeURIComponent(item.id)}` : '/';
  return (
    <section className={`visits visit-detail ${themeClass(item.theme)}`} aria-labelledby="visit-title">
      <Link to="/visitas">← Todas las exposiciones</Link>
      <header className="visit-detail__hero">
        <div>
          <p className="eyebrow">PLANIFICA TU VISITA</p>
          <h1 id="visit-title">{item.title}</h1>
          <p className="visit-detail__heading">{item.heading}</p>
          <Link to={exhibitionLink}>Ver la exposición →</Link>
        </div>
        {item.imageUrl && <img className="visit-detail__cover" src={item.imageUrl} alt={item.imageAlt} />}
      </header>

      <dl className="visit-facts">
        {item.room && <div><dt>Sala</dt><dd>{item.room}</dd></div>}
        <div><dt>Fechas</dt><dd>{dates || expo?.dateLabel || 'Por confirmar'}</dd></div>
        <div><dt>Horario</dt><dd>{item.visitHours || expo?.hours || 'Por confirmar'}</dd></div>
        {expo && <div><dt>Lugar</dt><dd>{expo.venue}<small>{expo.address}</small></dd></div>}
        {expo && <div><dt>Acceso</dt><dd>{expo.admission}</dd></div>}
      </dl>

      {item.visitNotes && <section className="visit-section visit-notes" aria-labelledby="notes-title">
        <h2 id="notes-title">Antes de ir</h2>
        <p>{item.visitNotes}</p>
      </section>}

      <section className="visit-section" aria-labelledby="tours-title">
        <h2 id="tours-title">Visitas guiadas</h2>
        <p className="visit-muted">Recorre la exposición con una guía. Los cupos son limitados y la reserva queda en Mi visita.</p>
        {next.length === 0
          ? <p className="visit-empty">No hay visitas guiadas programadas para esta exposición. Puedes recorrerla por tu cuenta en el horario indicado.</p>
          : <div className="tour-grid">{next.map(tour => <GuidedTourCard key={tour.id} tour={tour} onChange={updateTour} />)}</div>}
      </section>

      {expo && <GettingThere expo={expo} />}
    </section>
  );
}
