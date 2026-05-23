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

export interface ITokenUsage {
  total: number;
  mainChat: number;
  chatSummary: number;
  compressedChat: number;
  codeDescription: number;
  p5Visualization: number;
  quickChat: number;
  lastResetDate: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl?: string;
  tier: "free" | "pro" | "enterprise";
  tokensUsed: number;
  settings: {
    theme: "light" | "dark" | "system";
    defaultModel: string;
    saveHistory: boolean;
  };
  role:string,
  status:string,
  refreshTokens: string[];
  fcmToken: string[];
  byok_keys: IByokKey[];
  featureUsage: IFeatureUsage;
  globalProfile: IGlobalProfile;
  token_usage: ITokenUsage;
  createdAt?: Date;
  updatedAt?: Date;
}
