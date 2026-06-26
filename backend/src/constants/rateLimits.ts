

export type UserTier = "free" | "pro" | "enterprise" | "byok";


export const MODEL_TOKEN_LIMITS: Record<string, Record<UserTier, number>> = {

  "gemini-3-flash-preview": {
    free: 200_000,
    pro: 1_000_000,
    enterprise: 5_000_000,
    byok: -1,
  },
  "gemini-2.5-flash": {
    free: 400_000,
    pro: 2_000_000,
    enterprise: 10_000_000,
    byok: -1,
  },


  "openai/gpt-5.5": {
    free: 0,             
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "openai/gpt-5.4": {
    free: 0,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "anthropic/claude-opus-4.8": {
    free: 0,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "anthropic/claude-sonnet-4.6": {
    free: 0,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },

 
  "moonshotai/kimi-k2.6:free": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "nvidia/nemotron-3-ultra-550b-a55b:free": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "google/gemma-4-31b-it:free": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "nvidia/nemotron-3-super-120b-a12b:free": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "groq/llama-3.3-70b-versatile": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
  "groq/openai/gpt-oss-120b": {
    free: 100_000,
    pro: 500_000,
    enterprise: 2_000_000,
    byok: -1,
  },
};


export const DEFAULT_MODEL_TOKEN_LIMITS: Record<UserTier, number> = {
  free: 50_000,
  pro: 300_000,
  enterprise: 1_000_000,
  byok: -1,
};


export interface CountLimits {
  quickChats: number;
  recallCards: number;
  p5Visualizations: number;
  documentUploads: number;
  agentWorkspaces: number;
  mainQueries: number;
  imageUploads: number;
}

export const DAILY_COUNT_LIMITS: Record<UserTier, CountLimits> = {
  free: {
    mainQueries: 50,
    quickChats: 20,
    recallCards: 10,
    p5Visualizations: 5,
    documentUploads: 3,
    agentWorkspaces: 10,
    imageUploads: 5,
  },
  pro: {
    mainQueries: 300,
    quickChats: 100,
    recallCards: 50,
    p5Visualizations: 30,
    documentUploads: 20,
    agentWorkspaces: 10,
    imageUploads: 3,
  },
  enterprise: {
    mainQueries: 1500,
    quickChats: 500,
    recallCards: 200,
    p5Visualizations: 100,
    documentUploads: 100,
    agentWorkspaces: 50,
    imageUploads: 150,
  },
  byok: {
    mainQueries: -1,
    quickChats: -1,
    recallCards: -1,
    p5Visualizations: -1,
    documentUploads: -1,
    agentWorkspaces: -1,
    imageUploads: -1,
  },
};

export const UPLOAD_SIZE_LIMITS: Record<UserTier, { document: number; image: number }> = {
  free: {
    document: 5 * 1024 * 1024, // 5MB
    image: 2 * 1024 * 1024,    // 2MB
  },
  pro: {
    document: 20 * 1024 * 1024, // 20MB
    image: 10 * 1024 * 1024,    // 10MB
  },
  enterprise: {
    document: 100 * 1024 * 1024, // 100MB
    image: 50 * 1024 * 1024,     // 50MB
  },
  byok: {
    document: 100 * 1024 * 1024, // 100MB
    image: 50 * 1024 * 1024,     // 50MB
  },
};

export type CountLimitCategory = keyof CountLimits;
