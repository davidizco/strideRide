import { getSportGroup } from "./sports.js";

const SPLIT_SPORTS = new Set(["run", "walk"]);
const AUTO_LAP_METERS = 1000;
const AUTO_LAP_TOLERANCE = 15;

function splitGroup(sportType) {
  if (sportType === "Walk" || sportType === "Hike") return "walk";
  return getSportGroup(sportType);
}

/** Potencia medida por un sensor (no la estimada por Strava). */
export function hasRealPower(activity) {
  return activity.device_watts === true && activity.average_watts > 0;
}

export function showSplits(activity) {
  return (
    SPLIT_SPORTS.has(splitGroup(activity.sport_type)) &&
    activity.splits_metric?.length > 1
  );
}

function isAutoKmLaps(laps) {
  return laps
    .slice(0, -1)
    .every(
      (lap) => Math.abs(lap.distance - AUTO_LAP_METERS) <= AUTO_LAP_TOLERANCE,
    );
}

/** Vueltas con distancia (sin descansos de natación); vacío si son auto-laps de 1 km que repiten los splits. */
export function visibleLaps(activity) {
  const laps = (activity.laps ?? []).filter((lap) => lap.distance > 0);
  if (laps.length <= 1) return [];
  if (showSplits(activity) && isAutoKmLaps(laps)) return [];
  return laps;
}
