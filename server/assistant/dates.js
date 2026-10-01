const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha `YYYY-MM-DD` de hoy en la zona horaria del atleta. */
export function todayIn(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  }
}

export function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().startsWith(value)
  );
}

export function daysBetween(oldest, newest) {
  return (
    (new Date(`${newest}T00:00:00Z`) - new Date(`${oldest}T00:00:00Z`)) / DAY_MS
  );
}

export function formatLongDate(iso) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
