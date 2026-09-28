const LOCALE = "es-ES";

const numberFormat = (maxDecimals) =>
  new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });

const km = numberFormat(1);
const integer = numberFormat(0);

// start_date_local viene con sufijo Z pero es la hora local del atleta: se formatea en UTC para no desplazarla.
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const fullDateFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const pad = (value) => String(value).padStart(2, "0");

export function formatDistance(meters) {
  if (meters < 1000) return `${integer.format(meters)} m`;
  return `${km.format(meters / 1000)} km`;
}

export function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

/** Reloj `m:ss` o `h:mm:ss`, para splits y vueltas. */
export function formatClock(seconds) {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = pad(total % 60);
  return hours > 0 ? `${hours}:${pad(minutes)}:${secs}` : `${minutes}:${secs}`;
}

/** Ritmo `m:ss` sin unidad, para ejes de gráficas y tablas. */
export function formatPaceShort(metersPerSecond, meters = 1000) {
  if (!metersPerSecond) return "—";
  return formatClock(meters / metersPerSecond);
}

export function formatPace(metersPerSecond) {
  if (!metersPerSecond) return "—";
  return `${formatPaceShort(metersPerSecond)} /km`;
}

export function formatSwimPace(metersPerSecond) {
  if (!metersPerSecond) return "—";
  return `${formatPaceShort(metersPerSecond, 100)} /100 m`;
}

export function formatSpeed(metersPerSecond) {
  return `${km.format(metersPerSecond * 3.6)} km/h`;
}

export function formatElevation(meters) {
  return `${integer.format(meters)} m`;
}

export function formatSignedElevation(meters) {
  const rounded = Math.round(meters);
  return `${rounded > 0 ? "+" : ""}${integer.format(rounded)} m`;
}

export function formatPower(watts) {
  return `${integer.format(watts)} W`;
}

export function formatEnergy(kilojoules) {
  return `${integer.format(kilojoules)} kJ`;
}

export function formatCalories(kcal) {
  return `${integer.format(kcal)} kcal`;
}

/** Duraciones cortas legibles: `5 s`, `2 min`, `1 h 30 min`. */
export function formatShortDuration(seconds) {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function formatHeartRate(bpm) {
  return `${integer.format(bpm)} ppm`;
}

export function formatActivityDate(startDateLocal) {
  return dateFormat.format(new Date(startDateLocal));
}

export function formatFullDate(startDateLocal) {
  return fullDateFormat.format(new Date(startDateLocal));
}
