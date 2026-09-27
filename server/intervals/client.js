import { config } from "../config.js";

const API_URL = "https://intervals.icu/api/v1";
// El calendario cambia al añadir entrenos: caché corta.
const CACHE_TTL_MS = 2 * 60 * 1000;

const ACTIVITY_FIELDS = [
  "id",
  "name",
  "type",
  "start_date_local",
  "moving_time",
  "distance",
  "total_elevation_gain",
  "icu_training_load",
  "average_heartrate",
  "paired_event_id",
  "source",
  "device_name",
];

const cache = new Map();

export function isIntervalsConfigured() {
  return Boolean(config.intervals.apiKey);
}

function authorization() {
  if (!isIntervalsConfigured()) {
    throw Object.assign(
      new Error(
        "Intervals.icu no está configurado: añade INTERVALS_API_KEY en .env",
      ),
      { status: 503 },
    );
  }
  const credentials = Buffer.from(`API_KEY:${config.intervals.apiKey}`);
  return `Basic ${credentials.toString("base64")}`;
}

async function intervalsGet(path, params = {}) {
  const url = new URL(
    `${API_URL}/athlete/${config.intervals.athleteId}${path}`,
  );
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const cached = cache.get(url.href);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const res = await fetch(url, {
    headers: {
      Authorization: authorization(),
      Accept: "application/json",
      // Cloudflare de Intervals.icu puede bloquear clientes sin User-Agent.
      "User-Agent": "strideRide/0.1 (uso personal)",
    },
  });

  if (res.status === 429) {
    throw Object.assign(
      new Error("Límite de peticiones de Intervals.icu alcanzado."),
      { status: 429 },
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error("La clave de Intervals.icu no es válida."), {
      status: 502,
    });
  }
  if (!res.ok) {
    throw Object.assign(
      new Error(`Error de Intervals.icu (${res.status}) en ${path}`),
      { status: 502 },
    );
  }
  const data = await res.json();
  cache.set(url.href, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

function pickPlanned(event) {
  return {
    id: event.id,
    date: event.start_date_local.slice(0, 10),
    category: event.category,
    type: event.type ?? null,
    name: event.name ?? "",
    description: event.description ?? "",
    moving_time: event.moving_time ?? null,
    distance: event.distance ?? null,
    icu_training_load: event.icu_training_load ?? null,
  };
}

function pickCompleted(activity) {
  return {
    ...Object.fromEntries(
      ACTIVITY_FIELDS.map((field) => [field, activity[field] ?? null]),
    ),
    date: activity.start_date_local.slice(0, 10),
  };
}

/**
 * Calendario entre dos fechas locales `YYYY-MM-DD` (inclusivas): entrenos
 * planificados, notas y carreras (`planned`) y actividades hechas (`completed`).
 */
export async function getCalendar({ oldest, newest }) {
  const [events, activities] = await Promise.all([
    intervalsGet("/events", { oldest, newest }),
    intervalsGet("/activities", {
      oldest,
      newest: `${newest}T23:59:59`,
      fields: ACTIVITY_FIELDS.join(","),
    }),
  ]);

  return {
    planned: events.map(pickPlanned),
    // Las actividades importadas desde Strava llegan como stubs vacíos.
    completed: activities
      .filter((activity) => activity._note === undefined && activity.name)
      .map(pickCompleted),
  };
}
