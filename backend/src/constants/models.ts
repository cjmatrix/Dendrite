export const MAIN_CHAT_MODEL = "gemini-3-flash-preview";

export const QUICK_CHAT_MODEL = "gemini-2.5-flash";
// export const CHAT_SUMMARY_MODEL = "gemma-4-31b-it";
// export const CHAT_SUMMARY_MODEL = "gemma-4-26b-a4b-it";
export const CHAT_SUMMARY_MODEL = "gemini-3.1-flash-lite";
export const CODE_DESCRIPTION_MODEL = "gemma-4-31b-it";
export const INTERNET_SEARCH_ROUTER_MODEL = "gemini-2.5-flash-lite";

export const DEFAULT_MODEL = MAIN_CHAT_MODEL;

export interface ModelOption {
  id: string;
  label: string;
  provider: "gemini" | "openrouter" | "groq";
  tier: "free" | "paid";
}

export const MODEL_OPTIONS: ModelOption[] = [
  
  {
    id: "gemini-3-flash-preview",
    label: "Gemini 3.5 Flash",
    provider: "gemini",
    tier: "free",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "gemini",
    tier: "free",
  },


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

  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    provider: "groq",
    tier: "free",
  },
  {
    id: "groq/openai/gpt-oss-120b",
    label: "GPT OSS 120B (Groq)",
    provider: "groq",
    tier: "free",
  },
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

export function getProviderKey(modelId: string | undefined): "google" | "anthropic" | "openai" | "openrouter" | "groq" | "mistral" {
  if (!modelId) {
    return "google";
  }
  const lower = modelId.toLowerCase();
  if (lower.startsWith("gemini") || lower.includes("google/") || lower.startsWith("gemma")) {
    return "google";
  }
  if (lower.includes("anthropic/") || lower.includes("claude")) {
    return "anthropic";
  }
  if (lower.includes("openai/") || lower.includes("gpt")) {
    return "openai";
  }
  if (lower.includes("groq/")) {
    return "groq";
  }
  if (lower.includes("mistral/") || lower.includes("mistralai/")) {
    return "mistral";
  }
  return "openrouter";
}
