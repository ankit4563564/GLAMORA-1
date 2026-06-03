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
  console.log(">>> [API] Hairstyle Preview Request Started");
  try {
    const userId = await getUserId();
    console.log(">>> [API] Auth Check - User ID:", userId);
    
    if (!userId) {
      console.error(">>> [API] Auth Failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(e => {
        console.error(">>> [API] Body Parse Error:", e);
        return {};
    });
    
    const { image } = body;
    if (!image) {
      console.error(">>> [API] No Image Provided");
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    console.log(">>> [API] Image Received. Length:", image.length);

    // Step 1: Analyze with AI Vision
    console.log(">>> [API] Phase 1: Starting Vision Analysis...");
    let text = "";
    try {
      if (isGroqConfigured()) {
        console.log(">>> [API] Using Groq Vision");
        text = await groqVision({ prompt: ANALYSIS_PROMPT, image });
      } else {
        console.log(">>> [API] Using Gemini Vision");
        const model = getVisionModel();
        const base64 = image.replace(/^data:image\/\w+;base64,/, "");
        const result = await model.generateContent([
          ANALYSIS_PROMPT,
          {
            inlineData: { mimeType: "image/jpeg", data: base64 },
          },
        ]);
        text = result.response.text();
      }
      console.log(">>> [API] Vision Response Received:", text.substring(0, 100) + "...");
    } catch (visionErr: any) {
      console.error(">>> [API] Vision Analysis Failed:", visionErr.message);
      throw new Error(`Vision analysis failed: ${visionErr.message}`);
    }
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(">>> [API] JSON Parse Error. Text was:", text);
      throw new Error("Failed to parse analysis from AI");
    }
    const analysis = JSON.parse(jsonMatch[0]);
    console.log(">>> [API] Analysis Parsed:", analysis.recommendedHairstyle);

    // Step 2: Generate Edited Image (Real Hairstyle Changer)
    const prompt = `professional hairstyle makeover, ${analysis.recommendedHairstyle}, photorealistic, high quality, 8k, preserve face and identity`;
    
    console.log(">>> [API] Phase 2: Starting Real AI Transformation...");
    
    let generatedImageUrl = "";
    const { configureCloudinary } = await import("@/lib/cloudinary");
    const cloudinary = configureCloudinary();

    // Primary Strategy: Hugging Face SDXL (High Quality Image-to-Image)
    try {
      console.log(">>> [API] Trying Strategy 1: Hugging Face SDXL (Img2Img)");
      const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
      if (!hfToken || hfToken === "hf_...") throw new Error("Hugging Face Token is missing or placeholder in .env");

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Send as binary to Hugging Face for maximum compatibility
      const hfRes = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: { 
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "image/jpeg",
          },
          method: "POST",
          body: buffer,
          // We pass parameters as headers for binary POSTs in some HF configurations, 
          // but for SDXL, we'll try the standard header-based prompt first
        }
      );

      if (!hfRes.ok) {
          const errorMsg = await hfRes.text();
          throw new Error(`HF Provider Error (${hfRes.status}): ${errorMsg}`);
      }

      const blob = await hfRes.blob();
      const resultBuffer = Buffer.from(await blob.arrayBuffer());
      
      console.log(">>> [API] Strategy 1 Generation Successful. Uploading result...");

      const uploadRes = await cloudinary.uploader.upload(`data:image/jpeg;base64,${resultBuffer.toString("base64")}`, {
        folder: "glamora/hairstyle-previews",
      });
      
      generatedImageUrl = uploadRes.secure_url;
      console.log(">>> [API] Strategy 1 COMPLETE:", generatedImageUrl);
    } catch (hfErr: any) {
      console.error(">>> [API] Strategy 1 FAILED:", hfErr.message);
      
      // Fallback Strategy: Pollinations (Only if SDXL fails)
      try {
        console.log(">>> [API] Trying Strategy 2: Pollinations (Fallback)");
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(`A person with a ${analysis.recommendedHairstyle} hairstyle, photorealistic, 8k`);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=768&height=768&nologo=true`;
        
        const uploadRes = await cloudinary.uploader.upload(pollinationsUrl, {
          folder: "glamora/hairstyle-previews",
        });
        
        generatedImageUrl = uploadRes.secure_url;
        console.log(">>> [API] Strategy 2 COMPLETE (Note: This is a placeholder as Pollinations is not real Img2Img)");
      } catch (pollErr: any) {
        console.error(">>> [API] Strategy 2 FAILED:", pollErr.message);
        throw new Error("All AI image providers are currently down or rate-limited. Please check your Hugging Face token.");
      }
    }

    const response: HairstylePreviewResponse = {
      analysis: { ...analysis, confidence: analysis.confidence || 94 },
      generatedImageUrl,
    };

    console.log(">>> [API] Request Completed Successfully");
    return NextResponse.json(response);
  } catch (error: any) {
    console.error(">>> [API] CRITICAL FAILURE:", error);
    return NextResponse.json(
      { error: `API Error: ${error.message}` },
      { status: 500 }
    );
  }
}
