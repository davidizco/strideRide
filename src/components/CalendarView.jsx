import { useState } from "react";
import { useCalendarWeek } from "../hooks/useCalendarWeek.js";
import {
  addDays,
  formatWeekRange,
  groupByDate,
  mondayOf,
  todayIso,
  weekDays,
} from "../utils/calendar.js";
import CalendarDay from "./CalendarDay.jsx";

function NotConfigured() {
  return (
    <section className="card">
      <h2>Conecta Intervals.icu</h2>
      <p className="muted">
        Añade <code>INTERVALS_API_KEY</code> en el archivo <code>.env</code> del
        servidor y reinícialo. La clave está en Intervals.icu, en Settings →
        Developer Settings.
      </p>
    </section>
  );
}

export default function CalendarView() {
  const today = todayIso();
  const [monday, setMonday] = useState(() => mondayOf(today));
  const week = useCalendarWeek(monday);

  const plannedByDay = groupByDate(week.planned ?? []);
  const completedByDay = groupByDate(week.completed ?? []);
  const fromGarmin = (week.completed ?? []).some(
    (activity) => activity.source === "GARMIN_CONNECT",
  );

  return (
    <section className="section">
      <div className="calendar-toolbar">
        <button
          type="button"
          className="icon-button"
          onClick={() => setMonday(addDays(monday, -7))}
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <div className="calendar-range">
          <h1>{formatWeekRange(monday)}</h1>
          {monday !== mondayOf(today) && (
            <button
              type="button"
              className="link-button"
              onClick={() => setMonday(mondayOf(today))}
            >
              Ir a hoy
            </button>
          )}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setMonday(addDays(monday, 7))}
          aria-label="Semana siguiente"
        >
          ›
        </button>
      </div>

      {week.status === "loading" && (
        <p className="muted center">Cargando calendario…</p>
      )}
      {week.status === "not-configured" && <NotConfigured />}
      {week.status === "error" && <p className="error card">{week.message}</p>}
      {week.status === "ready" && (
        <>
          <div className="calendar-days">
            {weekDays(monday).map((date) => (
              <CalendarDay
                key={date}
                date={date}
                isToday={date === today}
                isPast={date < today}
                planned={plannedByDay.get(date) ?? []}
                completed={completedByDay.get(date) ?? []}
              />
            ))}
          </div>
          {fromGarmin && (
            <p className="attribution">Actividades de Garmin Connect</p>
          )}
        </>
      )}
    </section>
  );
}
