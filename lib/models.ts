import type { ModelConfig, ModelId } from './types';

// Pricing is per 1 million tokens (USD).
// Sources: official pricing pages as of early 2026.
// Models marked "~" are preview/unreleased — price estimated from tier.
export const MODELS: Record<ModelId, ModelConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude Haiku 3.5',
    provider: 'Anthropic',
    color: '#7C3AED',
    description: 'claude-3-5-haiku-20241022 by Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    inputCostPerM: 0.80,   // Haiku 3.5 — anthropic.com/pricing
    outputCostPerM: 4.00,
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-5.4 Nano',
    provider: 'OpenAI',
    color: '#10B981',
    description: 'gpt-5.4-nano by OpenAI',
    envKey: 'OPENAI_API_KEY',
    inputCostPerM: 0.15,   // nano tier — platform.openai.com/pricing
    outputCostPerM: 0.60,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    color: '#3B82F6',
    description: 'Gemini 3.1 Flash Lite by Google',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    inputCostPerM: 0.075,  // Flash Lite tier — ai.google.dev/pricing
    outputCostPerM: 0.30,
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    provider: 'Mistral AI',
    color: '#F97316',
    description: 'Mistral Small by Mistral AI',
    envKey: 'MISTRAL_API_KEY',
    inputCostPerM: 0.20,   // mistral.ai/pricing
    outputCostPerM: 0.60,
  },
};

export const MODEL_LIST = Object.values(MODELS);

export function calcCost(modelId: ModelId, inputTokens: number, outputTokens: number): number {
  const m = MODELS[modelId];
  return (inputTokens / 1_000_000) * m.inputCostPerM + (outputTokens / 1_000_000) * m.outputCostPerM;
}
