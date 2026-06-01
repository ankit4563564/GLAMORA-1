import Groq from "groq-sdk";

let client: Groq | null = null;

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY is not defined");
  if (!client) client = new Groq({ apiKey: key });
  return client;
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

/** Fast chat completion via Groq (OpenAI-compatible API). */
export async function groqChat(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: getGroqModel(),
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
    max_tokens: params.maxTokens ?? 512,
    temperature: params.temperature ?? 0.3,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}
