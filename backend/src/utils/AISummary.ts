import ai from "../config/AIConfig";

export interface DualMemoryOutput {
  compressedFacts: string;
  recursiveSummary: string;
}

export async function generateDualMemoryOutput(
  messageToCompress: any[],
  previousSummary: string | null
): Promise<DualMemoryOutput> {
  const fullConversation = messageToCompress
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const systemPrompt = `You are a dual-output memory processor for an AI learning companion called Dendrites.

You will receive a batch of conversation messages and produce TWO separate memory outputs in a single response.

PREVIOUS CONVERSATION SUMMARY (for Layer 2 merge):
${previousSummary || "None — this is the first batch."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — YOU MUST FOLLOW THIS EXACTLY:

Your response must contain exactly two sections separated by this exact delimiter:
===LAYER3_FACTS===
[your Layer 3 content here]
===LAYER2_SUMMARY===
[your Layer 2 content here]

No other text. No preamble. No explanation. Just the two sections.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYER 3 INSTRUCTIONS (Compressed Facts for Vector Storage):
Extract searchable memory facts from the AI responses below.
These facts will be retrieved via semantic search when the user asks related questions.
Write each fact so it directly answers the kind of question the user would ask.

LAYER 3 RULES:
1. WRITE AS ANSWERS, NOT NARRATION
   BAD:  "The AI explained how photosynthesis works"
   GOOD: "Photosynthesis converts light energy into glucose using chlorophyll in two stages: light-dependent reactions in the thylakoid and the Calvin cycle in the stroma"

2. NAME THE SUBJECT EXPLICITLY IN EVERY FACT
   Never use pronouns. Every fact must be independently understandable with zero context.
   BAD:  "It works by triggering when the threshold is exceeded"
   GOOD: "The Dendrites compression system triggers when message count exceeds the sliding window threshold of 20"

3. EXTRACT WHAT THE USER LEARNED OR DECIDED
   BAD:  "The user learned about historical events"
   GOOD: "The Treaty of Versailles 1919 imposed 132 billion gold marks in reparations on Germany"

4. DENSE SPECIFICS — include numbers, names, mechanisms wherever they exist

5. LONG-FORM CONTENT — never reproduce verbatim, describe as a retrievable fact
   GOOD: "User implemented JWT refresh using axios interceptor pattern — queues failed requests during token rotation"

6. ONE IDEA PER FACT — split unrelated concepts into separate facts

7. [VERY IMPORTANT] SEPARATOR: Use ||| between every fact
8. OUTPUT: Facts only. Zero labels. Zero newlines between facts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYER 2 INSTRUCTIONS (Recursive Conversation Summary):
Merge the new conversation batch into the previous summary to produce one updated summary
representing the full conversation state.

LAYER 2 RULES:
1. KEEP — Always preserve:
   - The user's current goals and what they are trying to learn or build
   - All decisions made (technical, creative, academic, or otherwise)
   - Key concepts explained and understood
   - Problems encountered and how they were resolved
   - Any specific names, terms, values, or references that matter

2. REMOVE — Always discard:
   - Questions that have now been answered
   - Confusion that has been resolved
   - Any information the new messages have made outdated
   - Conversational filler already captured in prior summary

3. CONTRADICT — If new messages override something in the old summary:
   - Keep ONLY the newest version
   - Delete the outdated version entirely
   - Do not keep both

4. DOMAIN NEUTRAL — This conversation could be about anything:
   coding, mathematics, history, science, law, literature, medicine, language learning.
   Treat all domains equally.

5. FORMAT — Output exactly 5 to 8 bullet points:
   - Start each bullet with one of these tags:
     [GOAL] [DECISION] [CONCEPT] [PROGRESS] [PROBLEM] [CONTEXT]
   - Each bullet must be self-contained and independently readable
   - Never use pronouns — name subjects explicitly
   - Be dense and specific — include numbers, names, key terms
   - No introductory sentence, no preamble

6. LENGTH — Each bullet 1 to 2 sentences maximum. Dense and high-signal.

7. TOKEN BUDGET — Your Layer 2 output MUST stay under 800 tokens.
   If forced to trim, drop in this order:
   [CONTEXT] → [CONCEPT] → [PROBLEM] → [PROGRESS]
   Never drop [GOAL] or [DECISION].`;

  const userContent = `CONVERSATION BATCH:\n${fullConversation}`;

  const response = await ai.models.generateContent({
    model: "gemma-4-31b-it",
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + userContent }],
      },
    ],
  });

  const rawOutput = response.text?.trim() || "";
  return parseDualOutput(rawOutput);
}

function parseDualOutput(raw: string): DualMemoryOutput {
  const layer3Marker = "===LAYER3_FACTS===";
  const layer2Marker = "===LAYER2_SUMMARY===";

  const layer3Start = raw.indexOf(layer3Marker);
  const layer2Start = raw.indexOf(layer2Marker);

  
  if (layer3Start !== -1 && layer2Start !== -1) {
    const compressedFacts = raw
      .slice(layer3Start + layer3Marker.length, layer2Start)
      .trim();

    const recursiveSummary = raw
      .slice(layer2Start + layer2Marker.length)
      .trim();

    return { compressedFacts, recursiveSummary };
  }


  console.warn("Dual output markers not found — attempting fallback parse");

  const bulletStart = raw.search(/\[GOAL\]|\[DECISION\]|\[CONCEPT\]/);

  if (bulletStart !== -1) {
    return {
      compressedFacts: raw.slice(0, bulletStart).trim(),
      recursiveSummary: raw.slice(bulletStart).trim(),
    };
  }


  console.warn("Could not parse dual output — treating as facts only");
  return {
    compressedFacts: raw,
    recursiveSummary: "",
  };
}
