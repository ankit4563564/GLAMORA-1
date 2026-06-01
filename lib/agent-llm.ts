import { completeText, isTextLlmConfigured } from "@/lib/llm";
import type { SalonDoc } from "@/lib/salons";

export type LlmParseResult = {
  intent?: string;
  filters?: Record<string, string | number>;
  response?: string;
};

const SYSTEM = `You are Glamora's Bangalore salon booking assistant. Reply ONLY with valid JSON, no markdown:
{"intent":"search"|"book"|"check_slots"|"recommend"|"general","filters":{"area":string|null,"maxPrice":number|null,"service":string|null,"salonName":string|null},"response":"one short friendly sentence"}`;

const LLM_TIMEOUT_MS = 4_000;

/** Uses Gemini Flash by default. Skipped if AGENT_USE_LLM=false. */
export async function parseWithLlm(
  query: string,
  salons: SalonDoc[]
): Promise<LlmParseResult | null> {
  if (process.env.AGENT_USE_LLM === "false") return null;
  if (!isTextLlmConfigured()) return null;

  const context = salons
    .slice(0, 10)
    .map((s) => `${s.name}@${s.area}`)
    .join("; ");

  const work = (async () => {
    const text = await completeText({
      system: SYSTEM,
      user: `Partners: ${context}\nUser: ${query}`,
      maxTokens: 256,
      temperature: 0.2,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as LlmParseResult;
  })();

  try {
    return await Promise.race([
      work,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), LLM_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return null;
  }
}

/** True when Groq or Gemini can power optional agent LLM enrichment. */
export function isAgentLlmAvailable(): boolean {
  return (
    process.env.AGENT_USE_LLM !== "false" && isTextLlmConfigured()
  );
}
