import { useEffect, useRef, useState } from "react";
import { getAssistantStatus, sendChat } from "../api/assistant.js";

const STORAGE_KEY = "strideRide.chat.v1";

// La conversación sobrevive a cambiar de vista, pero no a cerrar la pestaña.
function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function useAssistantChat() {
  const [status, setStatus] = useState({ state: "loading" });
  const [messages, setMessages] = useState(loadMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    getAssistantStatus(controller.signal)
      .then((result) =>
        setStatus({
          ...result,
          state: result.ai && result.intervals ? "ready" : "not-configured",
        }),
      )
      .catch((err) => {
        if (!controller.signal.aborted) {
          setStatus({ state: "error", message: err.message });
        }
      });
    return () => {
      controller.abort();
      inFlight.current?.abort();
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      console.warn("No se pudo guardar la conversación en esta pestaña.");
    }
  }, [messages]);

  function request(history) {
    const controller = new AbortController();
    inFlight.current = controller;
    setPending(true);
    setError(null);
    sendChat(history, controller.signal)
      .then(({ reply, proposals = [], model }) => {
        if (controller.signal.aborted || inFlight.current !== controller)
          return;
        setStatus((current) => ({ ...current, model: model ?? current.model }));
        setMessages((current) => [
          ...current,
          { role: "assistant", content: reply, proposals },
        ]);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (inFlight.current === controller) setPending(false);
      });
  }

  const send = (text) => {
    const content = text.trim();
    if (!content || pending) return;
    const history = [...messages, { role: "user", content }];
    setMessages(history);
    request(history);
  };

  const retry = () => {
    if (!pending && messages.at(-1)?.role === "user") request(messages);
  };

  const reset = () => {
    inFlight.current?.abort();
    inFlight.current = null;
    setPending(false);
    setError(null);
    setMessages([]);
  };

  const updateProposal = (proposal) => {
    setMessages((current) =>
      current.map((message) =>
        message.proposals?.some((item) => item.id === proposal.id)
          ? {
              ...message,
              proposals: message.proposals.map((item) =>
                item.id === proposal.id ? proposal : item,
              ),
            }
          : message,
      ),
    );
  };

  return {
    status,
    messages,
    pending,
    error,
    send,
    retry,
    reset,
    updateProposal,
  };
}
