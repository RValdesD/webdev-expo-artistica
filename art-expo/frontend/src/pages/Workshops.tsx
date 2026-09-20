import { useEffect, useState } from "react";
import WorkshopCard from "../components/WorkshopCard";
import workshopsService from "../services/workshops";
import type { Workshop } from "../types/workshop";
import "../styles/workshops.css";

export default function Workshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    workshopsService
      .getAll(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setWorkshops(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  function updateWorkshop(updated: Workshop) {
    setWorkshops((current) =>
      current.map((workshop) =>
        workshop.id === updated.id ? updated : workshop,
      ),
    );
  }

  return (
    <section className="workshops-page" aria-labelledby="workshops-title">
      <header className="workshops-heading">
        <p className="eyebrow">EXPO / TALLERES</p>
        <h1 id="workshops-title">Talleres practicos para compartir</h1>
        <p>Conoce la programación e inscríbete en un taller.</p>
      </header>
      <button
        className="button"
        type="button"
        disabled={loading}
        onClick={() => setAttempt((value) => value + 1)}
      >
        Actualizar cupos
      </button>

      {loading ? (
        <p role="status">Cargando talleres…</p>
      ) : error ? (
        <p role="alert">
          No pudimos cargar los talleres. Usa Actualizar cupos para reintentar.
        </p>
      ) : workshops.length === 0 ? (
        <p>Aún no hay talleres publicados.</p>
      ) : (
        <div className="workshops-grid">
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop.id}
              workshop={workshop}
              onRegistered={updateWorkshop}
            />
          ))}
        </div>
      )}
    </section>
  );
}
