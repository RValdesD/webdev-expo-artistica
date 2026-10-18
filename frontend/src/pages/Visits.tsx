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
      <section id="visit" className="section" aria-labelledby="visit-title">
        <h1 id="visit-title">Planifica tu visita</h1>
        <dl className="info-grid">
          <div><dt>Fecha</dt><dd>{expo.dateLabel}</dd></div>
          <div><dt>Horario</dt><dd>{expo.hours}</dd></div>
          <div><dt>Lugar</dt><dd>{expo.venue}<small>{expo.address}</small></dd></div>
          <div><dt>Acceso</dt><dd>{expo.admission}</dd></div>
        </dl>
        <p>{expo.transport}</p>
        <ul>{expo.accessibility.map(item => <li key={item}>{item}</li>)}</ul>
        <Faq items={expo.faqs} />
      </section>
  );
}
