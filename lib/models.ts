import type { ModelConfig, ModelId, ModelProvider } from './types';

// All slugs verified against @ai-sdk/* package type definitions (2.0.x).
// Pricing per 1 million tokens (USD). "~" = estimated from tier.
export const MODELS: Record<ModelId, ModelConfig> = {

  // ── Anthropic — no Opus ────────────────────────────────────────────────────
  'claude-haiku': {
    id: 'claude-haiku',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-3-5-haiku-20241022',       // latest alias broken in API
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
    apiSlug: 'claude-haiku-4-5',               // stable alias
    color: '#7C3AED',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 0.80,
    outputCostPerM: 4.00,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 3.7',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-3-7-sonnet-latest',       // 3-5-sonnet no longer listed in SDK
    color: '#6D28D9',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 3.00,
    outputCostPerM: 15.00,
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    providerKey: 'anthropic',
    apiSlug: 'claude-sonnet-4-6',              // latest Sonnet as of SDK 2.0.x
    color: '#6D28D9',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 3.00,
    outputCostPerM: 15.00,
  },

  // ── OpenAI — no o1/o3/GPT-4-turbo ─────────────────────────────────────────
  'gpt-nano': {
    id: 'gpt-nano',
    name: 'GPT-5.4 Nano',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-5.4-nano',                   // released 2026-03-17
    color: '#10B981',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.60,
  },
  'gpt-mini': {
    id: 'gpt-mini',
    name: 'GPT-4.1 Nano',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-4.1-nano',                   // released 2025-04-14, stable
    color: '#10B981',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.10,
    outputCostPerM: 0.40,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'gpt-4.1',                        // released 2025-04-14, replaces 4o as flagship
    color: '#059669',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 2.00,
    outputCostPerM: 8.00,
  },
  'o4-mini': {
    id: 'o4-mini',
    name: 'o3-mini',
    provider: 'OpenAI',
    providerKey: 'openai',
    apiSlug: 'o3-mini',                        // o4-mini not yet in SDK types; o3-mini is latest reasoning
    color: '#059669',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 1.10,
    outputCostPerM: 4.40,
  },

  // ── Google — no Ultra ──────────────────────────────────────────────────────
  'gemini-lite': {
    id: 'gemini-lite',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.0-flash',               // 2.0-flash-lite discontinued for new users
    color: '#3B82F6',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.10,
    outputCostPerM: 0.40,
  },
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.5-flash-lite',
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
    apiSlug: 'gemini-2.5-flash',
    color: '#2563EB',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.15,
    outputCostPerM: 0.60,
  },
  'gemini-25-pro': {
    id: 'gemini-25-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    providerKey: 'google',
    apiSlug: 'gemini-2.5-pro',
    color: '#1D4ED8',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 1.25,
    outputCostPerM: 10.00,
  },

  // ── Mistral — no Large ─────────────────────────────────────────────────────
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
    name: 'Ministral 8B',
    provider: 'Mistral AI',
    providerKey: 'mistral',
    apiSlug: 'ministral-8b-latest',            // mistral-saba-2502 not in current SDK types
    color: '#EA580C',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.10,
    outputCostPerM: 0.10,
  },
  'mistral-medium': {
    id: 'mistral-medium',
    name: 'Mistral Medium',
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
