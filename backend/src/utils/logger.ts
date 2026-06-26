import fs from "fs";
import path from "path";
import ai from "../config/AIConfig";

const logFilePath = path.join(__dirname, "../../logs/ai_usage.log");
const logDir = path.dirname(logFilePath);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}


export function logAIQuery(query: string, usageMetadata: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }) {
  const timestamp = new Date().toISOString();

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


export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

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
