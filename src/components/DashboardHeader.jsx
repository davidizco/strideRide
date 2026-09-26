export default function DashboardHeader({ athlete }) {
  const location = [athlete.city, athlete.country].filter(Boolean).join(', ')

  return (
    <header className="dashboard-header">
      {athlete.profile_medium && (
        <img className="avatar" src={athlete.profile_medium} alt="" width="56" height="56" />
      )}
      <div>
        <h1>Hola, {athlete.firstname}</h1>
        {location && <p className="muted">{location}</p>}
      </div>
    </header>
  )
}
