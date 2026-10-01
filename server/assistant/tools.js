import {
  getActivityIntervals,
  getAthleteProfile,
  getPlannedEvents,
  getWellness,
  listActivities,
} from "../intervals/client.js";
import { addDays, daysBetween, isIsoDate } from "./dates.js";
import { WORKOUT_TYPES } from "./proposals.js";

const MAX_RANGE_DAYS = 42;

const dateRangeParams = {
  oldest: { type: "string", description: "Fecha inicial YYYY-MM-DD" },
  newest: { type: "string", description: "Fecha final YYYY-MM-DD (incluida)" },
};

export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "proposeWorkout",
      description:
        "Prepara una sesión individual para revisión. NO escribe en el calendario. Solo una propuesta por respuesta; el usuario debe confirmar con el botón de la vista previa.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha local YYYY-MM-DD, desde hoy hasta 12 semanas.",
          },
          type: { type: "string", enum: WORKOUT_TYPES },
          name: {
            type: "string",
            description: "Nombre en español, máximo 100 caracteres.",
          },
          description: {
            type: "string",
            description:
              "Texto nativo Intervals.icu, máximo 6000 caracteres. Cada paso empieza por '- ' y contiene duración (10m, 30s) o distancia (1km, 100mtr). Ejemplo: Calentamiento\n- 10m Z1 HR\n\nPrincipal 4x\n- 3m Z3 Pace\n- 2m Z1 HR\n\nVuelta a la calma\n- 5m Z1 HR. Potencia: 80% o 100w; FC: Z2 HR; ritmo: Z2 Pace. No usar markdown ni JSON dentro del texto.",
          },
        },
        required: ["date", "type", "name", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAthleteProfile",
      description:
        "Umbrales y zonas por deporte (FTP, LTHR, FC máxima, ritmo umbral), peso, FC en reposo y zona horaria.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getFitness",
      description: `Wellness diario: CTL (forma), ATL (fatiga), form = CTL − ATL, rampRate, VFC, FC en reposo, sueño, peso y sensaciones. Máximo ${MAX_RANGE_DAYS} días.`,
      parameters: { type: "object", properties: dateRangeParams },
    },
  },
  {
    type: "function",
    function: {
      name: "listActivities",
      description: `Actividades realizadas (registradas con Garmin), de la más reciente a la más antigua. Máximo ${MAX_RANGE_DAYS} días.`,
      parameters: {
        type: "object",
        properties: {
          ...dateRangeParams,
          type: {
            type: "string",
            description:
              "Filtrar por tipo exacto: Run, TrailRun, Ride, VirtualRide, MountainBikeRide, GravelRide, Swim, OpenWaterSwim, WeightTraining…",
          },
          limit: { type: "integer", description: "Máximo 50 (por defecto 20)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getActivityDetail",
      description:
        "Detalle de una actividad con sus intervalos (potencia, FC, ritmo, cadencia, zona), desacople y factor de eficiencia.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Id de la actividad devuelto por listActivities",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPlannedEvents",
      description: `Calendario: entrenos planificados, notas, carreras, vacaciones o lesiones. Máximo ${MAX_RANGE_DAYS} días.`,
      parameters: { type: "object", properties: dateRangeParams },
    },
  },
];

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function dateRange(args, today, { from, to }) {
  const oldest = args.oldest ?? addDays(today, from);
  const newest = args.newest ?? addDays(today, to);
  if (!isIsoDate(oldest) || !isIsoDate(newest)) {
    throw invalid("Las fechas deben tener el formato YYYY-MM-DD.");
  }
  const days = daysBetween(oldest, newest);
  if (days < 0 || days >= MAX_RANGE_DAYS) {
    throw invalid(`El rango debe ser de 1 a ${MAX_RANGE_DAYS} días.`);
  }
  return { oldest, newest };
}

const HANDLERS = {
  getAthleteProfile: () => getAthleteProfile(),
  getFitness: (args, today) =>
    getWellness(dateRange(args, today, { from: -13, to: 0 })),
  listActivities: (args, today) => {
    if (args.type !== undefined && !/^[A-Za-z]{2,30}$/.test(args.type)) {
      throw invalid("Tipo de actividad no válido.");
    }
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(args.limit, 10) || 20),
    );
    return listActivities({
      ...dateRange(args, today, { from: -13, to: 0 }),
      type: args.type,
      limit,
    });
  },
  getActivityDetail: (args) => {
    if (typeof args.id !== "string" || !/^i?\d{1,20}$/.test(args.id)) {
      throw invalid("Id de actividad no válido.");
    }
    return getActivityIntervals(args.id);
  },
  getPlannedEvents: (args, today) =>
    getPlannedEvents(dateRange(args, today, { from: 0, to: 13 })),
};

/** Ejecuta una tool pedida por el modelo. Los errores se devuelven al modelo, no se lanzan. */
export async function runTool(name, rawArgs, today, propose) {
  let handler = Object.hasOwn(HANDLERS, name) ? HANDLERS[name] : null;
  if (name === "proposeWorkout") handler = propose;
  if (!handler) return { error: `Herramienta desconocida: ${name}` };
  try {
    const args = rawArgs ? JSON.parse(rawArgs) : {};
    if (typeof args !== "object" || args === null || Array.isArray(args)) {
      return { error: "Argumentos no válidos." };
    }
    return await handler(args, today);
  } catch (error) {
    if (error instanceof SyntaxError)
      return { error: "Argumentos no válidos." };
    if (!error.status) console.error(error);
    return { error: error.status ? error.message : "Error al leer los datos." };
  }
}
