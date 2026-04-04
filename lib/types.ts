export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral';

export type ModelId =
  | 'claude-haiku'
  | 'claude-sonnet'
  | 'gpt-nano'
  | 'gpt-mini'
  | 'gemini-lite'
  | 'gemini-flash'
  | 'mistral-small'
  | 'mistral-nemo';

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;          // display name e.g. "Anthropic"
  providerKey: ModelProvider; // for API routing
  apiSlug: string;           // actual model identifier sent to the API
  color: string;
  envKey: string;
  inputCostPerM: number;
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
  apiKeys: Partial<Record<ModelProvider, string>>;
}
