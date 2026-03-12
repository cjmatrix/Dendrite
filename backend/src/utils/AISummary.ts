import ai from "../config/AIConfig";

async function generateCompressedChat(messageToCompress: any[]) {
  const textMessages = messageToCompress
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const queryText = `You are an advanced data-compression engine for a conversational AI model. Your task is to analyze the following sequence of chat messages and perform Lossless Semantic Compression.

You must preserve 100% of the core facts, technical logic, user preferences, conclusions, and specific details. You must completely strip away all conversational filler, pleasantries, repetitive formatting, and introductory phrases (e.g., 'Hello', 'As an AI...', 'Here is the summary:', 'You are welcome').

Merge the user's intent directly with the AI's explanation into dense, standalone facts.

CRITICAL RULES for Output Format:

You MUST output a sequence of self-contained facts.
Each fact MUST stand completely independently. Do not use ambiguous pronouns like 'it', 'they', 'this', or 'the previous concept'. Explicitly name the subject in every fact.
You MUST separate every distinct context / fact using the pipe symbol |.
Do not include bullet points, numbers, or newlines.
Good Example Output: The user is studying the mechanics of cellular respiration | The AI explained that ATP synthase acts like a molecular turbine powered by a proton gradient | The user requested a Python script to calculate Fibonacci sequences | The AI provided an iterative Python solution using a while loop to optimize memory.

Messages to compress:
${textMessages}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [{ text: queryText }],
      },
    ],
  });

  return response.text?.trim() || "";
}

export default generateCompressedChat;
