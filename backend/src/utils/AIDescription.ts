import ai from "../config/AIConfig";
import { logAIQuery, logCodeBlockTokens } from "./logger";

export async function generateBatchCodeDescriptions(
  blocks: { id: string; code: string; language: string }[]
): Promise<{ id: string; description: string }[]> {
  

  blocks.forEach(b => logCodeBlockTokens(b.code, b.language));

  const snippetsText = blocks
    .map((b, i) => `[Snippet ${i + 1} - ID: ${b.id} - Language: ${b.language}]\n${b.code}`)
    .join("\n\n---\n\n");

  const queryText = `Summarize each of the following ${blocks.length} code snippets in exactly 1 sentence (max 30 words).
Mention key function/variable names.
Return the results as a JSON object where keys are the Snippet IDs and values are the descriptions.
IMPORTANT: Return ONLY valid JSON with no markdown, no code fences, no additional text, no explanations.

CODE SNIPPETS:
${snippetsText}`;

  const response = await ai.models.generateContent({
  model: "gemma-4-31b-it",
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
    
    return blocks.map(b => ({
      id: b.id,
      description: rawJson[b.id] || "No description generated."
    }));
  } catch (err) {
    console.error("Failed to parse batch AI response:", err);
    return blocks.map(b => ({ id: b.id, description: "Error generating description." }));
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
