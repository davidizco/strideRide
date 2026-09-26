import {
  formatActivityDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatPace,
  formatSpeed,
} from '../utils/format.js'
import { SPORT_GROUPS, getSportGroup, getSportLabel } from '../utils/sports.js'

function mainMetrics(activity, group) {
  const metrics = []
  if (activity.distance > 0) metrics.push(formatDistance(activity.distance))
  metrics.push(formatDuration(activity.moving_time))
  if (group === 'run' && activity.distance > 0) metrics.push(formatPace(activity.average_speed))
  if (group === 'ride') metrics.push(formatSpeed(activity.average_speed))
  if (activity.total_elevation_gain >= 10) metrics.push(`+${formatElevation(activity.total_elevation_gain)}`)
  if (activity.has_heartrate) metrics.push(formatHeartRate(activity.average_heartrate))
  return metrics
}

export default function ActivityItem({ activity }) {
  const group = getSportGroup(activity.sport_type)

  return (
    <li className="activity" style={{ '--accent': SPORT_GROUPS[group].color }}>
      <div className="activity-top">
        <span className="badge">{getSportLabel(activity.sport_type)}</span>
        <time className="muted" dateTime={activity.start_date_local}>
          {formatActivityDate(activity.start_date_local)}
        </time>
      </div>
      <a
        className="activity-name"
        href={`https://www.strava.com/activities/${activity.id}`}
        target="_blank"
        rel="noreferrer"
      >
        {activity.name}
      </a>
      <ul className="activity-metrics">
        {mainMetrics(activity, group).map((metric) => (
          <li key={metric}>{metric}</li>
        ))}
      </ul>
    </li>
  )
}
