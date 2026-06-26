import dotenv from "dotenv";
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role?: string;
  parts?: GeminiPart[];
  text?: string;
}

/**
 * Converts Gemini-format contents[] to OpenAI-format messages[]
 */
function convertContentsToMessages(contents: GeminiContent[]): OpenRouterMessage[] {
  const messages: OpenRouterMessage[] = [];
  let currentRole: "user" | "assistant" | null = null;
  let currentParts: string[] = [];

  const flushMessage = () => {
    if (currentRole && currentParts.length > 0) {
      const textParts = currentParts.join("\n");

      if (textParts) {
        messages.push({
          role: currentRole === "user" ? "user" : "assistant",
          content: textParts,
        });
      }
    }
    currentParts = [];
  };

  for (const item of contents) {
    // Gemini format: { role: "user"|"model", parts: [...] }
    if (item.role && item.parts) {
      flushMessage();
      currentRole = item.role === "model" ? "assistant" : "user";
      currentParts = item.parts
        .map((p) => p.text ?? "")
        .filter(Boolean);
      flushMessage();
    }
    // Flat text part (used by PrepareMessage for system instruction, context, etc.)
    else if (item.text && typeof item.text === "string") {
      if (!currentRole) currentRole = "user";
      currentParts.push(item.text);
    }
  }

  return messages;
}

interface UsageMetadata {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}


export async function streamOpenRouterContent(
  contents: GeminiContent[],
  model: string,
  signal?: AbortSignal,
  systemInstruction?: string,
): Promise<AsyncIterable<{ text: string; usageMetadata?: UsageMetadata }>> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const messages = convertContentsToMessages(contents);
  if (systemInstruction) {
    messages.unshift({
      role: "system",
      content: systemInstruction,
    });
  }
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
      "X-Title": "Dendrites AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  if (!response.body) {
    throw new Error("OpenRouter returned no response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* generateChunks(): AsyncGenerator<{ text: string; usageMetadata?: UsageMetadata }> {
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
              usage?: UsageMetadata;
            };
            const delta = parsed.choices?.[0]?.delta;
            const usage = parsed.usage;

            if (delta?.content) {
              yield {
                text: delta.content,
                ...(usage ? { usageMetadata: usage } : {}),
              };
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  return generateChunks();
}
