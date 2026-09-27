import {
  formatDistance,
  formatDuration,
  formatHeartRate,
} from "../utils/format.js";
import { SPORT_GROUPS, getSportGroup, getSportLabel } from "../utils/sports.js";

function completedMetrics(activity) {
  const metrics = [];
  if (activity.distance > 0) metrics.push(formatDistance(activity.distance));
  if (activity.moving_time) metrics.push(formatDuration(activity.moving_time));
  if (activity.icu_training_load) {
    metrics.push(`Carga ${activity.icu_training_load}`);
  }
  if (activity.average_heartrate) {
    metrics.push(formatHeartRate(activity.average_heartrate));
  }
  return metrics;
}

export default function CompletedActivity({ activity }) {
  const color = SPORT_GROUPS[getSportGroup(activity.type)].color;

  return (
    <li className="calendar-item completed" style={{ "--accent": color }}>
      <div className="calendar-item-top">
        <span className="badge">{getSportLabel(activity.type)}</span>
        <span className="status status-done">Completado</span>
      </div>
      <p className="calendar-item-name">{activity.name}</p>
      <ul className="activity-metrics">
        {completedMetrics(activity).map((metric) => (
          <li key={metric}>{metric}</li>
        ))}
      </ul>
      {activity.device_name && (
        <p className="device-name">{activity.device_name}</p>
      )}
    </li>
  );
}
