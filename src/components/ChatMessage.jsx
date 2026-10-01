import WorkoutProposal from "./WorkoutProposal.jsx";

export default function ChatMessage({
  role,
  content,
  proposals = [],
  onProposalUpdate,
}) {
  return (
    <>
      <li className={`chat-message ${role}`}>
        <span className="visually-hidden">
          {role === "user" ? "Tú:" : "Asistente:"}
        </span>
        {content}
      </li>
      {role === "assistant"
        ? proposals.map((proposal) => (
            <WorkoutProposal
              key={proposal.id}
              initialProposal={proposal}
              onUpdate={onProposalUpdate}
            />
          ))
        : null}
    </>
  );
}
