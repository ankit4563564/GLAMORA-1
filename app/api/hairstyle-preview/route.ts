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

    const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
    if (!hfToken || hfToken === "hf_...") {
      return NextResponse.json({ error: "Hugging Face API Token is missing or invalid in .env" }, { status: 500 });
    }

    // Masked logging for debugging (only shows first 4 and last 4 chars)
    const maskedToken = `${hfToken.substring(0, 4)}...${hfToken.substring(hfToken.length - 4)}`;
    console.log(`Using Hugging Face Token: ${maskedToken}`);

    const hf = new HfInference(hfToken);

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Analyze with AI Vision (Gemini or Groq)
    console.log("Phase 1: Starting Vision Analysis...");
    let text = "";
    try {
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
    } catch (visionErr: any) {
      console.error("Vision Analysis Error:", visionErr);
      throw new Error(`Vision analysis failed: ${visionErr.message}`);
    }
    console.log("Phase 1: Vision Analysis Complete.");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from AI");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Generate Edited Image using Hugging Face (Optimized for speed)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    // We use sdxl-turbo as it is significantly faster (1-2s) than other models,
    // which helps avoid the 10s serverless timeout limit.
    const model = "stabilityai/sdxl-turbo";
    console.log(`Phase 2: Starting AI Generation with ${model}...`);
    
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: base64Data,
          parameters: {
            prompt: `professional beauty industry portrait, ${analysis.recommendedHairstyle} hairstyle, photorealistic, 8k`,
            negative_prompt: "deformed, blurry",
            strength: 0.5,
            num_inference_steps: 2,
            guidance_scale: 0.0,
          },
          options: {
            wait_for_model: true,
          }
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorData = await hfResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `AI Generation failed: ${hfResponse.statusText}`);
    }

    const resultBlob = await hfResponse.blob();
    console.log("Phase 2: AI Generation Complete.");

    // Step 3: Upload to Cloudinary
    console.log("Phase 3: Uploading to Cloudinary...");
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString("base64");
    const generatedImageUrl = await uploadBase64Image(resultBase64, "glamora/hairstyle-previews");
    console.log("Phase 3: Upload Complete.");

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
