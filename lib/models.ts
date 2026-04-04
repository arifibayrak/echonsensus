import type { ModelConfig, ModelId, ModelProvider } from './types';

// Pricing per 1 million tokens (USD). Sources: official pricing pages as of early 2026.
// Models marked "~" are preview — price estimated from tier.
export const MODELS: Record<ModelId, ModelConfig> = {

  // ── Anthropic ──────────────────────────────────────────────────────────────
  'claude-haiku': {
    id: 'claude-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-3-5-haiku-20241022',
    color: '#7C3AED',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 0.80,
    outputCostPerM: 4.00,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 3.5',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-3-5-sonnet-20241022',
    color: '#6D28D9',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 3.00,
    outputCostPerM: 15.00,
  },

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  'gpt-nano': {
    id: 'gpt-nano',
    name: 'GPT-5.4 Nano',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-5.4-nano',
    color: '#10B981',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.60,
  },
  'gpt-mini': {
    id: 'gpt-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-4o-mini',
    color: '#059669',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.60,
  },

  // ── Google ─────────────────────────────────────────────────────────────────
  'gemini-lite': {
    id: 'gemini-lite',
    name: 'Gemini Flash Lite',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-3.1-flash-lite-preview',
    color: '#3B82F6',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.075,
    outputCostPerM: 0.30,
  },
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.0-flash',
    color: '#2563EB',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.10,
    outputCostPerM: 0.40,
  },

  // ── Mistral ────────────────────────────────────────────────────────────────
  'mistral-small': {
    id: 'mistral-small',
    name: 'Mistral Small',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'mistral-small-latest',
    color: '#F97316',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.20,
    outputCostPerM: 0.60,
  },
  'mistral-nemo': {
    id: 'mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'open-mistral-nemo',
    color: '#EA580C',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.15,
  },
};

export const MODEL_LIST = Object.values(MODELS);

export const PROVIDER_ORDER: ModelProvider[] = ['anthropic', 'openai', 'google', 'mistral'];

export const MODELS_BY_PROVIDER: Record<ModelProvider, ModelConfig[]> = {
  anthropic: MODEL_LIST.filter((m) => m.providerKey === 'anthropic'),
  openai:    MODEL_LIST.filter((m) => m.providerKey === 'openai'),
  google:    MODEL_LIST.filter((m) => m.providerKey === 'google'),
  mistral:   MODEL_LIST.filter((m) => m.providerKey === 'mistral'),
};

export function calcCost(modelId: ModelId, inputTokens: number, outputTokens: number): number {
  const m = MODELS[modelId];
  return (inputTokens / 1_000_000) * m.inputCostPerM + (outputTokens / 1_000_000) * m.outputCostPerM;
}
