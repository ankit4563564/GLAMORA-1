import { completeText, isTextLlmConfigured } from "@/lib/llm";
import type { SalonDoc } from "@/lib/salons";

export type LlmParseResult = {
  intent: "search" | "book" | "check_slots" | "recommend" | "general";
  filters?: {
    area?: string | null;
    maxPrice?: number | null;
    service?: string | null;
    salonName?: string | null;
    time?: string | null;
    date?: string | null;
  };
  message: string;
};

const SYSTEM_CONCIERGE = `You are the Glamora AI Concierge, a sophisticated, helpful, and friendly beauty assistant for Bangalore. 

YOUR PERSONA:
- You speak like a professional concierge at a luxury spa.
- You are knowledgeable about beauty, skincare, and hair trends.
- You are conversational and never robotic.

YOUR TASKS:
1. CONVERSE: Respond naturally to the user's query. Give detailed, helpful beauty tips.
2. ANALYZE INTENT: Determine if the user wants to "search" for salons, "book" an appointment, "check_slots", or just "recommend" something.
3. EXTRACT FILTERS: Identify area, maxPrice (number only), service, salonName, date, and time.
4. RATIONALE: ALWAYS explain WHY you are recommending a specific salon in your message. Mention factors like budget, specialty, or location match.
5. FOLLOW-UPS: You support follow-up commands like "Book the second one" or "Tell me more about the first option". 
6. NUMBERING: When you mention multiple salons in your message, ALWAYS number them (1., 2., etc.).
7. BUDGET AWARENESS: If the user mentions a budget, strictly prioritize partners within that range.
8. BANGALORE FOCUS: Glamora is currently ONLY in Bangalore.

RESPONSE FORMAT:
You MUST reply ONLY with valid JSON:
{
  "intent": "search" | "book" | "check_slots" | "recommend" | "general",
  "filters": { "area": string | null, "maxPrice": number | null, "service": string | null, "salonName": string | null, "time": string | null, "date": string | null },
  "message": "Your natural, conversational response explaining WHY you recommended these options (if any)."
}`;

const LLM_TIMEOUT_MS = 8_000;

/** 
 * Unified ChatGPT-style agent. 
 * Handles both conversation and intent parsing with history.
 */
export async function unifiedAgentResponse(
  query: string,
  history: Array<{ role: string; content: string }>,
  salons: SalonDoc[]
): Promise<LlmParseResult | null> {
  if (process.env.AGENT_USE_LLM === "false") return null;
  if (!isTextLlmConfigured()) {
    console.warn("[AI-ENGINE] LLM not configured (missing keys)");
    return null;
  }

  const context = salons
    .slice(0, 15)
    .map((s) => `${s.name}@${s.area}`)
    .join("; ");

  const chatHistory = history
    .slice(-6)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const work = (async () => {
    const text = await completeText({
      system: SYSTEM_CONCIERGE,
      user: `### BANGALORE PARTNERS
${context}

### CONVERSATION HISTORY
${chatHistory || "No prior conversation."}

### CURRENT USER QUERY
"${query}"

### FINAL INSTRUCTION
Provide a helpful, conversational response and the structured intent JSON.`,
      maxTokens: 512,
      temperature: 0.3,
    });
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        intent: parsed.intent || "general",
        filters: parsed.filters || {},
        message: parsed.message || "How else can I help you today?"
      };
    } catch (e) {
      console.error("Agent JSON parse failed:", e, text);
      return null;
    }
  })();

  try {
    return await Promise.race([
      work,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), LLM_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    console.error("Agent LLM timeout or error:", err);
    return null;
  }
}

/** True when Groq or Gemini can power optional agent LLM enrichment. */
export function isAgentLlmAvailable(): boolean {
  return (
    process.env.AGENT_USE_LLM !== "false" && isTextLlmConfigured()
  );
}
