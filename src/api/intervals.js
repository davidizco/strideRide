import { getJson } from "./http.js";

/** `oldest` y `newest` son fechas locales `YYYY-MM-DD` (inclusivas). */
export function getCalendar({ oldest, newest }, signal) {
  const params = new URLSearchParams({ oldest, newest });
  return getJson(`/api/calendar?${params}`, signal);
}
