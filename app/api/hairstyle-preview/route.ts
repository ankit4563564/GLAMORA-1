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

    // Step 2: Generate Edited Image using Hugging Face (Multi-model Fallback with Direct Fetch)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    const models = [
      "stabilityai/stable-diffusion-xl-base-1.0",
      "stabilityai/sdxl-turbo",
      "runwayml/stable-diffusion-v1-5",
      "prompthero/openjourney"
    ];

    let resultBlob: Blob | null = null;
    let lastErrorMsg = "";

    for (const model of models) {
      try {
        console.log(`Directly fetching from ${model}...`);
        const hfResponse = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: {
              Authorization: `Bearer ${hfToken}`,
              "Content-Type": "application/json",
              "x-use-cache": "false",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: base64Data,
              parameters: {
                prompt: `A professional beauty industry portrait with a ${analysis.recommendedHairstyle} hairstyle. Photorealistic, 8k, highly detailed.`,
                negative_prompt: "deformed, blurry, bad anatomy, disfigured",
                strength: 0.5,
              },
              options: {
                wait_for_model: true,
              }
            }),
          }
        );

        if (hfResponse.ok) {
          resultBlob = await hfResponse.blob();
          console.log(`Successfully generated with ${model}`);
          break;
        } else {
          const errorData = await hfResponse.json().catch(() => ({}));
          const msg = errorData.error || hfResponse.statusText;
          console.error(`Model ${model} failed: ${msg}`);
          lastErrorMsg = msg;
          
          // If it's an auth error, no point in trying other models with the same token
          if (hfResponse.status === 401 || msg.toLowerCase().includes("auth") || msg.toLowerCase().includes("invalid")) {
             throw new Error("Your Hugging Face API token is invalid or unauthorized. Please check your .env file.");
          }
        }
      } catch (err: any) {
        console.error(`Fetch error with ${model}:`, err.message);
        if (err.message.includes("token is invalid")) throw err;
        lastErrorMsg = err.message;
        continue;
      }
    }

    if (!resultBlob) {
      throw new Error(lastErrorMsg || "All Hugging Face models failed. Please verify your API token and try again later.");
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
