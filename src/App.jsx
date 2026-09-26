import ActivityList from './components/ActivityList.jsx'
import ConnectStrava from './components/ConnectStrava.jsx'
import DashboardHeader from './components/DashboardHeader.jsx'
import StatsSummary from './components/StatsSummary.jsx'
import WeeklyChart from './components/WeeklyChart.jsx'
import { DASHBOARD_WEEKS, useDashboardData } from './hooks/useDashboardData.js'

const connectFailed = new URLSearchParams(window.location.search).get('strava') === 'error'
if (window.location.search) window.history.replaceState(null, '', window.location.pathname)

export default function App() {
  const data = useDashboardData()

  return (
    <main className="app">
      {data.status === 'loading' && <p className="muted center">Cargando tus datos de Strava…</p>}
      {data.status === 'disconnected' && <ConnectStrava failed={connectFailed} />}
      {data.status === 'error' && (
        <section className="card">
          <p className="error">{data.message}</p>
          <button type="button" className="button" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </section>
      )}
      {data.status === 'ready' && (
        <>
          <DashboardHeader athlete={data.athlete} />
          <StatsSummary stats={data.stats} />
          <WeeklyChart activities={data.activities} weeks={DASHBOARD_WEEKS} />
          <ActivityList activities={data.activities} />
        </>
      )}
    </main>
  )
}
