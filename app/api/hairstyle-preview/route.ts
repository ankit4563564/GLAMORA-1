import { NextRequest, NextResponse } from "next/server";
import { getVisionModel } from "@/lib/gemini";
import { groqVision, isGroqConfigured } from "@/lib/groq";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";
import { getUserId } from "@/lib/auth";
import { HfInference } from "@huggingface/inference";
import { uploadBase64Image } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

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

    if (!process.env.HUGGINGFACE_API_TOKEN) {
      return NextResponse.json({ error: "Hugging Face API Token not configured" }, { status: 500 });
    }

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Analyze with AI Vision (Gemini or Groq)
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

    // Step 2: Generate Edited Image using Hugging Face (Img2Img)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });

    const resultBlob = await hf.imageToImage({
      model: "stabilityai/stable-diffusion-2-1",
      inputs: blob,
      parameters: {
        prompt: `A high-quality, photorealistic professional beauty industry portrait of the same person with a ${analysis.recommendedHairstyle} hairstyle. Professional salon makeover, studio lighting.`,
        negative_prompt: "deformed, distorted, disfigured, poorly drawn face, bad anatomy, wrong identity, cartoon, anime, illustration, painting, blurry",
        strength: 0.6,
      },
    });

    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString("base64");
    const generatedImageUrl = await uploadBase64Image(resultBase64, "glamora/hairstyle-previews");

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
