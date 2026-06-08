export const DEFAULT_MODEL = "gemini-3-flash-preview";

export interface ModelOption {
  id: string;
  label: string;
  provider: "gemini" | "openrouter";
  tier: "free" | "paid";
}

export const MODEL_OPTIONS: ModelOption[] = [
  // Gemini (default, uses your own API keys)
  {
    id: "gemini-3-flash-preview",
    label: "Gemini 3 Flash",
    provider: "gemini",
    tier: "free",
  },

  // OpenRouter - Major Paid Models
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    provider: "openrouter",
    tier: "paid",
  },
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    provider: "openrouter",
    tier: "paid",
  },
  {
    id: "anthropic/claude-opus-4.8",
    label: "Claude Opus 4.8",
    provider: "openrouter",
    tier: "paid",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    provider: "openrouter",
    tier: "paid",
  },

  // OpenRouter - Free Tier Models
  {
    id: "moonshotai/kimi-k2.6:free",
    label: "Kimi K2.6",
    provider: "openrouter",
    tier: "free",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Nemotron 3 Ultra",
    provider: "openrouter",
    tier: "free",
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    provider: "openrouter",
    tier: "free",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "Nemotron 3 Super",
    provider: "openrouter",
    tier: "free",
  },
];

export function getModelOption(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === modelId);
}

export function isGeminiModel(modelId: string): boolean {
  const option = getModelOption(modelId);
  return option ? option.provider === "gemini" : modelId.startsWith("gemini");
}
