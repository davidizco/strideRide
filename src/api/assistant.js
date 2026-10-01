import { getJson, postJson } from "./http.js";

export const getAssistantStatus = (signal) =>
  getJson("/api/assistant/status", signal);

/** `messages`: conversación `{ role: "user" | "assistant", content }`. */
export const sendChat = (messages, signal) =>
  postJson(
    "/api/assistant/chat",
    {
      messages: messages.slice(-10).map(({ role, content }) => ({
        role,
        content: role === "assistant" ? content.slice(0, 2000) : content,
      })),
    },
    signal,
  );

export const getWorkoutProposal = (id, signal) =>
  getJson(`/api/assistant/proposals/${encodeURIComponent(id)}`, signal);

export const actOnWorkoutProposal = (id, action) =>
  postJson(
    `/api/assistant/proposals/${encodeURIComponent(id)}/${action}`,
    { confirmed: true },
    undefined,
    { "X-strideRide-Confirm": "1" },
  );
