export type ModelId = 'claude' | 'gpt4' | 'gemini' | 'mistral';

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;
  color: string;
  description: string;
  envKey: string;
  /** Cost per 1 million input tokens in USD */
  inputCostPerM: number;
  /** Cost per 1 million output tokens in USD */
  outputCostPerM: number;
}

export type DebatePhase = 'positions' | 'critiques' | 'debate' | 'synthesis';

export type SessionPhase = 'config' | 'running' | 'complete';

export type SSEEvent =
  | { type: 'phase_change'; phase: DebatePhase }
  | { type: 'position_complete'; model: ModelId; modelName: string; summary: string; fullText: string }
  | { type: 'critique_message'; fromModel: ModelId; fromModelName: string; aboutModel: ModelId; aboutModelName: string; text: string; isDisagreement: boolean }
  | { type: 'disagreement_detected'; description: string }
  | { type: 'debate_message'; model: ModelId; modelName: string; text: string; debateRound: number }
  | { type: 'token_usage'; model: ModelId; phase: string; inputTokens: number; outputTokens: number; costUsd: number }
  | { type: 'consensus_complete'; consensus: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ConsensusRequest {
  topic: string;
  models: ModelId[];
  apiKeys: Partial<Record<ModelId, string>>;
}
