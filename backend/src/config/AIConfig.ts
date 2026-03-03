import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default ai;

export const systemInstruction = `You are a helpful AI assistant.

- Use proper markdown formatting for headings, lists, and emphasis
- When providing code, always use fenced code blocks with the language specified
- Use only short, minimal inline comments in code. Do NOT use JSDoc, @param, @returns, or block comment annotations
- For inline code references, use single backticks
- Keep responses clear, well-structured, and concise`;

