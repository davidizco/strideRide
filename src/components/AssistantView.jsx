import { useEffect } from "react";
import { useAssistantChat } from "../hooks/useAssistantChat.js";
import ChatComposer from "./ChatComposer.jsx";
import ChatMessage from "./ChatMessage.jsx";

const SUGGESTIONS = [
  "¿Cómo va mi forma esta semana?",
  "¿Qué tal fue mi último entreno de bici?",
  "¿Estoy durmiendo y recuperando bien?",
  "Propón un rodaje suave de 40 minutos para mañana",
];

function NotConfigured({ status }) {
  return (
    <section className="card">
      <h2>Configura el asistente</h2>
      {!status.ai && (
        <p className="muted">
          Añade <code>AI_API_KEY</code> en el archivo <code>.env</code> del
          servidor y reinícialo. La clave de Gemini se crea en Google AI Studio.
        </p>
      )}
      {!status.intervals && (
        <p className="muted">
          Añade también <code>INTERVALS_API_KEY</code>: el asistente usa tus
          datos de Intervals.icu.
        </p>
      )}
    </section>
  );
}

export default function AssistantView() {
  const {
    status,
    messages,
    pending,
    error,
    send,
    retry,
    reset,
    updateProposal,
  } = useAssistantChat();

  // La caja de texto es sticky: se baja la página entera para que no tape el último mensaje.
  useEffect(() => {
    if (messages.length > 0 || pending) {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    }
  }, [messages.length, pending]);

  if (status.state === "loading") {
    return <p className="muted center">Comprobando el asistente…</p>;
  }
  if (status.state === "error") {
    return <p className="error card">{status.message}</p>;
  }
  if (status.state === "not-configured") {
    return <NotConfigured status={status} />;
  }

  return (
    <section className="section assistant-view">
      <div className="section-header">
        <h1>Asistente</h1>
        {messages.length > 0 ? (
          <button type="button" className="link-button" onClick={reset}>
            Nueva conversación
          </button>
        ) : null}
      </div>

      {messages.length === 0 ? (
        <div className="chat-empty">
          <p>
            Pregúntame por tu forma, tu recuperación o tus entrenos. Uso tus
            datos de Intervals.icu; tus datos de Strava no se envían a la IA.
          </p>
          <ul className="chat-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion}>
                <button type="button" onClick={() => send(suggestion)}>
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="chat-messages" aria-live="polite">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              {...message}
              onProposalUpdate={updateProposal}
            />
          ))}
          {pending ? (
            <li className="chat-message assistant pending">Pensando…</li>
          ) : null}
        </ol>
      )}

      {error ? (
        <p className="error chat-error" role="alert">
          {error}{" "}
          <button type="button" className="link-button" onClick={retry}>
            Reintentar
          </button>
        </p>
      ) : null}

      <p className="attribution">
        Datos de Garmin a través de Intervals.icu. Modelo: {status.model}
      </p>
      <ChatComposer disabled={pending} onSend={send} />
    </section>
  );
}
