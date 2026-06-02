import { NextRequest, NextResponse } from "next/server";
import { getVisionModel } from "@/lib/gemini";
import { groqVision, isGroqConfigured } from "@/lib/groq";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";
import { getUserId } from "@/lib/auth";
import Replicate from "replicate";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Replicate can take 15-45s

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ANALYSIS_PROMPT = `Analyze this person's selfie for a professional beauty makeover. 
Return ONLY valid JSON with this structure:
{
  "faceShape": "string",
  "skinTone": "string",
  "hairType": "string",
  "recommendedHairstyle": "string",
  "confidence": number
}
Focus on hairstyle recommendations that complement their facial architecture.`;

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "Replicate API Token not configured" }, { status: 500 });
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Analyze with AI Vision
    let text = "";
    if (isGroqConfigured()) {
      text = await groqVision({ prompt: ANALYSIS_PROMPT, image });
    } else {
      const model = getVisionModel();
      const base64 = image.replace(/^data:image\/\w+;base64,/, "");
      const result = await model.generateContent([
        ANALYSIS_PROMPT,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64,
          },
        },
      ]);
      text = result.response.text();
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from AI");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Generate Edited Image using Replicate + Flux Dev (Img2Img)
    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: `A high-quality, photorealistic beauty industry portrait of the same person with a ${analysis.recommendedHairstyle}. Preserve the exact facial features, identity, expression, clothing, and background. Only modify the hair to match the requested style. Studio lighting, professional salon makeover finish.`,
          image: image,
          prompt_strength: 0.7, // High enough to change hair, low enough to keep face
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "webp",
        }
      }
    );

    // Replicate returns an array or a single string depending on the model
    const generatedImageUrl = Array.isArray(output) ? output[0] : (typeof output === "string" ? output : null);

    if (!generatedImageUrl) {
      throw new Error("Replicate failed to return an image");
    }

    const response: HairstylePreviewResponse = {
      analysis: {
        ...analysis,
        confidence: analysis.confidence || 94,
      },
      generatedImageUrl,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Hairstyle Preview Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate hairstyle preview" },
      { status: 500 }
    );
  }
}
