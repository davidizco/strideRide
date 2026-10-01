import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";

process.env.STRAVA_CLIENT_ID = "test-client";
process.env.STRAVA_CLIENT_SECRET = "test-secret";
process.env.INTERVALS_API_KEY = "test-key";
process.env.AI_API_KEY = "test-key";

const { createProposalStore } = await import("./proposals.js");
const { runTool, TOOL_DEFINITIONS } = await import("./tools.js");
const { createPlannedWorkout, getPlannedEvents } =
  await import("../intervals/client.js");
const { config } = await import("../config.js");

const today = "2026-10-01";
const workout = {
  date: today,
  type: "Run",
  name: "Rodaje suave",
  description: "Calentamiento\n- 10m Z1 HR\n\nPrincipal\n- 30m Z2 HR",
};

test("proponer no publica y confirmar concurrentemente no duplica", async () => {
  let calls = 0;
  let finish;
  const store = createProposalStore({
    publish: async () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  const proposal = store.create(workout, today);
  assert.equal(calls, 0);
  proposal.workout.name = "Alterado";
  assert.equal(store.get(proposal.id).workout.name, workout.name);
  const first = store.confirm(proposal.id);
  await assert.rejects(store.confirm(proposal.id), { status: 409 });
  finish({ id: 123 });
  assert.equal((await first).status, "published");
  assert.equal((await store.confirm(proposal.id)).event.id, 123);
  assert.equal(calls, 1);
});

test("validación de fechas, deporte, nombre y pasos", () => {
  const store = createProposalStore({ publish: assert.fail });
  for (const change of [
    { date: "2026-99-99" },
    { date: "2026-02-30" },
    { date: "2026-09-30" },
    { date: "2027-01-01" },
    { type: "Unknown" },
    { name: " " },
    { description: "Sin pasos" },
    { description: "- 0m Z2 HR" },
    { description: "- 10m Z2 HR\n- Sin duración" },
  ]) {
    assert.throws(() => store.create({ ...workout, ...change }, today), {
      status: 400,
    });
  }
});

test("descartar y caducar impiden publicar", async () => {
  let clock = 0;
  const store = createProposalStore({ publish: assert.fail, now: () => clock });
  const discarded = store.create(workout, today);
  store.discard(discarded.id);
  await assert.rejects(store.confirm(discarded.id), { status: 409 });
  const expired = store.create(workout, today);
  clock = 30 * 60 * 1000;
  await assert.rejects(store.confirm(expired.id), { status: 410 });
});

test("un resultado incierto bloquea reintentos", async () => {
  let calls = 0;
  const store = createProposalStore({
    publish: async () => {
      calls++;
      throw new Error("timeout");
    },
  });
  const proposal = store.create(workout, today);
  assert.equal((await store.confirm(proposal.id)).status, "uncertain");
  await assert.rejects(store.confirm(proposal.id), { status: 409 });
  assert.equal(calls, 1);
});

test("la IA solo puede proponer, nunca confirmar, y rechaza nombres heredados", async () => {
  const store = createProposalStore({ publish: assert.fail });
  const proposal = await runTool(
    "proposeWorkout",
    JSON.stringify(workout),
    today,
    store.create,
  );
  assert.equal(proposal.status, "pending");
  for (const name of [
    "confirm",
    "createPlannedWorkout",
    "toString",
    "__proto__",
  ]) {
    assert.ok((await runTool(name, "{}", today, store.create)).error);
    assert.equal(
      TOOL_DEFINITIONS.some((tool) => tool.function.name === name),
      false,
    );
  }
});

test("el cliente publica el evento esperado e invalida la caché sin servicios reales", async (context) => {
  const originalKey = config.intervals.apiKey;
  config.intervals.apiKey = "test-key";
  context.after(() => {
    config.intervals.apiKey = originalKey;
  });
  const calls = [];
  context.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(
      JSON.stringify(
        options.method === "POST" ? { id: 456, privateField: "omitted" } : [],
      ),
    );
  });
  await getPlannedEvents({ oldest: today, newest: today });
  await getPlannedEvents({ oldest: today, newest: today });
  assert.equal(calls.length, 1);
  assert.deepEqual(await createPlannedWorkout(workout), { id: 456 });
  const sent = calls[1];
  assert.ok(sent.url.endsWith("/events"));
  assert.equal(sent.options.method, "POST");
  assert.deepEqual(JSON.parse(sent.options.body), {
    category: "WORKOUT",
    start_date_local: `${today}T00:00:00`,
    type: workout.type,
    name: workout.name,
    description: workout.description,
  });
  await getPlannedEvents({ oldest: today, newest: today });
  assert.equal(calls.length, 3);
});

test("HTTP: propuesta del chat, confirmación explícita y contenido inmutable", async (context) => {
  const { app } = await import("../index.js");
  const localFetch = globalThis.fetch;
  const server = app.listen(0, "127.0.0.1");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const currentDate = new Date().toISOString().slice(0, 10);
  const proposedWorkout = { ...workout, date: currentDate };
  let completions = 0;
  const writes = [];
  context.mock.method(globalThis, "fetch", async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/chat/completions")) {
      completions++;
      const message =
        completions === 1
          ? {
              role: "assistant",
              tool_calls: [
                {
                  id: "test-call",
                  type: "function",
                  function: {
                    name: "proposeWorkout",
                    arguments: JSON.stringify(proposedWorkout),
                  },
                },
              ],
            }
          : {
              role: "assistant",
              content: "Revisa la propuesta antes de confirmar.",
            };
      return Response.json({ choices: [{ message }] });
    }
    assert.equal(parsed.hostname, "intervals.icu");
    if (options.method === "POST") {
      writes.push(JSON.parse(options.body));
      return Response.json({ id: 789 });
    }
    return Response.json(
      /\/athlete\/[^/]+$/.test(parsed.pathname) ? { timezone: "UTC" } : [],
    );
  });

  const chat = await localFetch(`${base}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Propón un rodaje hoy." }],
    }),
  });
  assert.equal(chat.status, 200);
  const { proposals } = await chat.json();
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].status, "pending");
  assert.equal(writes.length, 0);
  const path = `${base}/api/assistant/proposals/${proposals[0].id}`;
  const headers = {
    "Content-Type": "application/json",
    "X-strideRide-Confirm": "1",
  };
  for (const denied of [
    {
      headers: { "Content-Type": "application/json" },
      body: { confirmed: true },
    },
    { headers, body: { confirmed: false } },
    {
      headers: { ...headers, "Sec-Fetch-Site": "cross-site" },
      body: { confirmed: true },
    },
    {
      headers: { ...headers, "Content-Type": "text/plain" },
      body: { confirmed: true },
    },
  ]) {
    const response = await localFetch(`${path}/confirm`, {
      method: "POST",
      headers: denied.headers,
      body: JSON.stringify(denied.body),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(writes.length, 0);
  const confirm = () =>
    localFetch(`${path}/confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        confirmed: true,
        workout: { name: "Alteración ignorada" },
      }),
    });
  assert.equal((await (await confirm()).json()).status, "published");
  assert.equal((await (await confirm()).json()).status, "published");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, proposedWorkout.name);
  assert.equal(writes[0].description, proposedWorkout.description);
  assert.equal((await (await localFetch(path)).json()).event.id, 789);
  assert.equal(
    (await localFetch(`${base}/api/assistant/proposals/not-a-uuid`)).status,
    400,
  );
});
