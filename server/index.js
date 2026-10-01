import express from "express";
import { isAiConfigured } from "./ai/client.js";
import { summarizeStreams } from "./analysis/streams.js";
import { answer } from "./assistant/chat.js";
import { workoutProposals } from "./assistant/proposals.js";
import { config } from "./config.js";
import { getCalendar, isIntervalsConfigured } from "./intervals/client.js";
import {
  buildAuthorizeUrl,
  consumeState,
  exchangeCode,
  isConnected,
} from "./strava/auth.js";
import {
  getActivities,
  getActivity,
  getActivityStreams,
  getActivityZones,
  getAthlete,
  getAthleteStats,
} from "./strava/client.js";

export const app = express();

app.get("/auth/strava", (req, res) => {
  res.redirect(buildAuthorizeUrl());
});

app.get("/auth/strava/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (
    error ||
    typeof code !== "string" ||
    typeof state !== "string" ||
    !consumeState(state)
  ) {
    return res.redirect(`${config.appUrl}/?strava=error`);
  }
  await exchangeCode(code);
  res.redirect(`${config.appUrl}/?strava=connected`);
});

app.get("/api/status", async (req, res) => {
  res.json({ connected: await isConnected() });
});

app.get("/api/athlete", async (req, res) => {
  res.json(await getAthlete());
});

app.get("/api/stats", async (req, res) => {
  res.json(await getAthleteStats());
});

app.get("/api/activities", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const perPage = Math.min(
    200,
    Math.max(1, Number.parseInt(req.query.per_page, 10) || 30),
  );
  const after = Number.parseInt(req.query.after, 10);
  res.json(
    await getActivities({
      page,
      perPage,
      after: after > 0 ? after : undefined,
    }),
  );
});

app.param("id", (req, res, next, id) => {
  if (!/^\d{1,20}$/.test(id)) {
    return res.status(400).json({ error: "Id de actividad no válido" });
  }
  next();
});

app.get("/api/activities/:id", async (req, res) => {
  res.json(await getActivity(req.params.id));
});

app.get("/api/activities/:id/zones", async (req, res) => {
  res.json(await getActivityZones(req.params.id));
});

app.get("/api/activities/:id/streams", async (req, res) => {
  res.json(summarizeStreams(await getActivityStreams(req.params.id)));
});

const MAX_CALENDAR_DAYS = 42;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().startsWith(value) ? date : null;
}

app.get("/api/intervals/status", (req, res) => {
  res.json({ configured: isIntervalsConfigured() });
});

app.get("/api/calendar", async (req, res) => {
  const oldest = parseIsoDate(req.query.oldest);
  const newest = parseIsoDate(req.query.newest);
  const days = oldest && newest ? (newest - oldest) / DAY_MS : -1;
  if (days < 0 || days >= MAX_CALENDAR_DAYS) {
    return res.status(400).json({
      error: `Rango de fechas no válido (máximo ${MAX_CALENDAR_DAYS} días)`,
    });
  }
  res.json(
    await getCalendar({ oldest: req.query.oldest, newest: req.query.newest }),
  );
});

const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 2000;

/** Últimos mensajes `user`/`assistant` de texto; `null` si el formato no es válido. */
function parseHistory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  const history = messages.slice(-MAX_HISTORY_MESSAGES);
  const valid = history.every(
    (message) =>
      (message?.role === "user" || message?.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      message.content.length <= MAX_MESSAGE_CHARS,
  );
  if (!valid || history.at(-1).role !== "user") return null;
  return history.map(({ role, content }) => ({ role, content }));
}

app.get("/api/assistant/status", (req, res) => {
  res.json({
    ai: isAiConfigured(),
    intervals: isIntervalsConfigured(),
    model: config.ai.model,
  });
});

app.param("proposalId", (req, res, next, id) => {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  ) {
    return res.status(400).json({ error: "Id de propuesta no válido." });
  }
  next();
});

app.get("/api/assistant/proposals/:proposalId", (req, res) => {
  res.json(workoutProposals.get(req.params.proposalId));
});

app.post(
  "/api/assistant/proposals/:proposalId/:action",
  express.json({ limit: "1kb" }),
  async (req, res) => {
    if (
      !req.is("application/json") ||
      req.get("X-strideRide-Confirm") !== "1" ||
      req.get("Sec-Fetch-Site") === "cross-site" ||
      req.body?.confirmed !== true
    ) {
      return res
        .status(400)
        .json({ error: "Se requiere confirmación explícita." });
    }
    const { proposalId, action } = req.params;
    if (action === "confirm") {
      if (!isIntervalsConfigured()) {
        return res
          .status(503)
          .json({ error: "Intervals.icu no está configurado." });
      }
      res.json(await workoutProposals.confirm(proposalId));
    } else if (action === "discard") {
      res.json(workoutProposals.discard(proposalId));
    } else {
      res.status(404).json({ error: "Acción no válida." });
    }
  },
);

// Solo JSON: un formulario de otra web no puede enviar este tipo sin permiso CORS.
app.post(
  "/api/assistant/chat",
  express.json({ limit: "32kb" }),
  async (req, res) => {
    const history = parseHistory(req.body?.messages);
    if (!history) {
      return res.status(400).json({ error: "Conversación no válida" });
    }
    if (!isIntervalsConfigured()) {
      return res
        .status(503)
        .json({ error: "Intervals.icu no está configurado." });
    }
    res.json(await answer(history));
  },
);

app.use((err, req, res, _next) => {
  const status = err.status ?? 500;
  if (!err.status) console.error(err);
  res
    .status(status)
    .json({ error: err.status ? err.message : "Error interno del servidor" });
});

// Solo escucha en local: el acceso desde el móvil pasa por el proxy de Vite.
if (import.meta.main) {
  app.listen(config.port, "127.0.0.1", () => {
    console.log(`API de strideRide en http://127.0.0.1:${config.port}`);
  });
}
