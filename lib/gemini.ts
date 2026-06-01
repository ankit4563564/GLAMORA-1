import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not defined");
  if (!client) client = new GoogleGenerativeAI(key);
  return client;
}

export function getVisionModel() {
  return getGeminiClient().getGenerativeModel({
    model: "gemini-1.5-flash",
  });
}

export function getAgentModel() {
  const client = getGeminiClient();
  const modelName =
    process.env.GEMINI_AGENT_MODEL || "gemini-1.5-flash";
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
  });
}

export function getMarketingModel() {
  return getGeminiClient().getGenerativeModel({
    model: "gemini-2.0-flash",
  });
}
