export interface ModelOption {
  id: string;
  label: string;
  tier: "free" | "paid";
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "DEFAULT", label: "Gemini 3 Flash", tier: "free" },

  // Major Paid 
  { id: "openai/gpt-5.5", label: "GPT-5.5", tier: "paid" },
   { id: "gemini-2.5-flash", label: "Gemini 2 Flash", tier: "free" },
  { id: "openai/gpt-5.4", label: "GPT-5.4", tier: "paid" },
  { id: "anthropic/claude-opus-4.8", label: "Claude Opus 4.8", tier: "paid" },
  { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", tier: "paid" },

  // Free Tier
  { id: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", tier: "free" },
  { id: "groq/openai/gpt-oss-120b", label: "GPT OSS 120B (Groq)", tier: "free" },
  { id: "moonshotai/kimi-k2.6:free", label: "Kimi K2.6", tier: "free" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra", tier: "free" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B", tier: "free" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "Nemotron 3 Super", tier: "free" },
];

export const DEFAULT_MODEL = "DEFAULT";
