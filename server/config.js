function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa el archivo .env (usa .env.example como plantilla).`,
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  strava: {
    clientId: required("STRAVA_CLIENT_ID"),
    clientSecret: required("STRAVA_CLIENT_SECRET"),
    scope: "read,profile:read_all,activity:read_all",
  },
  intervals: {
    apiKey: process.env.INTERVALS_API_KEY || null,
    // "0" = el atleta dueño de la clave API.
    athleteId: process.env.INTERVALS_ATHLETE_ID || "0",
  },
  // Cualquier proveedor con API compatible con OpenAI (por defecto, Gemini).
  ai: {
    apiKey: process.env.AI_API_KEY || null,
    baseUrl: (
      process.env.AI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai"
    ).replace(/\/+$/, ""),
    model: process.env.AI_MODEL || "gemini-3.7-flash",
    // Se prueban en orden si el principal está saturado (503).
    models: [
      process.env.AI_MODEL || "gemini-3.7-flash",
      ...(process.env.AI_FALLBACK_MODELS ?? "gemini-3.6-flash")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    ],
    reasoningEffort: process.env.AI_REASONING_EFFORT ?? "low",
    maxPerMinute: Number(process.env.AI_MAX_REQUESTS_PER_MINUTE) || 8,
    maxPerDay: Number(process.env.AI_MAX_REQUESTS_PER_DAY) || 200,
  },
};
