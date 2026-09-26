import ActivityItem from './ActivityItem.jsx'

export default function ActivityList({ activities, limit = 10 }) {
  return (
    <section className="section">
      <h2>Actividades recientes</h2>
      {activities.length === 0 ? (
        <p className="muted">No hay actividades recientes.</p>
      ) : (
        <ul className="activity-list">
          {activities.slice(0, limit).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      )}
    </section>
  )
}
