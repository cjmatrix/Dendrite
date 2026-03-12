import ai from "../config/AIConfig";
import { logAIQuery, logCodeBlockTokens } from "./logger";

async function generateCodeDescription(code: string, language: string) {
 
  logCodeBlockTokens(code, language);

  const queryText = `Summarize this ${language} code in 1 sentence (max 30 words). Mention function names, variable names, and what it does. No markdown:\n\n${code}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [{ text: queryText }],
      },
    ],
  });

  
  if (response.usageMetadata) {
    logAIQuery(queryText, response.usageMetadata);
  }

  return response.text?.trim() || "";
}

export default generateCodeDescription;
