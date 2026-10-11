import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Faq from "../components/Faq";
import expoService from "../services/expo";
import type { ExpoInformation } from "../types/expo";

export default function Information() {
  const [expo, setExpo] = useState<ExpoInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visitRef = useRef<HTMLElement>(null);
  const location = useLocation();

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

  // "Planifica tu visita" lleva a /#visit desde cualquier página. La sección
  // aparece recién cuando llegan los datos, así que el salto se hace después.
  useEffect(() => {
    if (expo && location.hash === "#visit") {
      visitRef.current?.scrollIntoView();
    }
  }, [expo, location.hash]);

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
    <>
      <section className="hero" aria-labelledby="expo-title">
        <div className="hero-text">
          <p className="texti">Exposición: Los Grandes Mares</p>
          <h1 id="expo-title">
            Un viaje in<em>agua</em>lable
          </h1>
          <p>
            A fish swam past the pond with a bit of bread. <br></br>
            Another fish bonked his head. <br></br>
            When they saw the fisherman, they looked shocked and swam away. <br></br>
            This was another normal day.<br></br>
            <br></br>
            Hastily I threw a bait. <br></br>
            The fishes then gobbled and ate. <br></br>
            I reeled it up, eating was my wish. <br></br>
            <em>The fish was delish and it made quite a dish. </em> <br></br>

          </p>
          <a className="button" href="#visit">
            <span>Visitas</span>
          </a>          
        </div>

        <figure className="hero-figure">
          <img
            className="hero-image"
            src="/images/FISH.png"
            alt="Dibujo de peces nadando, con la palabra fish escrita varias veces"
          />
          <figcaption>Fish</figcaption>
        </figure>
      </section>

      <section className="section" id="visit" ref={visitRef} aria-labelledby="visit-title">
        <div className="section-heading">
          <p className="eyebrow">PLANIFICA TU VISITA</p>
          <h2 id="visit-title">{expo.name} · {expo.edition}</h2>
          <p>{expo.introduction}</p>
        </div>

        <dl className="info-grid">
          <div>
            <dt>Fechas</dt>
            <dd>{expo.dateLabel}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>{expo.hours}</dd>
          </div>
          <div>
            <dt>Lugar</dt>
            <dd>
              {expo.venue}
              <small>{expo.address}</small>
            </dd>
          </div>
          <div>
            <dt>Entrada</dt>
            <dd>{expo.admission}</dd>
          </div>
        </dl>

        <div className="visit-details">
          <div>
            <h3>Cómo llegar</h3>
            <p>{expo.transport}</p>
          </div>
          <div>
            <h3>Accesibilidad</h3>
            <ul>
              {expo.accessibility.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {expo.faqs.length > 0 && (
        <section className="section faq-section" aria-labelledby="faq-title">
          <div>
            <h2 id="faq-title">Preguntas frecuentes</h2>
            <p>Lo que más nos preguntan antes de venir.</p>
          </div>
          <Faq items={expo.faqs} />
        </section>
      )}
    </>
  );
}
