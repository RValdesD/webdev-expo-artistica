import { useEffect, useState } from "react";
import Faq from "../components/Faq";
import expoService from "../services/expo";
import type { ExpoInformation } from "../types/expo";

export default function Information() {
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
    <>
      <section className="hero" aria-labelledby="expo-title">
        <div className="hero-text">
          <p className="texti">Exposicion: Los Grandes Mares</p>
          <h1 id="expo-title">
            Un viaje in<em>agua</em>lable
          </h1>
          <p className="intro"></p>
          <p></p>
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
            alt="Describe the painting here"
          />
          <figcaption>Fish</figcaption>
        </figure>
      </section>
    </>
  );
}
