import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getVisionModel, isGeminiConfigured } from "@/lib/gemini";
import { groqVision, isGroqConfigured } from "@/lib/groq";
import { getSalons } from "@/lib/salons";

export const dynamic = "force-dynamic";

const PROMPT = `You are a professional esthetician and facial analyst AI. Analyze this selfie and return ONLY valid JSON with this structure: 
{ 
  "faceShape": { "shape": string, "confidence": number, "description": string, "recommendedFacialFeatures": string[] }, 
  "skinTone": { "undertone": string, "confidence": number, "complexion": string, "treatments": string[] }, 
  "styleCompatibilityScore": number 
}`;

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in to use BeautyAI." }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(ip, 30_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Please wait ${limit.retryAfter || 30} seconds before trying again.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { image } = body;
  if (!image) {
    return NextResponse.json({ error: "Image required" }, { status: 400 });
  }

  // Default analysis as fallback
  let analysis = {
    faceShape: {
      shape: "Oval",
      confidence: 0.85,
      description: "Balanced proportions with gently rounded jawline",
      recommendedFacialFeatures: ["Contouring", "Highlighting", "Brow shaping"],
    },
    skinTone: {
      undertone: "Neutral",
      confidence: 0.9,
      complexion: "Clear with even tone",
      treatments: ["Hydration therapy", "SPF protection", "Vitamin C serum"],
    },
    styleCompatibilityScore: 88,
  };
  let analysisError: string | null = null;

  try {
    let text = "";
    if (isGroqConfigured()) {
      text = await groqVision({ prompt: PROMPT, image });
    } else if (isGeminiConfigured()) {
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
      text = result.response.text();
    } else {
      console.warn("Beauty AI: No vision model configured, using default analysis");
      analysisError = "AI vision service not configured. Showing estimated results.";
    }

    if (text) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("Beauty AI invalid JSON response:", text);
        analysisError = "AI returned an unexpected format. Showing estimated results.";
      }
    }
  } catch (err: any) {
    console.error("Beauty AI failed:", err.message);
    analysisError = "AI vision service temporarily unavailable. Showing estimated results.";
  }

  // Match salons based on treatments
  let matched: { _id: string; name: string; area: string }[] = [];
  try {
    const salons = await getSalons();
    const treatments = [...(analysis.skinTone?.treatments || [])];
    matched = salons
      .filter((s) =>
        s.services.some((svc: any) =>
          treatments.some(
            (t) =>
              svc.name.toLowerCase().includes(t.split(" ")[0]?.toLowerCase() || "") ||
              svc.category === "Skin" ||
              svc.category === "Hair"
          )
        )
      )
      .slice(0, 3);

    if (matched.length === 0) {
      matched = salons.slice(0, 3);
    }
  } catch {
    // Salons unavailable — that's okay, just return empty
  }

  return NextResponse.json({
    analysis,
    matchedSalons: matched,
    ...(analysisError && { warning: analysisError }),
  });
}
