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

    const hf = new HfInference(hfToken);

    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Analyze with AI Vision (Gemini or Groq)
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
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from AI");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Generate Edited Image using Hugging Face (Img2Img)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });

    let resultBlob;
    try {
      resultBlob = await hf.imageToImage({
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: blob,
        parameters: {
          prompt: `A professional beauty industry portrait of the same person with a ${analysis.recommendedHairstyle} hairstyle. Photorealistic, high quality.`,
          negative_prompt: "deformed, blurry, bad anatomy, disfigured, different person",
          strength: 0.5,
        },
        // Wait for the model to load if it's currently cold
        options: {
          wait_for_model: true,
        }
      });
    } catch (hfErr: any) {
      console.error("Hugging Face Generation Error:", hfErr);
      // If SDXL fails, try SD 1.5 as fallback with wait_for_model
      console.log("Attempting fallback to SD 1.5...");
      resultBlob = await hf.imageToImage({
        model: "runwayml/stable-diffusion-v1-5",
        inputs: blob,
        parameters: {
          prompt: `A professional ${analysis.recommendedHairstyle} hairstyle on this person.`,
          strength: 0.5,
        },
        options: {
          wait_for_model: true,
        }
      });
    }

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
