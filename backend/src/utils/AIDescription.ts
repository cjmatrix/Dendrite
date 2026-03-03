import ai from "../config/AIConfig";

async function generateCodeDescription(code: string, language: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Summarize what this ${language} code does in one short sentence (max 20 words). No markdown, no code, just a plain description.\n\n${code}`,
          },
        ],
      },
    ],
  });

  return response.text?.trim() || "";
}

export default generateCodeDescription;
