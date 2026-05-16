import ai from "../config/AIConfig";

async function generateCompressedChat(messageToCompress: any[]) {

const textMessages = messageToCompress
  .filter(m => m.role === 'model')
  .map(m => m.content)
  .join("\n\n---\n\n");

 const queryText = `You are extracting searchable memory facts 
from a conversation for vector database storage.

These facts will be retrieved later using semantic search 
when the user asks related questions. Write each fact so 
it directly answers the kind of question the user would 
ask — not as a narrator describing what happened in 
the conversation.

EXTRACTION RULES:

1. WRITE AS ANSWERS, NOT NARRATION
   The fact should sound like the answer to a question,
   not like a description of a conversation.
   
   BAD:  "The AI explained how photosynthesis works"
   GOOD: "Photosynthesis converts light energy into glucose 
          using chlorophyll in two stages: light-dependent 
          reactions in the thylakoid and the Calvin cycle 
          in the stroma"
   
   BAD:  "The AI explained that BullMQ uses Redis"
   GOOD: "BullMQ uses Redis as its backing store — jobs 
          persist across server restarts"

2. NAME THE SUBJECT EXPLICITLY IN EVERY FACT
   Never use pronouns. Every fact must be independently 
   understandable with zero context.
   
   BAD:  "It works by triggering when the threshold is exceeded"
   GOOD: "The compression system triggers when the message 
          count exceeds the sliding window threshold of 20"

3. EXTRACT WHAT THE USER LEARNED OR DECIDED
   Capture the user's understanding, goals, decisions, 
   and any confusion that got resolved.
   
   GOOD: "User was confused about the difference between 
          mitosis and meiosis — key distinction is that 
          meiosis produces 4 genetically unique haploid 
          cells while mitosis produces 2 identical diploid cells"
   
   GOOD: "User decided to structure their essay argument 
          around economic causes of WW1 rather than 
          political causes after discussing both"

4. DENSE SPECIFICS OVER VAGUE STATEMENTS
   Include numbers, names, mechanisms, 
   specific terms wherever they exist.
   
   BAD:  "The user learned about a historical event"
   GOOD: "The Treaty of Versailles 1919 imposed 132 billion 
          gold marks in reparations on Germany — user is 
          studying this as a cause of WW2"

5. LONG-FORM CONTENT (essays, code, documents)
   Never reproduce verbatim. Describe as a retrievable fact.
   
   BAD:  [entire essay or code block]
   GOOD: "User wrote an argumentative essay on climate 
          policy taking the position that carbon tax is 
          more effective than cap-and-trade systems — 
          main argument anchored on price certainty"
   
   GOOD: "User implemented JWT refresh using an axios 
          interceptor pattern — queues failed requests 
          during token rotation"

6. ONE IDEA PER FACT
   Do not combine multiple unrelated concepts in one fact.
   Split them.
   
   BAD:  "Photosynthesis uses chlorophyll and the user 
          also asked about cellular respiration"
   GOOD: "Photosynthesis uses chlorophyll to absorb light 
          energy primarily in red and blue wavelengths"
          |||
         "User asked about cellular respiration as a 
          comparison to photosynthesis — both involve 
          electron transport chains but in opposite 
          energy directions"

7. SEPARATOR: Use ||| between every fact
8. OUTPUT: Facts only. Zero labels, zero preamble, 
   zero newlines between facts.

Messages:
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

export async function generateRecursiveSummary(
  previousSummary: string | null,
  newMessageBatch: any[],
) {
  const textMessages = newMessageBatch
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const queryText = `You are a conversational state manager for an AI learning companion. Your job is to maintain a precise, up-to-date summary of an ongoing conversation so the AI can stay oriented across long sessions.

CURRENT SUMMARY (State so far):
${previousSummary || "None — this is the first batch."}

NEW MESSAGES (Latest batch):
${textMessages}

YOUR TASK:
Merge the new messages into the current summary to produce one updated summary that represents the full conversation state.

RULES:

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
   coding, mathematics, history, science, law, literature, medicine,
   language learning, or any other field.
   Treat all domains equally. Do not assume a technical context.

5. FORMAT — Output exactly 5 to 8 bullet points:
   - Start each bullet with one of these tags:
     [GOAL] [DECISION] [CONCEPT] [PROGRESS] [PROBLEM] [CONTEXT]
   - Each bullet must be self-contained and independently readable
   - Never use pronouns like it, they, this, that — name subjects explicitly
   - Be dense and specific — include numbers, names, and key terms
   - No introductory sentence, no closing sentence, no preamble

6. LENGTH — Each bullet should be 1 to 2 sentences maximum.
   Dense and high-signal. Not a paragraph.

7. TOKEN BUDGET: Your entire output MUST stay under 800 tokens.
   If forced to trim, drop in this order (drop last tag first):
   [CONTEXT] → [CONCEPT] → [PROBLEM] → [PROGRESS]
   Never drop [GOAL] or [DECISION].

GOOD OUTPUT EXAMPLE (coding):
[GOAL] User is building a production-grade RAG pipeline for a coding education SaaS called Dendrites targeting CS students and PhD researchers.
[DECISION] User chose BullMQ over direct async processing for the document embedding pipeline because BullMQ provides retry logic and backpressure handling.
[CONCEPT] Semantic chunking detects topic boundaries by comparing cosine similarity of left and right embedding windows — a drop below 0.45 triggers a split.
[PROGRESS] Layer 1 sliding window and Layer 2 rolling summary are complete — currently implementing Layer 3 vector RAG with Qdrant.
[PROBLEM] Upstash Redis does not support BullMQ blocking commands — resolved by using Redis Cloud free tier for queues and Upstash only for caching.

GOOD OUTPUT EXAMPLE (non-coding):
[GOAL] User is writing a 3000-word argumentative essay on whether the Treaty of Versailles was the primary cause of World War 2.
[DECISION] User decided to anchor the argument on economic causes rather than political ones after comparing reparations burden to nationalist sentiment.
[CONCEPT] The war guilt clause Article 231 forced Germany to accept full responsibility — this is distinct from the reparations amount of 132 billion gold marks.
[PROGRESS] Introduction and first two body paragraphs complete — currently drafting the counterargument section addressing nationalist causes.
[CONTEXT] User's professor requires at least 4 primary sources — user has identified 3 so far including Keynes Economic Consequences of the Peace.

Output ONLY the bullet points. No "Updated Summary:" label. No explanation.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
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
