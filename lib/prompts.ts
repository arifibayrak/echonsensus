import type { EchoAnalysis, ModelId } from './types';
import { MODELS } from './models';

export function buildEchoAnalysisPrompt(topic: string): string {
  return `You are an expert debate facilitator. Analyze this user input and return a JSON object.

User input: "${topic}"

Your task:
1. Extract factual, non-debatable claims present in the input (things that are established facts, not opinions).
2. Identify the genuinely debatable aspects — the real questions worth arguing about.
3. Detect any user-specified constraints, attributes, or limitations (e.g. "for a startup", "in 2025", "on a budget").
4. Write a refined, precise debate prompt suitable for a multi-model AI debate. Make it specific and arguable.
5. Generate 1–3 short clarifying questions that, if answered, would make the debate more focused and useful.

Return ONLY valid JSON with exactly this shape — no markdown, no code fences, no explanation:
{
  "facts": ["string", ...],
  "debatableTopics": ["string", ...],
  "attributes": ["string", ...],
  "refinedPrompt": "string",
  "followUpQuestions": ["string", ...]
}

Rules:
- facts: list 0–4 non-controversial statements extracted from the input. Can be empty [].
- debatableTopics: list 2–5 specific, arguable sub-questions or positions. Must not be empty.
- attributes: list 0–3 constraints or scope limiters. Can be empty [].
- refinedPrompt: a single sentence or question that captures the core debate topic clearly.
- followUpQuestions: 1–3 clarifying questions. Never more than 3.`;
}

export function buildPositionPrompt(modelId: ModelId, topic: string, echoAnalysis?: EchoAnalysis): string {
  const debateTopic = echoAnalysis?.refinedPrompt ?? topic;

  const echoContext = echoAnalysis
    ? `\n\nDebate context:
- Established facts (do not dispute these): ${echoAnalysis.facts.length > 0 ? echoAnalysis.facts.join('; ') : 'none'}.
- Focus your argument on these debatable points: ${echoAnalysis.debatableTopics.join(', ')}.
- User constraints to respect: ${echoAnalysis.attributes.length > 0 ? echoAnalysis.attributes.join(', ') : 'none specified'}.`
    : '';

  return `You are ${MODELS[modelId].name} by ${MODELS[modelId].provider}, participating in a multi-AI consensus debate.

Topic: "${debateTopic}"${echoContext}

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

For each model, write exactly 2 sentences. Start with "AGREE:" or "DISAGREE:" (plain text — do NOT add asterisks or markdown) and explain specifically why.

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

  const myName = MODELS[modelId].name;
  const otherLastMessages = Object.values(
    chatHistory
      .filter((m) => m.modelName !== myName)
      .reduce<Record<string, { modelName: string; text: string }>>((acc, m) => {
        acc[m.modelName] = m;
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
6. Do NOT output "---" separators, "NOTE:" prefixes, or any other text outside the four sections below.
7. Do NOT use markdown bold (**) inside section bodies — only use it for the four section headings themselves.

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
