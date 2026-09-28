export default function ChatMessage({ role, content }) {
  return (
    <li className={`chat-message ${role}`}>
      <span className="visually-hidden">
        {role === "user" ? "Tú:" : "Asistente:"}
      </span>
      {content}
    </li>
  );
}
