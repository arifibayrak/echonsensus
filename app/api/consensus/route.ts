import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import type { ConsensusRequest, ModelId, SSEEvent } from '@/lib/types';
import { MODELS, calcCost } from '@/lib/models';
import {
  buildPositionPrompt,
  buildCritiquePrompt,
  buildDebatePrompt,
  buildDisagreementDescriptionPrompt,
  buildConsensusCheckPrompt,
  buildConsensusPrompt,
} from '@/lib/prompts';

const MAX_DEBATE_ROUNDS = 5;

function getModel(modelId: ModelId, apiKeys: Partial<Record<ModelId, string>>) {
  const key = apiKeys[modelId] ?? process.env[MODELS[modelId].envKey] ?? '';
  switch (modelId) {
    case 'claude':
      return createAnthropic({ apiKey: key })('claude-haiku-4-5-20251001');
    case 'gpt4':
      return createOpenAI({ apiKey: key })('gpt-5.4-nano');
    case 'gemini':
      return createGoogleGenerativeAI({ apiKey: key })('gemini-3.1-flash-lite-preview');
    case 'mistral':
      return createMistral({ apiKey: key })('mistral-small');
  }
}

const enc = new TextEncoder();
function encode(event: SSEEvent): Uint8Array {
  return enc.encode(`data: ${JSON.stringify(event)}\n\n`);
}

// Wraps generateText and emits a token_usage event after each call
async function tracked(
  send: (e: SSEEvent) => void,
  modelId: ModelId,
  phase: string,
  params: Parameters<typeof generateText>[0]
): Promise<string> {
  const result = await generateText(params);
  const input = result.usage?.inputTokens ?? 0;
  const output = result.usage?.outputTokens ?? 0;
  const costUsd = calcCost(modelId, input, output);
  send({ type: 'token_usage', model: modelId, phase, inputTokens: input, outputTokens: output, costUsd });
  return result.text;
}

// Parse "On ModelName: AGREE/DISAGREE: ..." out of a critique response
function parseCritiques(
  text: string,
  fromModel: ModelId,
  otherModels: Array<{ modelId: ModelId; modelName: string }>
) {
  return otherModels
    .filter((m) => m.modelId !== fromModel)
    .map((other) => {
      const escaped = other.modelName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?:^|\\n)On\\s+${escaped}\\s*:\\s*([\\s\\S]*?)(?=\\n\\nOn\\s+|\\nOn\\s+|$)`,
        'i'
      );
      const match = text.match(regex);
      if (!match) return null;

      const critiqueText = match[1].trim();
      if (!critiqueText) return null;

      const isDisagreement = /^DISAGREE/i.test(critiqueText);
      const cleanText = critiqueText.replace(/^(AGREE|DISAGREE)\s*:\s*/i, '').trim();
      return { other, isDisagreement, cleanText };
    })
    .filter(Boolean) as Array<{
    other: { modelId: ModelId; modelName: string };
    isDisagreement: boolean;
    cleanText: string;
  }>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ConsensusRequest;
  const { topic, models, apiKeys } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => controller.enqueue(encode(event));

      try {
        // ── Phase 1: Initial Positions ────────────────────────────────
        send({ type: 'phase_change', phase: 'positions' });

        type PositionEntry = { modelId: ModelId; modelName: string; summary: string; fullText: string };
        const positionResults = await Promise.allSettled(
          models.map(async (modelId): Promise<PositionEntry> => {
            try {
              const text = await tracked(send, modelId, 'positions', {
                model: getModel(modelId, apiKeys),
                prompt: buildPositionPrompt(modelId, topic),
                maxOutputTokens: 450,
              });
              const summaryMatch = text.match(/SUMMARY:\s*([\s\S]+)/i);
              const summary = summaryMatch ? summaryMatch[1].trim() : text.slice(0, 300);
              const fullText = text.replace(/\n*SUMMARY:[\s\S]*/i, '').trim();
              send({ type: 'position_complete', model: modelId, modelName: MODELS[modelId].name, summary, fullText });
              return { modelId, modelName: MODELS[modelId].name, summary, fullText };
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Error';
              send({ type: 'position_complete', model: modelId, modelName: MODELS[modelId].name, summary: `[Error: ${msg}]`, fullText: '' });
              return { modelId, modelName: MODELS[modelId].name, summary: `[Error: ${msg}]`, fullText: '' };
            }
          })
        );

        const positions: PositionEntry[] = positionResults
          .filter((r): r is PromiseFulfilledResult<PositionEntry> => r.status === 'fulfilled')
          .map((r) => r.value);

        // ── Phase 2: Cross-Critiques ──────────────────────────────────
        send({ type: 'phase_change', phase: 'critiques' });

        let hasDisagreement = false;
        const allCritiqueTexts: string[] = [];

        await Promise.allSettled(
          models.map(async (modelId) => {
            const others = positions.filter((p) => p.modelId !== modelId);
            try {
              const text = await tracked(send, modelId, 'critiques', {
                model: getModel(modelId, apiKeys),
                prompt: buildCritiquePrompt(
                  modelId,
                  topic,
                  others.map((o) => ({ modelName: o.modelName, summary: o.summary }))
                ),
                maxOutputTokens: 300,
              });
              allCritiqueTexts.push(`${MODELS[modelId].name}:\n${text}`);

              const parsed = parseCritiques(text, modelId, others);
              for (const item of parsed) {
                if (item.isDisagreement) hasDisagreement = true;
                send({
                  type: 'critique_message',
                  fromModel: modelId,
                  fromModelName: MODELS[modelId].name,
                  aboutModel: item.other.modelId,
                  aboutModelName: item.other.modelName,
                  text: item.cleanText,
                  isDisagreement: item.isDisagreement,
                });
              }
            } catch {
              // skip failed critique
            }
          })
        );

        // ── Disagreement detection ────────────────────────────────────
        type DebateMsgEntry = { modelId: ModelId; modelName: string; text: string; debateRound: number };
        const debateMessages: DebateMsgEntry[] = [];

        if (hasDisagreement) {
          const synthesizerId: ModelId = models.includes('claude') ? 'claude' : models[0];
          let disagreementDescription = 'The models have different views.';
          try {
            const text = await tracked(send, synthesizerId, 'disagreement', {
              model: getModel(synthesizerId, apiKeys),
              prompt: buildDisagreementDescriptionPrompt(topic, allCritiqueTexts.join('\n\n')),
              maxOutputTokens: 80,
            });
            disagreementDescription = text.trim();
          } catch {
            /* use default */
          }
          send({ type: 'disagreement_detected', description: disagreementDescription });

          // ── Phase 3: Debate ─────────────────────────────────────────
          send({ type: 'phase_change', phase: 'debate' });

          for (let round = 1; round <= MAX_DEBATE_ROUNDS; round++) {
            const roundResults = await Promise.allSettled(
              models.map(async (modelId): Promise<DebateMsgEntry> => {
                const history = debateMessages.map((m) => ({ modelName: m.modelName, text: m.text }));
                try {
                  const text = await tracked(send, modelId, `debate-round-${round}`, {
                    model: getModel(modelId, apiKeys),
                    prompt: buildDebatePrompt(modelId, topic, history, disagreementDescription),
                    maxOutputTokens: 120,
                  });
                  send({ type: 'debate_message', model: modelId, modelName: MODELS[modelId].name, text, debateRound: round });
                  return { modelId, modelName: MODELS[modelId].name, text, debateRound: round };
                } catch (err) {
                  const msg = err instanceof Error ? err.message : 'Error';
                  return { modelId, modelName: MODELS[modelId].name, text: `[${msg}]`, debateRound: round };
                }
              })
            );

            const roundMsgs = roundResults
              .filter((r): r is PromiseFulfilledResult<DebateMsgEntry> => r.status === 'fulfilled')
              .map((r) => r.value);
            debateMessages.push(...roundMsgs);

            // Check if consensus reached after every round (including round 1)
            try {
              const allHistory = debateMessages
                .map((m) => `${m.modelName} (round ${m.debateRound}): ${m.text}`)
                .join('\n');
              const text = await tracked(send, synthesizerId, `consensus-check-${round}`, {
                model: getModel(synthesizerId, apiKeys),
                prompt: buildConsensusCheckPrompt(topic, allHistory),
                maxOutputTokens: 10,
              });
              if (text.trim().toUpperCase().startsWith('YES')) break;
            } catch {
              /* continue */
            }
          }
        }

        // ── Phase 4: Final Synthesis ──────────────────────────────────
        send({ type: 'phase_change', phase: 'synthesis' });
        const synthesizerId: ModelId = models.includes('claude') ? 'claude' : models[0];
        try {
          const text = await tracked(send, synthesizerId, 'synthesis', {
            model: getModel(synthesizerId, apiKeys),
            prompt: buildConsensusPrompt(
              topic,
              positions.map((p) => ({ modelName: p.modelName, fullText: p.fullText || p.summary })),
              debateMessages.map((m) => ({ modelName: m.modelName, text: m.text }))
            ),
            maxOutputTokens: 700,
          });
          send({ type: 'consensus_complete', consensus: text });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error';
          send({ type: 'consensus_complete', consensus: `[Synthesis failed: ${msg}]` });
        }

        send({ type: 'done' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
