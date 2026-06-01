import { getAgentModel } from "@/lib/gemini";
import type { SalonDoc } from "@/lib/salons";

export type LlmParseResult = {
  intent?: string;
  filters?: Record<string, string | number>;
  response?: string;
};

const SYSTEM = `Bangalore salon assistant. Reply ONLY JSON:
{"intent":"search"|"book"|"check_slots"|"recommend"|"general","filters":{"area":string|null,"maxPrice":number|null,"service":string|null,"salonName":string|null},"response":"one short sentence"}`;

const LLM_TIMEOUT_MS = 2_500;

/** Optional slow path — only for ambiguous queries when enabled. */
export async function parseWithLlm(
  query: string,
  salons: SalonDoc[]
): Promise<LlmParseResult | null> {
  if (process.env.AGENT_USE_LLM === "false") return null;

  const context = salons
    .slice(0, 10)
    .map((s) => `${s.name}@${s.area}`)
    .join("; ");

  const work = (async () => {
    const model = getAgentModel();
    const result = await model.generateContent(
      `${SYSTEM}\nPartners: ${context}\nUser: ${query}`
    );
    const text = result.response.text();
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
