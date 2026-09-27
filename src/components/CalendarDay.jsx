import { formatDayLabel } from "../utils/calendar.js";
import CompletedActivity from "./CompletedActivity.jsx";
import PlannedWorkout from "./PlannedWorkout.jsx";

export default function CalendarDay({
  date,
  isToday,
  isPast,
  planned,
  completed,
}) {
  const pairedIds = new Set(
    completed.map((activity) => activity.paired_event_id),
  );
  const isEmpty = planned.length === 0 && completed.length === 0;

  return (
    <section
      className={isToday ? "calendar-day today" : "calendar-day"}
      aria-label={formatDayLabel(date)}
    >
      <h3 className="calendar-day-title">
        {formatDayLabel(date)}
        {isToday && <span className="today-badge">Hoy</span>}
      </h3>
      {isEmpty ? (
        <p className="muted">Descanso</p>
      ) : (
        <ul className="calendar-items">
          {planned.map((event) => {
            const done = pairedIds.has(event.id);
            return (
              <PlannedWorkout
                key={`p-${event.id}`}
                event={event}
                done={done}
                missed={isPast && !done && event.category === "WORKOUT"}
              />
            );
          })}
          {completed.map((activity) => (
            <CompletedActivity key={`c-${activity.id}`} activity={activity} />
          ))}
        </ul>
      )}
    </section>
  );
}
