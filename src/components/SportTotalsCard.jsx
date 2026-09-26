import {
  formatDistance,
  formatDuration,
  formatElevation,
} from "../utils/format.js";

export default function SportTotalsCard({ label, color, totals }) {
  return (
    <article className="card totals-card" style={{ "--accent": color }}>
      <header>
        <h3>{label}</h3>
        <span className="muted">
          {totals.count} {totals.count === 1 ? "actividad" : "actividades"}
        </span>
      </header>
      <dl className="metrics">
        <div>
          <dt>Distancia</dt>
          <dd>{formatDistance(totals.distance)}</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>{formatDuration(totals.moving_time)}</dd>
        </div>
        <div>
          <dt>Desnivel</dt>
          <dd>{formatElevation(totals.elevation_gain)}</dd>
        </div>
      </dl>
    </article>
  );
}
