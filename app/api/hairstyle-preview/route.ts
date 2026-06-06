import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSalons } from "@/lib/salons";
import { HAIRSTYLES, hairstyleImageUrl } from "@/lib/hairstyles";
import { HairstylePreviewResponse, HairstyleRecommendation } from "@/lib/hairstyle-types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANALYSIS_PROMPT = `Analyze this person's selfie focusing specifically on their facial structure and hair.
Return ONLY valid JSON with this structure:
{
  "faceShape": "Oval" | "Round" | "Heart" | "Square" | "Diamond" | "Long",
  "hairType": "Straight" | "Wavy" | "Curly" | "Coily",
  "hairTexture": "Fine" | "Medium" | "Thick",
  "hairCondition": "string",
  "recommendedHairstyle": "string",
  "confidence": number
}
Be precise about face shape and hair type as these will be used for database matching.`;

async function analyzeHairWithVision(image: string) {
  const { isGroqConfigured, groqVision } = await import("@/lib/groq");
  const { getVisionModel, isGeminiConfigured } = await import("@/lib/gemini");
  let text = "";
  
  try {
    if (isGroqConfigured()) {
      text = await groqVision({ prompt: ANALYSIS_PROMPT, image });
    } else if (isGeminiConfigured()) {
      const model = getVisionModel();
      const base64 = image.replace(/^data:image\/\w+;base64,/, "");
      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        { inlineData: { mimeType: "image/jpeg", data: base64 } }
      ]);
      text = result.response.text();
    } else {
      console.warn("Hairstyle preview: No vision model configured, using default analysis");
      return {
        faceShape: "Oval",
        hairType: "Wavy",
        hairTexture: "Medium",
        hairCondition: "Healthy",
        recommendedHairstyle: "Textured Fringe",
        confidence: 0.6
      };
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI could not parse hair analysis from the image");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Vision analysis failed:", e);
    // Fallback if AI fails completely
    return {
      faceShape: "Oval",
      hairType: "Wavy",
      hairTexture: "Medium",
      hairCondition: "Healthy",
      recommendedHairstyle: "Textured Fringe",
      confidence: 0.6
    };
  }
}

export async function POST(req: NextRequest) {
  console.log(">>> [API] Hairstyle Recommendation Request Started");
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in to use AI Beauty Analysis." }, { status: 401 });
    
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(ip, 30_000);
    if (!limit.allowed) return NextResponse.json({ error: `Please wait ${limit.retryAfter || 30} seconds before trying again.` }, { status: 429 });
    
    const body = await req.json().catch(() => ({}));
    const { image } = body;
    if (!image) return NextResponse.json({ error: "No image provided. Please upload a selfie." }, { status: 400 });

    // Step 1: Vision Analysis
    const analysis = await analyzeHairWithVision(image);
    console.log(">>> [API] Analysis complete:", analysis);

    // Step 2: Match Hairstyles (Strict AND matching)
    const matches = HAIRSTYLES.filter(h => 
      h.suitableFaceShapes.includes(analysis.faceShape) && 
      h.suitableHairTypes.includes(analysis.hairType)
    );

    // If no strict matches, fall back to matching at least face shape
    const finalMatches = matches.length > 0 ? matches : HAIRSTYLES.filter(h => h.suitableFaceShapes.includes(analysis.faceShape)).slice(0, 2);

    // Step 3: Fetch Salons and build recommendations
    const allSalons = await getSalons();
    
    const recommendations: HairstyleRecommendation[] = await Promise.all(
      finalMatches.map(async (style) => {
        // Find 3 salons in Bangalore offering Hair or Men's services
        const matchedSalons = allSalons
          .filter(s => s.services.some(svc => svc.category === "Hair" || svc.category === "Men's"))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3)
          .map(s => ({
            _id: s._id,
            name: s.name,
            area: s.area,
            rating: s.rating
          }));

        return {
          id: style.id,
          name: style.name,
          imageUrl: hairstyleImageUrl(style.unsplashPhotoId),
          matchedSalons
        };
      })
    );

    const response: HairstylePreviewResponse = {
      analysis: {
        ...analysis,
        confidence: analysis.confidence < 1 ? analysis.confidence * 100 : analysis.confidence
      },
      recommendations
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(">>> [API] CRITICAL ERROR:", err);
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
