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
  const url = new URL(`${API_URL}${path}`);
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

const athletePath = (path = "") =>
  `/athlete/${config.intervals.athleteId}${path}`;

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
    intervalsGet(athletePath("/events"), { oldest, newest }),
    intervalsGet(athletePath("/activities"), {
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

// Lecturas para el asistente IA: respuestas compactas para ahorrar tokens.

const SUMMARY_FIELDS = [
  "id",
  "name",
  "type",
  "start_date_local",
  "moving_time",
  "distance",
  "total_elevation_gain",
  "icu_training_load",
  "average_heartrate",
  "icu_average_watts",
  "icu_weighted_avg_watts",
  "icu_intensity",
  "average_speed",
  "icu_rpe",
  "feel",
  "compliance",
  "paired_event_id",
  "source",
  "device_name",
];

const round = (value, decimals = 0) =>
  value === null || value === undefined
    ? null
    : Math.round(value * 10 ** decimals) / 10 ** decimals;

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );
}

/** Ritmo `m:ss` a partir de m/s, por km o por 100 m. */
function paceString(metersPerSecond, meters = 1000) {
  if (!metersPerSecond) return null;
  const total = Math.round(meters / metersPerSecond);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const isSwim = (type) => /Swim/.test(type ?? "");
const isRide = (type) => /Ride|Cyclocross/.test(type ?? "");

// Lo importado desde Strava nunca puede llegar a la IA (API Policy de Strava, 5.3).
const isUsableActivity = (activity) =>
  activity._note === undefined &&
  Boolean(activity.name) &&
  activity.source !== "STRAVA";

function speedFields(type, metersPerSecond) {
  if (!metersPerSecond) return {};
  if (isRide(type)) return { kmh: round(metersPerSecond * 3.6, 1) };
  return { pace: paceString(metersPerSecond, isSwim(type) ? 100 : 1000) };
}

function summarizeActivity(activity) {
  return compact({
    id: activity.id,
    date: activity.start_date_local.slice(0, 16).replace("T", " "),
    type: activity.type,
    name: activity.name,
    minutes: round(activity.moving_time / 60),
    km: activity.distance ? round(activity.distance / 1000, 2) : null,
    elevationM: round(activity.total_elevation_gain) || null,
    load: activity.icu_training_load,
    avgHr: round(activity.average_heartrate),
    avgWatts: round(activity.icu_average_watts),
    normalizedWatts: round(activity.icu_weighted_avg_watts),
    intensityPct: round(activity.icu_intensity),
    ...speedFields(activity.type, activity.average_speed),
    rpe: activity.icu_rpe,
    feel: activity.feel,
    compliancePct: round(activity.compliance),
    plannedEventId: activity.paired_event_id,
    device: activity.device_name,
  });
}

/** Umbrales y zonas por deporte. Omite a propósito email, clave API y demás datos de la cuenta. */
export async function getAthleteProfile() {
  const athlete = await intervalsGet(athletePath());
  return compact({
    firstname: athlete.firstname,
    sex: athlete.sex,
    timezone: athlete.timezone,
    weightKg: athlete.icu_weight ?? athlete.weight,
    restingHr: athlete.icu_resting_hr,
    garminUploadWorkouts: athlete.icu_garmin_upload_workouts,
    sports: (athlete.sportSettings ?? []).map((sport) =>
      compact({
        types: sport.types,
        ftp: sport.ftp,
        indoorFtp: sport.indoor_ftp,
        lthr: sport.lthr,
        maxHr: sport.max_hr,
        thresholdPace: paceString(
          sport.threshold_pace,
          sport.types.some(isSwim) ? 100 : 1000,
        ),
        powerZonesPctFtp: sport.power_zones,
        hrZonesBpm: sport.hr_zones,
        paceZonesPctThreshold: sport.pace_zones,
      }),
    ),
  });
}

/** Wellness diario entre dos fechas `YYYY-MM-DD`: forma (CTL/ATL), VFC, sueño y sensaciones. */
export async function getWellness({ oldest, newest }) {
  const days = await intervalsGet(athletePath("/wellness"), {
    oldest,
    newest,
  });
  return days.map((day) =>
    compact({
      date: day.id,
      ctl: round(day.ctl, 1),
      atl: round(day.atl, 1),
      form:
        day.ctl != null && day.atl != null ? round(day.ctl - day.atl, 1) : null,
      rampRate: round(day.rampRate, 1),
      hrv: round(day.hrv),
      restingHr: day.restingHR,
      sleepHours: day.sleepSecs ? round(day.sleepSecs / 3600, 1) : null,
      sleepScore: day.sleepScore,
      weightKg: day.weight,
      readiness: day.readiness,
      fatigue: day.fatigue,
      soreness: day.soreness,
      stress: day.stress,
      mood: day.mood,
      motivation: day.motivation,
    }),
  );
}

/** Actividades hechas (de Garmin), de la más reciente a la más antigua. */
export async function listActivities({ oldest, newest, type, limit = 20 }) {
  const activities = await intervalsGet(athletePath("/activities"), {
    oldest,
    newest: `${newest}T23:59:59`,
    fields: SUMMARY_FIELDS.join(","),
  });
  return activities
    .filter((activity) => isUsableActivity(activity))
    .filter((activity) => !type || activity.type === type)
    .sort((a, b) => b.start_date_local.localeCompare(a.start_date_local))
    .slice(0, limit)
    .map(summarizeActivity);
}

/** Detalle de una actividad con los intervalos detectados por Intervals.icu. */
export async function getActivityIntervals(id) {
  const activity = await intervalsGet(`/activity/${encodeURIComponent(id)}`, {
    intervals: true,
  });
  if (!isUsableActivity(activity)) {
    throw Object.assign(new Error("Actividad no disponible."), {
      status: 404,
    });
  }
  return compact({
    ...summarizeActivity(activity),
    decouplingPct: round(activity.decoupling, 1),
    efficiencyFactor: round(activity.icu_efficiency_factor, 2),
    intervals: (activity.icu_intervals ?? []).slice(0, 40).map((interval) =>
      compact({
        type: interval.type,
        label: interval.label,
        seconds: interval.moving_time,
        meters: round(interval.distance),
        avgWatts: round(interval.average_watts),
        normalizedWatts: round(interval.weighted_average_watts),
        avgHr: round(interval.average_heartrate),
        maxHr: round(interval.max_heartrate),
        ...speedFields(activity.type, interval.average_speed),
        cadence: round(interval.average_cadence),
        zone: interval.zone,
      }),
    ),
  });
}

/** Entrenos, notas y carreras del calendario entre dos fechas `YYYY-MM-DD`. */
export async function getPlannedEvents({ oldest, newest }) {
  const events = await intervalsGet(athletePath("/events"), {
    oldest,
    newest,
  });
  return events.map((event) => {
    const planned = pickPlanned(event);
    return compact({
      id: planned.id,
      date: planned.date,
      category: planned.category,
      type: planned.type,
      name: planned.name,
      workout: planned.description.slice(0, 600),
      minutes: planned.moving_time ? round(planned.moving_time / 60) : null,
      km: planned.distance ? round(planned.distance / 1000, 1) : null,
      load: planned.icu_training_load,
    });
  });
}
