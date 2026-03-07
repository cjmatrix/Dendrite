import fs from "fs";
import path from "path";
import ai from "../config/AIConfig";

const logFilePath = path.join(__dirname, "../../logs/ai_usage.log");
const logDir = path.dirname(logFilePath);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Logs the user query and the token usage returned by the AI.
 */
export function logAIQuery(query: string, usageMetadata: any) {
  const timestamp = new Date().toISOString();
  // Safe extraction of tokens (works with @google/genai response structures)
  const promptTokens = usageMetadata?.promptTokenCount || 0;
  const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = usageMetadata?.totalTokenCount || 0;

  const abstractQuery =
    query.length > 100 ? query.substring(0, 100) + "..." : query;

  const logMessage = `[${timestamp}] QUERY: "${abstractQuery}" | PROMPT_TOKENS: ${promptTokens} | RESPONSE_TOKENS: ${candidatesTokens} | TOTAL: ${totalTokens}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) console.error("Failed to write to ai_usage.log:", err);
  });
}

/**
 * Estimates the token count locally without making API calls.
 * A standard industry estimation is roughly 4 characters per token.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Counts the tokens for a given text snippet (e.g., code blocks) locally.
 * It also logs the count to the file.
 */
export function logCodeBlockTokens(code: string, language: string): number {
  try {
    const tokenCount = estimateTokenCount(code);
    const timestamp = new Date().toISOString();

    const logMessage = `[${timestamp}] CODE_BLOCK | LANG: ${language} | CHAR_LENGTH: ${code.length} | ESTIMATED_TOKENS: ${tokenCount}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) console.error("Failed to write to ai_usage.log:", err);
    });

    return tokenCount;
  } catch (error) {
    console.error("Token counting failed:", error);
    return 0;
  }
}
