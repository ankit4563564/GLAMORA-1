import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not defined");
  
  // Validate API key format - should start with "AIza" for Google AI Studio keys
  if (!key.startsWith("AIza")) {
    console.warn("GEMINI_API_KEY may be invalid - should start with 'AIza'. Current format:", key.substring(0, 10) + "...");
  }
  
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

function getModelName(envVar: string | undefined, fallback: string): string {
  if (!envVar) return fallback;
  // Strip quotes and lowercase for safety
  return envVar.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

export function getVisionModel() {
  return getGeminiClient().getGenerativeModel({
    model: getModelName(process.env.GEMINI_VISION_MODEL, "gemini-2.0-flash"),
  });
}

export function getAgentModel() {
  const modelName = getModelName(process.env.GEMINI_AGENT_MODEL, "gemini-2.0-flash");
  return getGeminiClient().getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
  });
}

export function getMarketingModel() {
  return getGeminiClient().getGenerativeModel({
    model: getModelName(process.env.GEMINI_MARKETING_MODEL, "gemini-2.0-flash"),
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
    model: getModelName(process.env.GEMINI_AGENT_MODEL, "gemini-2.0-flash"),
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
