export interface IByokKey {
  provider: "gemini" | "groq" | string;
  encryptedKeys: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeatureUsage {
  visuals: number;
  quickChats: number;
}

export interface IGlobalProfile {
  user_name?: string;
  location?: string;
  role?: string;
  tech_stack: string[];
  expertise_level?: string;
  environment: string[];
  user_preferences: string[];
  response_style?: string;
  current_projects: string[];
  long_term_goals: string[];
  constraints: string[];
  entities: string[];
}

export interface ITokenCategory {
  input: number;
  output: number;
  total: number;
}

export interface IFeatureTokenUsage {
  mainChat: ITokenCategory;
  chatSummary: ITokenCategory;
  codeDescription: ITokenCategory;
  p5Visualization: ITokenCategory;
  quickChat: ITokenCategory;
}

export interface ITokenUsage {
  google: IFeatureTokenUsage;
  anthropic: IFeatureTokenUsage;
  openai: IFeatureTokenUsage;
  openrouter: IFeatureTokenUsage;
  groq: IFeatureTokenUsage;
  mistral: IFeatureTokenUsage;
  lastResetDate: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  billingProvider?: "stripe" | "paddle" | null;
  billingCustomerId?: string;
  billingSubscriptionId?: string;
  tier: "free" | "pro" | "enterprise" | "byok";
  tokensUsed: number;
  settings: {
    global?: boolean;
    inline?: boolean;
    diagram?: boolean;
    saveHistory?: boolean;
    theme?: "light" | "dark" | "system";
    defaultModel?: string;
  };
  role:string,
  status:string,
  fcmToken: string[];
  byok_keys: IByokKey[];
  featureUsage: IFeatureUsage;
  globalProfile: IGlobalProfile;
  token_usage: ITokenUsage;
  createdAt?: Date;
  updatedAt?: Date;
}
