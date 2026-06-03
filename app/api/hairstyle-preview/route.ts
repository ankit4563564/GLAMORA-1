import { NextRequest, NextResponse } from "next/server";
import { getVisionModel } from "@/lib/gemini";
import { groqVision, isGroqConfigured } from "@/lib/groq";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";
import { getUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

    // Step 2: Generate Edited Image using Dual Provider Strategy
    const prompt = `professional hairstyle makeover, ${analysis.recommendedHairstyle}, photorealistic, high quality`;
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    // We try multiple ways to get the image to handle rate limits and blocks
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=768&nologo=true`;
    
    console.log("Phase 2: Generating AI Image...");
    
    let generatedImageUrl = "";
    
    // Attempt 1: Pollinations via Cloudinary Proxy
    try {
      console.log("Attempting Pollinations + Cloudinary...");
      const { configureCloudinary } = await import("@/lib/cloudinary");
      const cloudinary = configureCloudinary();
      
      // We first check if Pollinations is returning the 402/Queue error
      const pollCheck = await fetch(pollinationsUrl);
      if (pollCheck.status === 402 || pollCheck.status === 429) {
          throw new Error("Pollinations rate limit");
      }

      const uploadRes = await cloudinary.uploader.upload(pollinationsUrl, {
        folder: "glamora/hairstyle-previews",
      });
      
      generatedImageUrl = uploadRes.secure_url;
      console.log("Success with Pollinations.");
    } catch (pollinationsErr: any) {
      console.warn("Pollinations failed or rate-limited, trying Fallback Provider (Hugging Face)...");
      
      // Attempt 2: Hugging Face SDXL with direct fetch (Server-side)
      try {
        const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
        if (!hfToken || hfToken === "hf_...") throw new Error("No HF Token");

        const hfRes = await fetch(
          "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
          {
            headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
              inputs: image.replace(/^data:image\/\w+;base64,/, ""),
              parameters: { prompt, strength: 0.5 },
              options: { wait_for_model: true }
            }),
          }
        );

        if (!hfRes.ok) throw new Error("HF Provider failed");

        const blob = await hfRes.ok ? await hfRes.blob() : null;
        if (!blob) throw new Error("HF returned no data");

        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        // Host the HF result on Cloudinary for stability
        const { configureCloudinary } = await import("@/lib/cloudinary");
        const cloudinary = configureCloudinary();
        const uploadRes = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, {
          folder: "glamora/hairstyle-previews",
        });
        
        generatedImageUrl = uploadRes.secure_url;
        console.log("Success with Hugging Face fallback.");
      } catch (hfErr) {
        console.error("All AI providers failed:", hfErr);
        // Final fallback: just return the Pollinations URL and hope the client can see it
        generatedImageUrl = pollinationsUrl;
      }
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
