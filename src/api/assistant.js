import { getJson, postJson } from "./http.js";

export const getAssistantStatus = (signal) =>
  getJson("/api/assistant/status", signal);

/** `messages`: conversación `{ role: "user" | "assistant", content }`. */
export const sendChat = (messages, signal) =>
  postJson("/api/assistant/chat", { messages }, signal);
