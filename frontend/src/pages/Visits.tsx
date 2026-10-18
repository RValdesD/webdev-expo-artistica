import { useEffect, useState } from "react";
import Faq from "../components/Faq";
import expoService from "../services/expo";
import type { ExpoInformation } from "../types/expo";

export default function Visits() {
  const [expo, setExpo] = useState<ExpoInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    expoService
      .getInformation(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setExpo(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  if (loading)
    return (
      <section className="status" role="status">
        <p>Cargando información de la exposición…</p>
      </section>
    );
  if (error || !expo)
    return (
      <section className="status" role="alert">
        <h1>No pudimos cargar la información</h1>
        <p>Comprueba que el servidor y MongoDB estén en funcionamiento.</p>
        <button
          className="button"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Reintentar
        </button>
      </section>
    );

  return (
      <section id="visit" className="section visit-page" aria-labelledby="visit-title">
        <header className="visit-page__heading">
          <p className="eyebrow">EXPO / VISITA</p>
          <h1 id="visit-title">Planifica tu visita</h1>
          <p className="intro">{expo.introduction}</p>
        </header>

        <dl className="info-grid">
          <div><dt>Fecha</dt><dd>{expo.dateLabel}</dd></div>
          <div><dt>Horario</dt><dd>{expo.hours}</dd></div>
          <div><dt>Lugar</dt><dd>{expo.venue}<small>{expo.address}</small></dd></div>
          <div><dt>Acceso</dt><dd>{expo.admission}</dd></div>
        </dl>

        <div className="visit-details">
          <section className="visit-block" aria-labelledby="visit-transport">
            <h2 id="visit-transport">Cómo llegar</h2>
            <p>{expo.transport}</p>
          </section>
          <section className="visit-block" aria-labelledby="visit-accessibility">
            <h2 id="visit-accessibility">Accesibilidad</h2>
            <ul>{expo.accessibility.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>

        <section className="faq-section" aria-labelledby="visit-faq">
          <div>
            <h2 id="visit-faq">Preguntas frecuentes</h2>
            <p>Lo que más nos preguntan antes de venir. Toca una pregunta para ver la respuesta.</p>
          </div>
          <Faq items={expo.faqs} />
        </section>
      </section>
  );
}
