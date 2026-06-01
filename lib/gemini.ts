import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not defined");
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export function getVisionModel() {
  return getGeminiClient().getGenerativeModel({
    model: process.env.GEMINI_VISION_MODEL?.trim() || "gemini-1.5-flash-latest",
  });
}

export function getAgentModel() {
  const modelName =
    process.env.GEMINI_AGENT_MODEL?.trim() || "gemini-1.5-flash-latest";
  return getGeminiClient().getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
  });
}

export function getMarketingModel() {
  return getGeminiClient().getGenerativeModel({
    model: process.env.GEMINI_MARKETING_MODEL?.trim() || "gemini-1.5-flash-latest",
  });
}

/** Plain text completion for routes that use the shared LLM layer fallback. */
export async function geminiChat(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const model = getGeminiClient().getGenerativeModel({
    model: process.env.GEMINI_AGENT_MODEL?.trim() || "gemini-1.5-flash-latest",
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? 512,
      temperature: params.temperature ?? 0.3,
    },
  });
  const result = await model.generateContent(
    `${params.system}\n\n${params.user}`
  );
  return result.response.text().trim();
}
