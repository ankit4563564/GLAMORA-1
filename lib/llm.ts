import { groqChat, isGroqConfigured } from "@/lib/groq";
import { geminiChat, isGeminiConfigured } from "@/lib/gemini";

export type LlmBackend = "groq" | "gemini" | "none";

export function getTextLlmBackend(): LlmBackend {
  if (isGeminiConfigured()) return "gemini";
  if (isGroqConfigured()) return "groq";
  return "none";
}

export function isTextLlmConfigured(): boolean {
  return getTextLlmBackend() !== "none";
}

/** Text completion - prefers Gemini Flash for chat, with Groq as fallback. */
export async function completeText(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const backend = getTextLlmBackend();
  if (backend === "gemini") {
    return geminiChat(params);
  }
  if (backend === "groq") {
    return groqChat(params);
  }
  throw new Error("No text LLM configured (set GEMINI_API_KEY or GROQ_API_KEY)");
}
