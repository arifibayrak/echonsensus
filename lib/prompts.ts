import type { ModelId } from './types';
import { MODELS } from './models';

export function buildPositionPrompt(modelId: ModelId, topic: string): string {
  return `You are ${MODELS[modelId].name} by ${MODELS[modelId].provider}, participating in a multi-AI consensus debate.

Topic: "${topic}"

Write your full position on this topic (150–200 words). Be analytical, specific, and clear.

Then on a new line write:
SUMMARY: [Write exactly 2 sentences capturing the core of your position.]

Your full answer must come first, then the SUMMARY line at the end.`;
}

export function buildCritiquePrompt(
  modelId: ModelId,
  topic: string,
  otherPositions: Array<{ modelName: string; summary: string }>
): string {
  const positions = otherPositions
    .map((p) => `${p.modelName}: ${p.summary}`)
    .join('\n\n');

  const format = otherPositions
    .map((p) => `On ${p.modelName}: AGREE/DISAGREE: [2 sentences explaining why]`)
    .join('\n');

  return `You are ${MODELS[modelId].name}, critiquing other AI models' positions on: "${topic}"

${positions}

For each model, write exactly 2 sentences. Start with "AGREE:" or "DISAGREE:" and explain specifically why.

Use this exact format:
${format}`;
}

export function buildDebatePrompt(
  modelId: ModelId,
  topic: string,
  chatHistory: Array<{ modelName: string; text: string }>,
  disagreementDescription: string
): string {
  const history = chatHistory.length
    ? chatHistory.map((m) => `  ${m.modelName}: ${m.text}`).join('\n')
    : '  (No messages yet — you go first.)';

  // Find the last message from each OTHER model so this model knows what to respond to
  const myName = MODELS[modelId].name;
  const otherLastMessages = Object.values(
    chatHistory
      .filter((m) => m.modelName !== myName)
      .reduce<Record<string, { modelName: string; text: string }>>((acc, m) => {
        acc[m.modelName] = m; // keep latest per model
        return acc;
      }, {})
  );

  const callouts =
    otherLastMessages.length > 0
      ? '\nModels you must respond to this round:\n' +
        otherLastMessages.map((m) => `  ${m.modelName} just said: "${m.text}"`).join('\n')
      : '';

  return `You are ${MODELS[modelId].name} in an active debate about: "${topic}"

Core disagreement to resolve: ${disagreementDescription}

Full debate so far:
${history}
${callouts}

Your task:
1. READ what the other models just said above carefully.
2. Directly ADDRESS at least one specific claim or phrase from another model — quote or paraphrase it.
3. Either: push back with a concrete reason, concede the point if they convinced you, or propose a synthesis that incorporates their idea.

Reply in 1–2 sentences. Start by naming the model you are responding to (e.g. "GPT-4 claims X, but…" or "I agree with Gemini that…").`;
}

export function buildDisagreementDescriptionPrompt(
  topic: string,
  critiquesText: string
): string {
  return `These AI models are debating: "${topic}"

Their critiques of each other:
${critiquesText}

In one clear sentence, what is the main specific point of disagreement between them?`;
}

export function buildConsensusCheckPrompt(
  topic: string,
  allMessages: string
): string {
  return `You are evaluating whether AI models have reached genuine consensus on: "${topic}"

Full debate so far:
${allMessages}

Consensus means: every model has either (a) explicitly agreed with another's conclusion, (b) conceded their main objection, or (c) proposed a synthesis that was accepted. Look for phrases like "I agree", "you're right", "conceding", "that's a fair point", or convergence on the same conclusion.

If the models are still restating their original positions or only partially agreeing, that is NOT consensus.

Answer with only YES or NO.`;
}

export function buildConsensusPrompt(
  topic: string,
  positions: Array<{ modelName: string; fullText: string }>,
  debateMessages: Array<{ modelName: string; text: string }>
): string {
  const positionBlock = positions
    .map((p) => `${p.modelName}: ${p.fullText}`)
    .join('\n\n');

  const debateBlock = debateMessages.length
    ? '\n\nDebate exchanges:\n' + debateMessages.map((m) => `${m.modelName}: ${m.text}`).join('\n')
    : '';

  return `You are producing the final consensus from a multi-AI debate.

Topic: "${topic}"

What the models said:
${positionBlock}${debateBlock}

---

STRICT RULES — violating any of these makes the output useless:
1. Give a DIRECT, CONCRETE answer to the topic question. If the topic is a question, answer it.
2. NEVER use vague filler phrases: "it depends", "there are many perspectives", "it's complex", "you should consider", "various factors", "it is important to note". These are forbidden.
3. Only state what the models ACTUALLY said. Do not invent, speculate, or add information not present above.
4. If models disagreed and did NOT resolve it, state clearly what each side argued — do not pretend they agreed.
5. Use plain, precise language. One meaning per sentence.

Write using EXACTLY this structure:

**Consensus Position**
[The direct answer the models converged on — 2–3 sentences. State it as a fact or conclusion, not a suggestion.]

**What Everyone Agreed On**
• [Specific agreed point, grounded in what was said]
• [Another specific agreed point]
• [Another if applicable]

**Where They Disagreed**
• [Name the models: "Claude argued X; GPT-4 argued Y"]
• [Another unresolved point if applicable — or write "None — full consensus reached" if they agreed on everything]

**Final Synthesis**
[The strongest, most defensible answer combining all views — 3–4 sentences. Concrete. No hedging. Written for a general reader.]`;
}
