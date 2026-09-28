import { getCategoryLabel } from "../utils/calendar.js";
import { formatDistance, formatDuration } from "../utils/format.js";
import { SPORT_GROUPS, getSportGroup, getSportLabel } from "../utils/sports.js";

function plannedMetrics(event) {
  const metrics = [];
  if (event.moving_time) metrics.push(formatDuration(event.moving_time));
  if (event.distance) metrics.push(formatDistance(event.distance));
  if (event.icu_training_load) metrics.push(`Carga ${event.icu_training_load}`);
  return metrics;
}

export default function PlannedWorkout({ event, done, missed }) {
  const categoryLabel = getCategoryLabel(event.category);
  const label =
    categoryLabel ?? (event.type ? getSportLabel(event.type) : "Entreno");
  const color = categoryLabel
    ? "var(--muted)"
    : SPORT_GROUPS[getSportGroup(event.type)].color;
  const metrics = plannedMetrics(event);

  return (
    <li className="calendar-item planned" style={{ "--accent": color }}>
      <div className="calendar-item-top">
        <span className="badge">{label}</span>
        {done && <span className="status status-done">Hecho</span>}
        {missed && <span className="status status-missed">No realizado</span>}
      </div>
      {event.name && <p className="calendar-item-name">{event.name}</p>}
      {metrics.length > 0 && (
        <ul className="activity-metrics">
          {metrics.map((metric) => (
            <li key={metric}>{metric}</li>
          ))}
        </ul>
      )}
      {event.description && (
        <details className="workout-steps">
          <summary>Ver entreno</summary>
          <p>{event.description}</p>
        </details>
      )}
    </li>
  );
}
