export type ModelProvider = 'anthropic' | 'openai' | 'google' | 'mistral';

export type ModelId =
  // Anthropic
  | 'claude-haiku'
  // OpenAI
  | 'gpt-nano'
  | 'gpt-mini'
  | 'gpt-4o'
  | 'o4-mini'
  // Google
  | 'gemini-flash'
  | 'gemini-25-flash'
  | 'gemini-25-pro'
  // Mistral
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

export type DebatePhase = 'echo' | 'positions' | 'critiques' | 'debate' | 'synthesis';
export type SessionPhase = 'config' | 'echo_analyzing' | 'echo_confirm' | 'running' | 'complete';

export interface EchoAnalysis {
  facts: string[];
  debatableTopics: string[];
  attributes: string[];
  refinedPrompt: string;
  followUpQuestions: string[];
}

// ─── Component-level data shapes (shared across arena sub-components) ─────────

export interface PositionEntry {
  model: ModelId;
  modelName: string;
  summary: string;
  fullText: string;
}

export interface CritiqueEntry {
  fromModel: ModelId;
  fromModelName: string;
  aboutModel: ModelId;
  aboutModelName: string;
  text: string;
  isDisagreement: boolean;
}

export interface DebateMsgEntry {
  model: ModelId;
  modelName: string;
  text: string;
  debateRound: number;
}

export type SSEEvent =
  | { type: 'phase_change'; phase: DebatePhase }
  | { type: 'position_complete'; model: ModelId; modelName: string; summary: string; fullText: string }
  | { type: 'critique_message'; fromModel: ModelId; fromModelName: string; aboutModel: ModelId; aboutModelName: string; text: string; isDisagreement: boolean }
  | { type: 'disagreement_detected'; description: string }
  | { type: 'debate_message'; model: ModelId; modelName: string; text: string; debateRound: number }
  | { type: 'token_usage'; model: ModelId; phase: string; inputTokens: number; outputTokens: number; costUsd: number }
  | { type: 'consensus_complete'; consensus: string }
  | { type: 'echo_analysis'; analysis: EchoAnalysis }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ConsensusRequest {
  topic: string;
  models: ModelId[];
  apiKeys: Partial<Record<ModelProvider, string>>;
  echoAnalysis?: EchoAnalysis;
}
