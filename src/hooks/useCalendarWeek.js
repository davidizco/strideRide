import { useEffect, useState } from "react";
import { getCalendar } from "../api/intervals.js";
import { addDays } from "../utils/calendar.js";

export function useCalendarWeek(mondayIso) {
  const [state, setState] = useState({ key: mondayIso, status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    getCalendar({ oldest: mondayIso, newest: addDays(mondayIso, 6) }, signal)
      .then(({ planned, completed }) =>
        setState({ key: mondayIso, status: "ready", planned, completed }),
      )
      .catch((error) => {
        if (signal.aborted) return;
        setState({
          key: mondayIso,
          status: error.status === 503 ? "not-configured" : "error",
          message: error.message,
        });
      });

    return () => controller.abort();
  }, [mondayIso]);

  return state.key === mondayIso ? state : { status: "loading" };
}
