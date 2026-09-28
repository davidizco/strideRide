import { config } from "../config.js";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const TIMEOUT_MS = 60 * 1000;

// Marcas de tiempo de las peticiones de las últimas 24 h, para no agotar la cuota del proveedor.
const requestTimes = [];

export function isAiConfigured() {
  return Boolean(config.ai.apiKey);
}

function reserveRequest() {
  const now = Date.now();
  while (requestTimes.length > 0 && requestTimes[0] <= now - DAY_MS) {
    requestTimes.shift();
  }
  const lastMinute = requestTimes.filter((time) => time > now - MINUTE_MS);
  if (lastMinute.length >= config.ai.maxPerMinute) {
    throw Object.assign(
      new Error("Demasiadas preguntas seguidas. Espera un minuto."),
      { status: 429 },
    );
  }
  if (requestTimes.length >= config.ai.maxPerDay) {
    throw Object.assign(
      new Error("Has alcanzado el límite diario del asistente."),
      { status: 429 },
    );
  }
  requestTimes.push(now);
}

/**
 * Una llamada a `chat/completions`. Sin `model`, prueba el principal y luego los de respaldo
 * si están saturados (503). Devuelve el mensaje tal cual y el modelo que ha respondido.
 */
export async function chatCompletion({ messages, tools, toolChoice, model }) {
  if (!isAiConfigured()) {
    throw Object.assign(
      new Error("El asistente no está configurado: añade AI_API_KEY en .env"),
      { status: 503 },
    );
  }
  reserveRequest();

  const post = (candidate) =>
    fetch(`${config.ai.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: candidate,
        messages,
        tools,
        tool_choice: tools ? toolChoice : undefined,
        reasoning_effort: config.ai.reasoningEffort || undefined,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

  let res;
  let usedModel;
  for (const candidate of model ? [model] : config.ai.models) {
    usedModel = candidate;
    res = await post(candidate);
    if (res.status !== 503) break;
  }

  if (res.status === 503) {
    throw Object.assign(
      new Error(
        "El modelo de IA está saturado ahora mismo. Inténtalo en unos minutos.",
      ),
      { status: 503 },
    );
  }
  if (res.status === 429) {
    throw Object.assign(
      new Error(
        "El proveedor de IA ha alcanzado su límite. Inténtalo más tarde.",
      ),
      { status: 429 },
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(
      new Error("La clave de IA (AI_API_KEY) no es válida."),
      {
        status: 502,
      },
    );
  }
  if (!res.ok) {
    console.error(`IA ${res.status}:`, (await res.text()).slice(0, 500));
    throw Object.assign(
      new Error(`Error del proveedor de IA (${res.status})`),
      {
        status: 502,
      },
    );
  }

  const message = (await res.json()).choices?.[0]?.message;
  if (!message) {
    throw Object.assign(new Error("El proveedor de IA no ha respondido."), {
      status: 502,
    });
  }
  return { message, model: usedModel };
}
