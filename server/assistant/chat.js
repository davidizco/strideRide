import { chatCompletion } from "../ai/client.js";
import { buildSystemPrompt } from "./prompt.js";
import { workoutProposals } from "./proposals.js";
import { TOOL_DEFINITIONS, runTool } from "./tools.js";

const MAX_TOOL_ROUNDS = 3;

/**
 * Responde a la conversación (`history`: mensajes `user`/`assistant` ya validados).
 * El modelo puede consultar datos con las tools de lectura; en la última ronda se le obliga a responder.
 */
export async function answer(history) {
  const system = await buildSystemPrompt();
  const messages = [{ role: "system", content: system.content }, ...history];
  const proposals = [];
  const propose = (args, today) => {
    if (proposals.length) {
      return { error: "Solo se permite una propuesta por respuesta." };
    }
    const proposal = workoutProposals.create(args, today);
    proposals.push(proposal);
    return {
      proposalId: proposal.id,
      status: proposal.status,
      workout: proposal.workout,
    };
  };
  // Tras la primera respuesta se fija el modelo: las firmas de razonamiento no valen entre modelos.
  let model;

  for (let round = 0; ; round++) {
    const lastRound = round === MAX_TOOL_ROUNDS;
    const response = await chatCompletion({
      messages,
      tools: TOOL_DEFINITIONS,
      toolChoice: lastRound ? "none" : "auto",
      model,
    });
    const { message } = response;
    model = response.model;

    if (lastRound || !message.tool_calls?.length) {
      return {
        reply:
          message.content?.trim() ||
          (proposals.length
            ? "La propuesta está lista para revisar. Aún no se ha publicado."
            : "No tengo respuesta."),
        model,
        proposals,
      };
    }

    // Se reenvía el mensaje tal cual: Gemini 3 necesita sus firmas de razonamiento.
    messages.push(message);
    for (const call of message.tool_calls) {
      const result = await runTool(
        call.function?.name,
        call.function?.arguments,
        system.today,
        propose,
      );
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
}
