import type { ModelConfig, ModelId, ModelProvider } from './types';

// Pricing per 1 million tokens (USD).
// Sources: official pricing pages as of early 2026.
// "~" = estimated from model tier / not yet officially confirmed.
export const MODELS: Record<ModelId, ModelConfig> = {

  // ── Anthropic (no Opus) ────────────────────────────────────────────────────
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
  'claude-haiku-4': {
    id: 'claude-haiku-4',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-haiku-4-5-20251001',
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
  'claude-sonnet-4': {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-sonnet-4-5',
    color: '#6D28D9',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 3.00,
    outputCostPerM: 15.00,
  },

  // ── OpenAI (no o1/o3/GPT-4-turbo full) ────────────────────────────────────
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
    color: '#10B981',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.60,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-4o',
    color: '#059669',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 5.00,
    outputCostPerM: 15.00,
  },
  'o4-mini': {
    id: 'o4-mini',
    name: 'o4-mini',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'o4-mini',
    color: '#059669',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 1.10,   // ~ reasoning model pricing
    outputCostPerM: 4.40,
  },

  // ── Google (no Ultra) ──────────────────────────────────────────────────────
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
    color: '#3B82F6',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.10,
    outputCostPerM: 0.40,
  },
  'gemini-25-flash': {
    id: 'gemini-25-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.5-flash-preview-04-17',
    color: '#2563EB',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.15,   // ~ Flash tier
    outputCostPerM: 0.60,
  },
  'gemini-25-pro': {
    id: 'gemini-25-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.5-pro-preview-03-25',
    color: '#1D4ED8',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 1.25,   // ~ Pro tier ≤200k tokens
    outputCostPerM: 10.00,
  },

  // ── Mistral (no Large) ─────────────────────────────────────────────────────
  'mistral-nemo': {
    id: 'mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'open-mistral-nemo',
    color: '#F97316',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.15,
  },
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
  'mistral-saba': {
    id: 'mistral-saba',
    name: 'Mistral Saba',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'mistral-saba-2502',
    color: '#EA580C',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.20,
    outputCostPerM: 0.60,
  },
  'mistral-medium': {
    id: 'mistral-medium',
    name: 'Mistral Medium 3',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'mistral-medium-latest',
    color: '#EA580C',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.40,
    outputCostPerM: 2.00,
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
