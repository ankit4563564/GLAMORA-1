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

const ANALYSIS_PROMPT = `Analyze this person's selfie focusing specifically on their hair. 
Return ONLY valid JSON with this structure:
{
  "hairType": "string",
  "hairTexture": "string",
  "hairCondition": "string",
  "recommendedHairstyle": "string",
  "confidence": number
}
Focus exclusively on hairstyle recommendations and hair characteristics.`;

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

    // Step 2: Generate Edited Image using Hugging Face (Binary POST for reliability)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    // Using SD 1.5 as it's the most stable/warm model on HF
    const model = "runwayml/stable-diffusion-v1-5";
    console.log(`Phase 2: Generating with ${model} (Binary Mode)...`);
    
    let hfResponse;
    try {
      hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "image/jpeg",
          },
          method: "POST",
          body: buffer,
        }
      );
    } catch (fetchErr: any) {
      console.error("Fetch Network Error:", fetchErr);
      if (fetchErr.code === 'ENOTFOUND') {
        throw new Error("Network Error: Could not connect to Hugging Face. Please check your internet connection or DNS settings.");
      }
      throw fetchErr;
    }

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error("HF Error Response:", errorText);
      throw new Error(`AI Generation failed: ${hfResponse.statusText}`);
    }

    const resultBlob = await hfResponse.blob();
    console.log("Phase 2: AI Generation Complete.");

    // Step 3: Return Base64 directly to avoid Cloudinary latency
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = Buffer.from(arrayBuffer).toString("base64");
    const generatedImageUrl = `data:image/jpeg;base64,${resultBase64}`;
    
    console.log("Phase 3: Returning direct base64.");

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
