import ai, { getRotatedAI, rotateAIKey, aiInstances } from "../config/AIConfig";
import { GoogleGenAI } from "@google/genai";
import { logAIQuery, logCodeBlockTokens } from "./logger";
import { getActiveBYOKKeyIndex, rotateBYOKKeyIndex } from "./byokKeysHelper";
import { CODE_DESCRIPTION_MODEL } from "../constants/models";

export async function generateBatchCodeDescriptions(
  blocks: { id: string; code: string; language: string }[],
  keys?: string[],
  userId?: string
): Promise<{ results: { id: string; description: string }[]; usageMetadata?: any }> {
  

  blocks.forEach(b => logCodeBlockTokens(b.code, b.language));

  const snippetsText = blocks
    .map((b, i) => `[Snippet ${i + 1} - ID: ${b.id} - Language: ${b.language}]\n${b.code}`)
    .join("\n\n---\n\n");

  const queryText = `Summarize each code snippet for semantic retrieval and RAG indexing.

For each snippet generate exactly ONE sentence (max 50 words) that includes:
- The primary purpose of the code.
- Important function, class, variable, endpoint, or component names.
- Key technologies, libraries, frameworks, or patterns used.
- The type of problem it solves.
- Terms a developer would naturally search for to find this code.

Focus on retrieval usefulness rather than code explanation.

Return a JSON object where:
- Keys are Snippet IDs.
- Values are the generated descriptions.

IMPORTANT:
- Return ONLY valid JSON.
- No markdown.
- No code fences.
- No explanations.
- No extra text.

CODE SNIPPETS:
${snippetsText}`;


  let response;
  let attempts = 0;
  const isByok = keys && keys.length > 0;
  const instances = isByok ? keys.map(k => new GoogleGenAI({ apiKey: k })) : [];
  
  let currentIdx = 0;
  if (isByok && userId && instances.length > 0) {
    currentIdx = await getActiveBYOKKeyIndex(userId, "gemini");
    currentIdx = currentIdx % instances.length;
  }
  const totalAttempts = isByok ? instances.length : aiInstances.length;

  while (attempts < totalAttempts) {
    try {
      const activeAi = isByok ? instances[currentIdx] : await getRotatedAI();
      response = await activeAi.models.generateContent({
        model: CODE_DESCRIPTION_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: queryText }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              result: { type: "string" }
            },
            required: ["result"]
          }
        }
      });
      break;
    } catch (error: any) {
      if (
        error.status === 429 ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        if (isByok) {
          if (userId) {
            currentIdx = await rotateBYOKKeyIndex(userId, instances.length, "gemini");
          } else {
            currentIdx = (currentIdx + 1) % instances.length;
          }
        } else {
          await rotateAIKey();
        }
        attempts++;
        continue;
      }
      throw error;
    }
  }

  if (!response) {
    throw new Error("Failed to generate batch code descriptions: All instances exhausted");
  }

  console.log(response.text)
  if (response.usageMetadata) {
    logAIQuery(`Batch Description (${blocks.length} blocks)`, response.usageMetadata);
  }
  console.log(response.text)
  try {
  
    let cleanText = (response.text || "{}").trim();
    
   
    cleanText = cleanText.replace(/```(json)?\n?/g, '').trim();
    
    
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    let rawJson = JSON.parse(cleanText || "{}");
    
 
    if (rawJson.result) {
      if (typeof rawJson.result === "string") {
        try {
          rawJson = JSON.parse(rawJson.result);
        } catch {
         
        }
      } else {
        rawJson = rawJson.result;
      }
    }
    
    const results = blocks.map(b => ({
      id: b.id,
      description: rawJson[b.id] || "No description generated."
    }));
    return { results, usageMetadata: response.usageMetadata };
  } catch (err) {
    console.error("Failed to parse batch AI response:", err);
    const results = blocks.map(b => ({ id: b.id, description: "Error generating description." }));
    return { results, usageMetadata: response?.usageMetadata };
  }
}



async function generateCodeDescription(code: string, language: string) {
  const queryText = `Summarize this ${language} code in 1 sentence (max 30 words). Mention function names, variable names, and what it does. No markdown:\n\n${code}`;

  const response = await ai.models.generateContent({
    model: "gemma-4-31b-it",
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
