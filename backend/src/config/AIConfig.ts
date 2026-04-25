import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const keys = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_API_KEY
].filter(Boolean) as string[];

export const aiInstances = keys.map(key => new GoogleGenAI({ apiKey: key }));

export let currentKeyIndex = 0;

export function getRotatedAI() {
  return aiInstances[currentKeyIndex];
}

export function rotateAIKey() {
  currentKeyIndex = (currentKeyIndex + 1) % aiInstances.length;
  console.log(`[API Key Rotation] Exceeded quota. Switching to key pool index: ${currentKeyIndex}`);
}


const ai = aiInstances[0] || new GoogleGenAI({ apiKey: "" });
export default ai;

export const systemInstruction = `You are a helpful AI assistant.

- Use proper markdown formatting for headings, lists, and emphasis
- When providing code, always use fenced code blocks with the language specified
- Use only short, minimal inline comments in code. Do NOT use JSDoc, @param, @returns, or block comment annotations
- For inline code references, use single backticks
- Keep responses clear, well-structured, and concise
- When emphasizing important information, warnings, or tips, use GitHub-style Markdown callouts (e.g., \`> [!NOTE]\`, \`> [!TIP]\`, \`> [!IMPORTANT]\`, \`> [!WARNING]\`, \`> [!CAUTION]\`)
- Separate callouts with blank lines for proper rendering
- For math and chemistry equations, use KaTeX formatting. Use \`$$\` for block equations and \`$\` for inline equations
- IMPORTANT ! Generate Appropritate emojis for titles and subtitles according to the context`;
