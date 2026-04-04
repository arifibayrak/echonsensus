export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral';

export type ModelId =
  // Anthropic
  | 'claude-haiku'
  | 'claude-haiku-4'
  | 'claude-sonnet'
  | 'claude-sonnet-4'
  // OpenAI
  | 'gpt-nano'
  | 'gpt-mini'
  | 'gpt-4o'
  | 'o4-mini'
  // Google
  | 'gemini-lite'
  | 'gemini-flash'
  | 'gemini-25-flash'
  | 'gemini-25-pro'
  // Mistral
  | 'mistral-nemo'
  | 'mistral-small'
  | 'mistral-saba'
  | 'mistral-medium';

export interface ModelConfig {
  id: ModelId;
  name: string;
  provider: string;
  providerKey: ModelProvider;
  apiSlug: string;
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
