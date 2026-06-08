import ai, { getRotatedAI, rotateAIKey, aiInstances } from "../config/AIConfig";
import { IGlobalProfile } from "../domain/auth/entities/User";
import { Type, GoogleGenAI } from "@google/genai";
import { getActiveBYOKKeyIndex, rotateBYOKKeyIndex } from "./byokKeysHelper";



export interface SummaryItem {
  type: "GOAL" | "DECISION" | "CONCEPT" | "PROGRESS" | "PROBLEM" | "CONTEXT";
  content: string;
}

export interface ProfileDelta {
  user_name?: string;
  location?: string;
  role?: string;
  expertise_level?: string;
  response_style?: string;
  tech_stack?: string[];
  environment?: string[];
  current_projects?: string[];
  long_term_goals?: string[];
  constraints?: string[];
  user_preferences?: string[];
  entities?: string[];
}

export interface TripleMemoryOutput {
  compressedFacts: string[];
  recursiveSummary: SummaryItem[];
  profileDelta: ProfileDelta;
}


function cleanJsonResponse(text: string): string {
  const trimmed = text.trim();
  const withoutFences = trimmed.replace(/```(json)?\n?/g, "").trim();
  const jsonMatch = withoutFences.match(/\{[\s\S]*\}/);

  return jsonMatch ? jsonMatch[0] : withoutFences;
}


const MEMORY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    compressedFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },

    recursiveSummary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              "GOAL",
              "DECISION",
              "CONCEPT",
              "PROGRESS",
              "PROBLEM",
              "CONTEXT",
            ],
          },
          content: {
            type: Type.STRING,
          },
        },
        required: ["type", "content"],
      },
    },

    profileDelta: {
      type: Type.OBJECT,
      properties: {
        user_name: { type: Type.STRING },
        location: { type: Type.STRING },
        role: { type: Type.STRING },
        expertise_level: { type: Type.STRING },
        response_style: { type: Type.STRING },

        tech_stack: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        environment: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        current_projects: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        long_term_goals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        constraints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        user_preferences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },

        entities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    },
  },

  required: [
    "compressedFacts",
    "recursiveSummary",
    "profileDelta",
  ],
};



function buildSystemPrompt(
  existingProfile: IGlobalProfile | null,
  previousSummary: string | null,
): string {
  const profileText = existingProfile
    ? JSON.stringify(existingProfile, null, 2)
    : "No profile exists yet.";

  return `You are a triple-output memory processor for an AI learning companion called Dendrites.

You will read a conversation batch and produce THREE memory outputs:

1. compressedFacts
2. recursiveSummary
3. profileDelta

The output structure is enforced by the provided JSON schema. Do not invent additional fields.

EXISTING USER PROFILE (already known — do NOT repeat these in profileDelta):
${profileText}

PREVIOUS CONVERSATION SUMMARY (for recursive merge):
${previousSummary || "None — this is the first batch."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL RULES

1. Prioritize information that improves future conversations.
2. Preserve important decisions, goals, learned concepts, preferences, constraints, and project information.
3. Avoid conversational filler.
4. Never copy large portions of conversation verbatim.
5. Compress information while preserving meaning.
6. If new information contradicts old information, keep only the newest version.
7. Be domain neutral: coding, science, history, mathematics, law, medicine, language learning, business, and other domains should all be treated equally.
8. Extract information only from evidence present in the conversation.
9. Do not hallucinate user attributes or facts.
10. If information is uncertain, do not include it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPRESSEDFACTS INSTRUCTIONS

Purpose:
Store highly searchable facts for semantic retrieval and vector search.

Extract facts primarily from assistant/model responses because those represent knowledge delivered to the user.

User messages may be used when they contain decisions, goals, preferences, requirements, project information, or confirmed facts.

Rules:

1. Write facts as direct answers, not narration.

BAD:
"The AI explained BullMQ."

GOOD:
"BullMQ uses Redis as a backing store and persists jobs across application restarts."

2. Explicitly name the subject.

BAD:
"It retries failed jobs."

GOOD:
"BullMQ retries failed jobs according to configured retry policies."

3. Include important names, numbers, mechanisms, technologies, algorithms, frameworks, products, and decisions.

4. One idea per fact.

5. Convert long explanations into compact retrievable knowledge.

BAD:
"The assistant described how JWT refresh works."

GOOD:
"JWT refresh token rotation can be implemented using an Axios interceptor queue that retries failed requests after token renewal."

6. Avoid vague wording.

BAD:
"The system is faster."

GOOD:
"Voyage AI cloud embeddings eliminate local embedding model RAM consumption."

7. Facts must be self-contained and understandable without additional context.

8. Exclude conversational filler, greetings, acknowledgements, and temporary discussion.

9. Generate only high-signal facts useful for future retrieval.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECURSIVESUMMARY INSTRUCTIONS

Purpose:
Maintain a compact evolving summary of the conversation history.

Merge new information into the previous summary.

Preserve:

* User goals
* User decisions
* Architectural choices
* Technical approaches
* Key concepts learned
* Important project context
* Significant problems encountered
* Resolutions and outcomes
* Relevant names, technologies, products, values, and references

Remove:

* Resolved confusion
* Repeated questions
* Obsolete information
* Conversational filler
* Information already superseded by newer decisions

Contradictions:

* Keep only the newest version.
* Remove outdated versions completely.

Summary Item Rules:

1. Produce between 5 and 8 summary items when possible.

2. Every item must contain type and content.

3. Allowed types: GOAL, DECISION, CONCEPT, PROGRESS, PROBLEM, CONTEXT

4. Each content value must:
   * be self-contained
   * be specific
   * be concise
   * contain important names and technical details when relevant
   * avoid pronouns whenever a subject can be named directly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROFILEDELTA INSTRUCTIONS

Purpose:
Update the persistent user profile.

Extract only NEW information discovered in the current conversation.

Never repeat information already present in the existing profile.

If nothing new is learned, return an empty profileDelta object.

Fields that may be updated (Extract strictly according to these definitions):

1. user_name (string): The user's explicitly stated real name or preferred nickname (e.g., "Mikey", "Al Muhammed Yazeen").
2. location (string): Any physical geographical location, city, state, country, or specific time zone the user mentions being from or currently in (e.g., "Kochi, Kerala", "IST").
3. role (string): The user's professional job title, academic status, or primary occupation (e.g., "Engineering Student", "Full-Stack Developer").
4. expertise_level (string): Infer overall proficiency only when strong evidence exists. MUST be one of: "beginner", "intermediate", "advanced", "expert".
5. response_style (string): How the user prefers the AI to format, deliver, or scope its answers (e.g., "JavaScript-centric explanations", "Concise and direct", "Use visual analogies").
6. tech_stack (array): Programming languages, frameworks, databases, or core libraries the user consistently builds with (e.g., ["JavaScript", "React", "Node.js", "MongoDB"]). Do NOT include temporary tools they are just asking a one-off question about.
7. environment (array): Operating systems, terminal environments, or deployment infrastructure (e.g., ["Ubuntu 24.04", "Linux", "Docker"]).
8. current_projects (array): The specific names and brief context of active applications, platforms, or repositories the user is actively building (e.g., ["Dendrite Chat IDE", "NexGen PC Builder"]).
9. long_term_goals (array): Overarching ambitions, career objectives, or learning goals that span multiple sessions (e.g., ["Mastering system design", "Preparing for technical interviews"]).
10. constraints (array): Hard limits, strict rules, or boundaries the user must follow for their projects or learning (e.g., ["Free-tier APIs only", "Must use functional programming"]).
11. user_preferences (array): Personal tastes, hobbies, or consistent workflow habits (e.g., ["Enjoys story-driven RPGs like Elden Ring", "Prefers avoiding built-in mutating array methods"]).
12. entities (array): Specific names of real-world people, friends, colleagues, or organizations the user interacts with (e.g., ["Melvin (Friend)", "Aswathi M V (Colleague)"]).

CRITICAL RULE FOR FIELDS: If a user mentions a detail that fits perfectly into one of these definitions, you MUST extract it, even if it seems like a minor conversational detail.

Rules:

1. Only include fields that require updates.

2. For array fields: include only newly discovered items.

3. Do not return entire arrays from the existing profile.

4. Do not duplicate information already known.

5. Infer expertise level only when strong evidence exists.

Allowed expertise values: beginner, intermediate, advanced, expert

If no new profile information is discovered, return an empty profileDelta object.`;
}

export async function generateTripleMemoryOutput(
  messageToCompress: any[],
  previousSummary: string | null,
  existingProfile: IGlobalProfile | null,
  keys?: string[],
  userId?: string
): Promise<TripleMemoryOutput> {
  const fullConversation = messageToCompress
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(existingProfile, previousSummary);
  const userContent = `CONVERSATION BATCH:\n${fullConversation}`;

  let response;
  let attempts = 0;
  
  const isByok = keys && keys.length > 0;
  const instances = isByok ? keys.map(k => new GoogleGenAI({ apiKey: k })) : [];
  
  let currentIdx = 0;
  if (isByok && userId && instances.length > 0) {
    currentIdx = await getActiveBYOKKeyIndex(userId, "gemini");
    currentIdx = currentIdx % instances.length;
  }
  const totalAttempts = isByok ? instances.length : aiInstances.length;

  while (attempts < totalAttempts) {
    try {
      const activeAi = isByok ? instances[currentIdx] : await getRotatedAI();
      response = await activeAi.models.generateContent({
        model: "gemma-4-31b-it",
        contents: [
          {
            role: "user",
            parts: [{ text: userContent }],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: MEMORY_SCHEMA,
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });
      break;
    } catch (error: any) {
      if (
        error.status === 429 ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED")
      ) {
        if (isByok) {
          if (userId) {
            currentIdx = await rotateBYOKKeyIndex(userId, instances.length, "gemini");
          } else {
            currentIdx = (currentIdx + 1) % instances.length;
          }
        } else {
          await rotateAIKey();
        }
        attempts++;
        continue;
      }
      throw error;
    }
  }

  if (!response) {
    throw new Error("Failed to generate memory summary: All instances exhausted");
  }

  const rawText = response.text?.trim() || "{}";
  console.log(rawText)
  const cleanText = cleanJsonResponse(rawText);

  try {
    const parsed = JSON.parse(cleanText) as TripleMemoryOutput;
    return {
      compressedFacts: parsed.compressedFacts || [],
      recursiveSummary: parsed.recursiveSummary || [],
      profileDelta: parsed.profileDelta || {},
    };
  } catch (err) {
    console.error("Failed to parse triple memory JSON output:", err);
    console.error("Raw output:", rawText.substring(0, 500));
    return {
      compressedFacts: [],
      recursiveSummary: [],
      profileDelta: {},
    };
  }
}
