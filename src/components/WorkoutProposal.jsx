import { useEffect, useEffectEvent, useRef, useState } from "react";
import { actOnWorkoutProposal, getWorkoutProposal } from "../api/assistant.js";
import { formatDayLabel } from "../utils/calendar.js";
import { getSportGroup, getSportLabel, SPORT_GROUPS } from "../utils/sports.js";

const STATUS_LABELS = {
  pending: "Pendiente de confirmación",
  publishing: "Publicando en Intervals.icu",
  published: "Guardado en Intervals.icu",
  discarded: "Propuesta descartada",
  expired: "Propuesta caducada",
  uncertain: "Publicación sin confirmar",
};

export default function WorkoutProposal({ initialProposal, onUpdate }) {
  const [proposal, setProposal] = useState(initialProposal);
  const [busy, setBusy] = useState("checking");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);

  function accept(result) {
    setProposal(result);
    onUpdate(result);
    setVerified(true);
  }

  function refresh(signal) {
    return getWorkoutProposal(proposal.id, signal)
      .then((result) => {
        if (!signal?.aborted) accept(result);
      })
      .catch((err) => {
        if (signal?.aborted) return;
        if (err.status === 410) {
          if (proposal.status === "publishing") {
            accept({
              ...proposal,
              status: "uncertain",
              error:
                "La propuesta ya no está disponible en el servidor. Revisa Intervals.icu antes de pedir otra para evitar duplicados.",
            });
            return;
          }
          accept({
            ...proposal,
            status: proposal.status === "pending" ? "expired" : proposal.status,
          });
        } else {
          setVerified(false);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!signal?.aborted) setBusy(null);
      });
  }

  const refreshFromEffect = useEffectEvent(refresh);
  const expireFromEffect = useEffectEvent(() =>
    accept({ ...proposal, status: "expired" }),
  );

  useEffect(() => {
    const controller = new AbortController();
    refreshFromEffect(controller.signal);
    return () => controller.abort();
  }, [proposal.id]);

  useEffect(() => {
    if (proposal.status !== "pending") return;
    const timer = setTimeout(
      () => expireFromEffect(),
      Math.max(0, proposal.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [proposal.id, proposal.status, proposal.expiresAt]);

  async function act(action) {
    if (inFlight.current || busy || !verified) return;
    inFlight.current = true;
    setBusy(action);
    setError(null);
    try {
      accept(await actOnWorkoutProposal(proposal.id, action));
    } catch (err) {
      setVerified(false);
      setError(
        `${err.message} Comprueba el estado antes de volver a confirmar.`,
      );
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  const { workout, status } = proposal;
  const sport = SPORT_GROUPS[getSportGroup(workout.type)];
  let statusLabel = STATUS_LABELS[status];
  if (busy === "checking") statusLabel = "Comprobando estado…";
  else if (busy === "confirm") statusLabel = "Publicando en Intervals.icu…";

  return (
    <li className="workout-proposal" style={{ "--accent": sport.color }}>
      <article
        aria-labelledby={`proposal-${proposal.id}`}
        aria-busy={Boolean(busy)}
      >
        <header className="proposal-header">
          <p className="muted">
            {getSportLabel(workout.type)} ·{" "}
            <time dateTime={workout.date}>{formatDayLabel(workout.date)}</time>
          </p>
          <h2 id={`proposal-${proposal.id}`}>{workout.name}</h2>
          <output
            className={`proposal-status ${status === "published" ? "proposal-published" : "muted"}`}
          >
            {statusLabel}
          </output>
        </header>
        <pre className="proposal-steps">{workout.description}</pre>
        {status === "pending" ? (
          <>
            <p className="muted">
              Al confirmar se añadirá al calendario de Intervals.icu. Garmin lo
              recibirá si la sincronización de entrenos está activa y el
              dispositivo es compatible.
            </p>
            {workout.type === "Swim" ||
            workout.type === "OpenWaterSwim" ||
            workout.type === "WeightTraining" ? (
              <p className="muted">
                Los descansos de natación y los ejercicios de fuerza pueden no
                conservarse como pasos específicos en Garmin.
              </p>
            ) : null}
            <div className="proposal-actions">
              <button
                type="button"
                className="button"
                disabled={Boolean(busy) || !verified}
                onClick={() => act("confirm")}
              >
                Confirmar y publicar
              </button>
              <button
                type="button"
                className="link-button"
                disabled={Boolean(busy) || !verified}
                onClick={() => act("discard")}
              >
                Descartar
              </button>
            </div>
          </>
        ) : null}
        {status === "published" ? (
          <a href="#/calendario">Ver calendario</a>
        ) : null}
        {status === "expired" ? (
          <p className="muted">
            Ya no se puede confirmar. Si intentaste publicarla, revisa
            Intervals.icu antes de pedir otra propuesta.
          </p>
        ) : null}
        {status === "uncertain" ? (
          <p className="error" role="alert">
            {proposal.error}
          </p>
        ) : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {!verified || status === "publishing" ? (
          <button
            type="button"
            className="link-button"
            disabled={Boolean(busy)}
            onClick={() => {
              setBusy("checking");
              setError(null);
              refresh();
            }}
          >
            Comprobar estado
          </button>
        ) : null}
        {status === "uncertain" ? (
          <a href="https://intervals.icu" target="_blank" rel="noreferrer">
            Revisar Intervals.icu
          </a>
        ) : null}
      </article>
    </li>
  );
}
