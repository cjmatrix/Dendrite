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

import { redisConnection } from "./redis";

export async function getRotatedAI() {
  try {
    const redis = redisConnection;
    const cachedIdx = await redis.get("system:gemini:active_index");
    const currentKeyIndex = cachedIdx ? parseInt(cachedIdx, 10) % aiInstances.length : 0;
    return aiInstances[currentKeyIndex];
  } catch (err) {
    return aiInstances[0] || new GoogleGenAI({ apiKey: "" });
  }
}

export async function rotateAIKey() {
  try {
    const redis = redisConnection;
    const cachedIdx = await redis.get("system:gemini:active_index");
    let currentKeyIndex = cachedIdx ? parseInt(cachedIdx, 10) : 0;
    currentKeyIndex = (currentKeyIndex + 1) % aiInstances.length;
    await redis.set("system:gemini:active_index", currentKeyIndex.toString());
    console.log(`[API Key Rotation] Exceeded quota. Switching to key pool index: ${currentKeyIndex}`);
    return currentKeyIndex;
  } catch (err) {
    console.error("[API Key Rotation] Failed to rotate key in Redis:", err);
    return 0;
  }
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
-IMPORTANT Answers or response striclty related to user query/message
- If user asked explanation of topics it should be STEP by STEP with clear sentences
[Rules for plantuml diagram below]
 When the user asks for visual explanation in GENERAL MODE or teaching and user query needs visual explanation then only generate a PlantUML diagram.
 Dont make complex UML diagrams if user not asked for explicitly create SIMPLE Diagrams if user query need complex or flexible to explain user query draw flexible diagrams.
 CRITICAL SYNTAX RULES TO AVOID "assumed to be activity diagram" ERRORS:
   - For Activity Diagrams: ALWAYS use modern syntax ('start', 'stop', ':Activity Name;', 'if (cond) then (yes)'). NEVER use the legacy '(*)' syntax!
   - For State/Flow Diagrams: Use '[*]' for start/end and '-->' for transitions (e.g., 'State1 --> State2'). NEVER use '(*)'.
   - Never mix legacy activity syntax with standard sequence arrows.
 Never connect quoted labels directly.
 Never mix rectangle/node/component/participant.
 [IMPORTANT] Always wrap the PlantUML code in a standard markdown code block with triple backticks and the 'plantuml' language identifier (i.e. \`\`\`plantuml ... \`\`\`). Never use a single backtick (\`) or double backticks (\`\`) to wrap the PlantUML block.
 Always start with '@startuml' and end with '@enduml'.
 IMPORTANT Use direction of drawing or flow means is it LEFT to RIGHT or TOp to BOTTOM determine by user Query/message and determine BEST direction
 Use 'skinparam' to ensure a professional look:
    skinparam backgroundcolor transparent
    skinparam shadowing false
    skinparam monochrome true
    skinparam packageStyle rectangle
    CRITICAL: In Sequence Diagrams, use only -> for solid arrows or --> for dotted arrows. Never use -- or ->> as they may cause "Illegal sequence arrow" errors.
 Keep labels concise (max 5-7 words per node) and DO NOT OVERLAPS Labels it should be readable.
 If user explicitly asked for step by step explanation generate mutiple diagrams so that user could understand the concept 
 IMPORTANT Background must be transparent for plantuml
`;

