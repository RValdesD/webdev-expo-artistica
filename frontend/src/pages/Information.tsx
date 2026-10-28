import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import exhibitionsService from '../services/exhibitions';
import type { Exhibition } from '../types/exhibition';
import '../styles/exhibitions.css';

export default function Information() {
  const { user } = useAuth();
  const [items, setItems] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    exhibitionsService.getAll(controller.signal)
      .then(data => { if (!controller.signal.aborted) setItems(data); })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  return (
    <>
      <div className="expo-toolbar">
        {user?.role === 'organizador' && <Link to="/gestion/exposiciones">Administrar exposiciones</Link>}
        <Link className="button expo-other-button" to="/otras-exposiciones">Otras exposiciones <span aria-hidden="true">→</span></Link>
      </div>
      {loading ? <p className="section" role="status">Cargando exposiciones…</p> : error ? (
        <div className="section" role="alert"><p>No pudimos cargar las exposiciones.</p><button className="button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></div>
      ) : items.length === 0 ? <section className="section"><h1>Exposiciones</h1><p>Aún no hay exposiciones publicadas.</p></section> : items.map((item, index) => {
        const Heading = index === 0 ? 'h1' : 'h2';
        return <Fragment key={item.id}>
          {index > 0 && <div className="expo-divider" aria-hidden="true" />}
          <section className={`hero expo-item expo-item--${item.theme}`} aria-labelledby={`expo-${item.id}`}>
            <div className="hero-copy">
              <p className="texti">Exposición: {item.title}</p>
              <Heading id={`expo-${item.id}`} className="expo-item__title">{item.heading === 'Un viaje inagualable' ? <>Un viaje in<em>agua</em>lable</> : item.heading}</Heading>
              <p className="expo-item__description">{item.description}</p>
              <Link className="button" to="/visitas">Visitas</Link>
            </div>
            {item.imageUrl ? <figure className="hero-figure">
              <img className="hero-image" src={item.imageUrl} alt={item.imageAlt} />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure> : <div className="expo-item__type-panel" aria-hidden="true"><span>{item.title}</span></div>}
          </section>
        </Fragment>;
      })}
    </>
  );
}
