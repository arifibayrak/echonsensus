import type { ModelConfig, ModelId } from './types';

export const MODELS: Record<ModelId, ModelConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    color: '#7C3AED',
    description: 'claude-3-5-haiku by Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10B981',
    description: 'GPT-4o mini by OpenAI',
    envKey: 'OPENAI_API_KEY',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    color: '#3B82F6',
    description: 'Gemini 2.0 Flash by Google',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    provider: 'Mistral AI',
    color: '#F97316',
    description: 'Mistral Small by Mistral AI',
    envKey: 'MISTRAL_API_KEY',
  },
};

export const MODEL_LIST = Object.values(MODELS);
