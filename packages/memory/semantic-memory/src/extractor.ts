import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import type { ExtractedFact, SemanticMemoryConfig } from "./types";

export const DEFAULT_FACT_TYPES = [
  "preference", // user preferences, communication styles, tool choices
  "decision", // decisions made or discussed ("we decided to use X")
  "constraint", // limitations, rules, hard restrictions ("never call after 6pm")
  "objective", // goals, targets, desired outcomes ("wants to reach 500 leads/month")
  "task", // pending actions or to-dos ("pending: configure email template")
  "observation", // notable facts about entities, people, or situations
  "relationship", // connections between entities ("Ana Torres manages team X")
] satisfies string[];

const DEFAULT_PROMPT = `You are a fact extraction system for an AI assistant.
Extract factual claims worth remembering across sessions from this conversation.

Fact types to extract:
- preference: user preferences, communication styles, tool choices
- decision: decisions made or discussed
- constraint: rules, limitations, hard restrictions
- objective: goals, targets, desired outcomes
- task: pending actions or to-dos
- observation: notable facts about entities, people, or situations
- relationship: connections between entities or people

Rules:
1. Extract ONLY facts explicitly mentioned or clearly implied
2. Confidence: 0.9+ if stated directly, 0.7-0.8 if implied, skip if < 0.7
3. Keep factText concise (max 200 characters)
4. Return empty array if nothing worth remembering
5. Do NOT invent facts

Conversation:
User: {{userMessage}}
Assistant: {{aiResponse}}

Respond with this exact JSON: { "facts": [{ "factText": string, "factType": string, "confidence": number }] }`;

const TRIVIAL_PATTERNS =
  /^(hi|hello|hola|thanks|gracias|ok|yes|no|s[ií]|bye|chau|adios|good morning|buenos d[ií]as|buenas tardes|buenas noches)[!.?]*$/i;

export function buildExtractor(config: SemanticMemoryConfig) {
  const factTypes = config.factTypes ?? DEFAULT_FACT_TYPES;
  const promptTemplate = config.extractionPrompt ?? DEFAULT_PROMPT;

  const schema = z.object({
    facts: z.array(
      z.object({
        factText: z.string().min(1).max(500),
        factType: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    ),
  });

  return async function extractFacts(params: {
    userMessage: string;
    aiResponse: string;
  }): Promise<ExtractedFact[]> {
    const combined = params.userMessage.length + params.aiResponse.length;
    if (combined < 50) return [];
    if (TRIVIAL_PATTERNS.test(params.userMessage.trim())) return [];

    const aiClient = createOpenAI({
      baseURL: config.ai.baseURL ?? "https://openrouter.ai/api/v1",
      apiKey: config.ai.apiKey,
    });

    const model = aiClient.chat(config.ai.model ?? "openai/gpt-4o-mini");

    const prompt = promptTemplate
      .replace("{{userMessage}}", params.userMessage.slice(0, 2000))
      .replace("{{aiResponse}}", params.aiResponse.slice(0, 2000));

    try {
      const { text } = await generateText({
        model,
        prompt,
        maxOutputTokens: 500,
        temperature: 0.1,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = schema.safeParse(JSON.parse(jsonMatch[0]));
      if (!parsed.success) return [];

      const fallbackType = factTypes[factTypes.length - 1] ?? "observation";
      return parsed.data.facts
        .filter((f) => f.confidence >= 0.7)
        .map((f) => ({
          factText: f.factText,
          factType: factTypes.includes(f.factType) ? f.factType : fallbackType,
          confidence: f.confidence,
        }));
    } catch {
      return [];
    }
  };
}
