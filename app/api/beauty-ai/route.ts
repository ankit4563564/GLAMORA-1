import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit } from "@/lib/rate-limit";
import { getVisionModel } from "@/lib/gemini";
import { BEAUTY_AI_FALLBACK } from "@/lib/seed-data";
import { getSalons } from "@/lib/salons";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROMPT = `You are a professional beauty consultant AI. Analyze this selfie and return ONLY valid JSON with this structure: { "faceShape": { "shape": string, "confidence": number, "description": string, "recommendedStyles": string[] }, "skinTone": { "undertone": string, "complexion": string, "treatments": string[] }, "hairTexture": { "type": string, "condition": string, "treatments": string[] } }`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(ip, 30_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limited. Retry in ${limit.retryAfter}s` },
      { status: 429 }
    );
  }

  const { image } = await req.json();
  if (!image) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  let analysis = BEAUTY_AI_FALLBACK;

  try {
    const model = getVisionModel();
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64,
        },
      },
    ]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    analysis = BEAUTY_AI_FALLBACK;
  }

  const salons = await getSalons();
  const treatments = [
    ...(analysis.skinTone?.treatments || []),
    ...(analysis.hairTexture?.treatments || []),
  ];
  const matched = salons
    .filter((s) =>
      s.services.some((svc) =>
        treatments.some(
          (t) =>
            svc.name.toLowerCase().includes(t.split(" ")[0]?.toLowerCase() || "") ||
            svc.category === "Skin" ||
            svc.category === "Hair"
        )
      )
    )
    .slice(0, 3);

  const fallbackMatches = salons.slice(0, 3);

  return NextResponse.json({
    analysis,
    matchedSalons: matched.length ? matched : fallbackMatches,
  });
}
