import { useState } from "react";

const MAX_CHARS = 2000;

export default function ChatComposer({ disabled, onSend }) {
  const [text, setText] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (disabled || !text.trim()) return;
    onSend(text);
    setText("");
  };

  // Intro envía; Mayús + Intro añade una línea.
  const onKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      submit(event);
    }
  };

  return (
    <form className="chat-composer" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="chat-input">
        Mensaje para el asistente
      </label>
      <textarea
        id="chat-input"
        rows={1}
        maxLength={MAX_CHARS}
        placeholder="Pregunta por tu forma, tus entrenos…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        type="submit"
        className="button"
        disabled={disabled || !text.trim()}
      >
        Enviar
      </button>
    </form>
  );
}
