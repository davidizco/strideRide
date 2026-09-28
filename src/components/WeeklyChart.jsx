import { Suspense, lazy, useMemo } from "react";
import { SPORT_GROUPS } from "../utils/sports.js";
import { weeklyHoursBySport } from "../utils/weekly.js";

// Recharts pesa más que el resto de la app: se descarga aparte y no retrasa el dashboard.
const WeeklyHoursChart = lazy(() => import("./WeeklyHoursChart.jsx"));

export default function WeeklyChart({ activities, weeks }) {
  const data = useMemo(
    () => weeklyHoursBySport(activities, weeks),
    [activities, weeks],
  );
  const groups = Object.keys(SPORT_GROUPS).filter((group) =>
    data.some((week) => week[group] > 0),
  );

  return (
    <section className="section card">
      <h2>Horas por semana</h2>
      <p className="muted">Últimas {weeks} semanas</p>
      <div className="chart">
        <Suspense fallback={null}>
          <WeeklyHoursChart data={data} groups={groups} />
        </Suspense>
      </div>
    </section>
  );
}
