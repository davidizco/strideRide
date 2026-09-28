const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const shortFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Los días son cadenas "YYYY-MM-DD" (hora local); se operan en UTC para no sufrir cambios de horario.
const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const toIso = (date) => date.toISOString().slice(0, 10);

export function todayIso() {
  const now = new Date();
  return toIso(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );
}

export function addDays(iso, days) {
  return toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
}

export function mondayOf(iso) {
  return addDays(iso, -((toDate(iso).getUTCDay() + 6) % 7));
}

export function weekDays(mondayIso) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i));
}

export function formatDayLabel(iso) {
  return dayFormat.format(toDate(iso));
}

export function formatWeekRange(mondayIso) {
  const sunday = addDays(mondayIso, 6);
  return `${shortFormat.format(toDate(mondayIso))} – ${shortFormat.format(toDate(sunday))}`;
}

export function groupByDate(items) {
  const groups = new Map();
  for (const item of items) {
    const group = groups.get(item.date);
    if (group) group.push(item);
    else groups.set(item.date, [item]);
  }
  return groups;
}

const CATEGORY_LABELS = {
  NOTE: "Nota",
  RACE_A: "Carrera A",
  RACE_B: "Carrera B",
  RACE_C: "Carrera C",
  HOLIDAY: "Vacaciones",
  SICK: "Enfermo",
  INJURED: "Lesión",
};

/** Etiqueta de un evento del calendario que no es un entreno. */
export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] ?? null;
}
