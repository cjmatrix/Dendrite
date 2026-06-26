export interface IGeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface IGeminiContent {
  role: "user" | "model";
  parts: IGeminiPart[];
}

export interface IGeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface IAIStreamChunk {
  text?: string;
  usageMetadata?: IGeminiUsageMetadata;
}
