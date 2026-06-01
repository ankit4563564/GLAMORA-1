import { groqChat, isGroqConfigured } from "@/lib/groq";
import { geminiChat, isGeminiConfigured } from "@/lib/gemini";

export type LlmBackend = "groq" | "gemini" | "none";

export function getTextLlmBackend(): LlmBackend {
  if (isGroqConfigured()) return "groq";
  if (isGeminiConfigured()) return "gemini";
  return "none";
}

export function isTextLlmConfigured(): boolean {
  return getTextLlmBackend() !== "none";
}

/** Text completion — prefers Groq when GROQ_API_KEY is set, else Gemini. */
export async function completeText(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const backend = getTextLlmBackend();
  if (backend === "groq") {
    return groqChat(params);
  }
  if (backend === "gemini") {
    return geminiChat(params);
  }
  throw new Error("No text LLM configured (set GROQ_API_KEY or GEMINI_API_KEY)");
}
