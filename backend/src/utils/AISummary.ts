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
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: queryText }],
      },
    ],
  });

  return response.text?.trim() || "";
}

export async function generateRecursiveSummary(
  previousSummary: string | null,
  newMessageBatch: any[],
) {
  const textMessages = newMessageBatch
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const queryText = `You are an expert at maintaining conversational state. Your task is to update the "Global Conversation Summary" based on a new batch of messages.

CURRENT SUMMARY (State so far):
${previousSummary || "None - This is the start of the conversation."}

NEW MESSAGES (Latest context):
${textMessages}

TASK:
Produce a NEW updated summary that incorporates the most important developments from the new messages into the old summary. 

RULES:
1. FOCUS on: Goals, Decisions made, Technical Stack, and Key Progress.
2. REMOVE: Outdated information or resolved questions.
3. FORMAT: Use concise bullet points or a very short, dense paragraph.
4. TONE: Be objective and high-signal. No conversational filler.

Updated Summary:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: queryText }],
      },
    ],
  });

  return response.text?.trim() || "No summary available.";
}

export default generateCompressedChat;
