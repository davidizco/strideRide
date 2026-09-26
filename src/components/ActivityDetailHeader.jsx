import {
  formatCalories,
  formatDistance,
  formatDuration,
  formatElevation,
  formatFullDate,
  formatHeartRate,
  formatPace,
  formatSpeed,
  formatSwimPace,
} from "../utils/format.js";
import { SPORT_GROUPS, getSportGroup, getSportLabel } from "../utils/sports.js";

function headerMetrics(activity, group) {
  const metrics = [];
  const add = (label, value) => metrics.push({ label, value });

  if (activity.distance > 0)
    add("Distancia", formatDistance(activity.distance));
  add("Tiempo", formatDuration(activity.moving_time));
  if (activity.distance > 0) {
    if (
      group === "run" ||
      activity.sport_type === "Walk" ||
      activity.sport_type === "Hike"
    ) {
      add("Ritmo", formatPace(activity.average_speed));
    } else if (group === "ride") {
      add("Velocidad", formatSpeed(activity.average_speed));
      add("Vel. máx.", formatSpeed(activity.max_speed));
    } else if (group === "swim") {
      add("Ritmo", formatSwimPace(activity.average_speed));
    }
  }
  if (activity.total_elevation_gain > 0)
    add("Desnivel", formatElevation(activity.total_elevation_gain));
  if (activity.has_heartrate) {
    add("FC media", formatHeartRate(activity.average_heartrate));
    add("FC máx.", formatHeartRate(activity.max_heartrate));
  }
  if (activity.calories > 0) add("Calorías", formatCalories(activity.calories));
  return metrics;
}

export default function ActivityDetailHeader({ activity }) {
  const group = getSportGroup(activity.sport_type);

  return (
    <header
      className="card detail-header"
      style={{ "--accent": SPORT_GROUPS[group].color }}
    >
      <span className="badge">{getSportLabel(activity.sport_type)}</span>
      <h1>{activity.name}</h1>
      <p className="muted">{formatFullDate(activity.start_date_local)}</p>
      <dl className="detail-metrics">
        {headerMetrics(activity, group).map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {activity.description && (
        <p className="detail-description">{activity.description}</p>
      )}
      <a
        className="strava-link"
        href={`https://www.strava.com/activities/${activity.id}`}
        target="_blank"
        rel="noreferrer"
      >
        Ver en Strava
      </a>
    </header>
  );
}
