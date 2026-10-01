import { randomUUID } from "node:crypto";
import { createPlannedWorkout } from "../intervals/client.js";
import { daysBetween, isIsoDate } from "./dates.js";

export const WORKOUT_TYPES = [
  "Run",
  "TrailRun",
  "Ride",
  "VirtualRide",
  "MountainBikeRide",
  "GravelRide",
  "Swim",
  "OpenWaterSwim",
  "WeightTraining",
];

const TTL_MS = 30 * 60 * 1000;

function invalid(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function validateWorkout(input, today) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw invalid("Entreno no válido.");
  }
  const { date, type, name, description } = input;
  if (
    !isIsoDate(date) ||
    !isIsoDate(today) ||
    daysBetween(today, date) < 0 ||
    daysBetween(today, date) > 83
  ) {
    throw invalid("El entreno debe estar entre hoy y las próximas 12 semanas.");
  }
  if (!WORKOUT_TYPES.includes(type)) throw invalid("Deporte no válido.");
  if (typeof name !== "string" || !name.trim() || name.length > 100) {
    throw invalid("El nombre debe tener entre 1 y 100 caracteres.");
  }
  if (
    typeof description !== "string" ||
    description.length > 6000 ||
    [...description].some((character) => {
      const code = character.codePointAt(0);
      return code < 32 && ![9, 10, 13].includes(code);
    })
  ) {
    throw invalid(
      "Descripción del entreno no válida (máximo 6000 caracteres).",
    );
  }
  const steps = description.split(/\r?\n/).filter((line) => /^-\s/.test(line));
  if (
    !steps.length ||
    steps.length > 80 ||
    steps.some((line) => !/\b[1-9]\d*(?:\.\d+)?(?:mtr|km|m|s)\b/.test(line))
  ) {
    throw invalid(
      "Cada paso debe empezar por '- ' e incluir duración o distancia.",
    );
  }
  return { date, type, name: name.trim(), description: description.trim() };
}

export function createProposalStore({ publish, now = Date.now }) {
  const proposals = new Map();

  function prune() {
    for (const [id, proposal] of proposals) {
      if (proposal.expiresAt <= now() && proposal.status !== "publishing") {
        proposals.delete(id);
      }
    }
  }

  function get(id) {
    prune();
    const proposal = proposals.get(id);
    if (!proposal) {
      throw invalid(
        "La propuesta ha caducado o ya no está disponible. Pide otra.",
        410,
      );
    }
    return structuredClone(proposal);
  }

  return {
    create(input, today) {
      const workout = validateWorkout(input, today);
      prune();
      if (proposals.size >= 50) {
        throw invalid("Hay demasiadas propuestas. Espera a que caduquen.", 429);
      }
      const proposal = {
        id: randomUUID(),
        workout,
        status: "pending",
        expiresAt: now() + TTL_MS,
      };
      proposals.set(proposal.id, proposal);
      return structuredClone(proposal);
    },
    get,
    discard(id) {
      get(id);
      const proposal = proposals.get(id);
      if (proposal.status !== "pending") {
        throw invalid("Esta propuesta ya no se puede descartar.", 409);
      }
      proposal.status = "discarded";
      return get(id);
    },
    async confirm(id) {
      get(id);
      const proposal = proposals.get(id);
      if (proposal.status === "published") return get(id);
      if (proposal.status !== "pending") {
        throw invalid(
          "Esta propuesta ya no se puede publicar. Revisa el calendario.",
          409,
        );
      }
      proposal.status = "publishing";
      try {
        proposal.event = await publish(structuredClone(proposal.workout));
        proposal.status = "published";
        proposal.expiresAt = now() + TTL_MS;
      } catch {
        proposal.status = "uncertain";
        proposal.expiresAt = now() + TTL_MS;
        proposal.error =
          "No se pudo confirmar la publicación. Revisa Intervals.icu antes de pedir otra propuesta para evitar duplicados.";
      }
      return get(id);
    },
  };
}

export const workoutProposals = createProposalStore({
  publish: createPlannedWorkout,
});
