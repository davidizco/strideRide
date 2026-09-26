import { useEffect, useLayoutEffect, useRef } from "react";
import ActivityDetail from "./components/ActivityDetail.jsx";
import ActivityList from "./components/ActivityList.jsx";
import ConnectStrava from "./components/ConnectStrava.jsx";
import DashboardHeader from "./components/DashboardHeader.jsx";
import StatsSummary from "./components/StatsSummary.jsx";
import WeeklyChart from "./components/WeeklyChart.jsx";
import { DASHBOARD_WEEKS, useDashboardData } from "./hooks/useDashboardData.js";
import { useHashRoute } from "./hooks/useHashRoute.js";

const connectFailed =
  new URLSearchParams(window.location.search).get("strava") === "error";
if (window.location.search)
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.hash,
  );
window.history.scrollRestoration = "manual";

const isDashboardHash = () => !window.location.hash.startsWith("#/actividad/");

export default function App() {
  const data = useDashboardData();
  const route = useHashRoute();
  const dashboardScroll = useRef(0);
  const visitedDashboard = useRef(false);

  useEffect(() => {
    // Se comprueba el hash en el momento del evento para ignorar el scroll provocado al cambiar de vista.
    const onScroll = () => {
      if (isDashboardHash()) dashboardScroll.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (route.name === "dashboard") visitedDashboard.current = true;
    window.scrollTo(
      0,
      route.name === "dashboard" ? dashboardScroll.current : 0,
    );
  }, [route.name, route.id]);

  const goBack = () => {
    if (visitedDashboard.current) window.history.back();
    else window.location.hash = "";
  };

  if (route.name === "activity") {
    return (
      <main className="app">
        <ActivityDetail id={route.id} onBack={goBack} />
      </main>
    );
  }

  return (
    <main className="app">
      {data.status === "loading" && (
        <p className="muted center">Cargando tus datos de Strava…</p>
      )}
      {data.status === "disconnected" && (
        <ConnectStrava failed={connectFailed} />
      )}
      {data.status === "error" && (
        <section className="card">
          <p className="error">{data.message}</p>
          <button
            type="button"
            className="button"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </section>
      )}
      {data.status === "ready" && (
        <>
          <DashboardHeader athlete={data.athlete} />
          <StatsSummary stats={data.stats} />
          <WeeklyChart activities={data.activities} weeks={DASHBOARD_WEEKS} />
          <ActivityList activities={data.activities} />
        </>
      )}
    </main>
  );
}
