import ai from "../config/AIConfig";

async function generateCodeDescription(code: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
           text: `Summarize this ${language} code in 1 sentence (max 30 words). Mention function names, variable names, and what it does. No markdown:\n\n${code}`,
          },
        ],
      },
    ],
  });

  return response.text?.trim() || "";
}

export default generateCodeDescription;
