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

    // Step 2: Generate Edited Image using Pollinations AI (Fast Default Model)
    const prompt = `professional hairstyle, ${analysis.recommendedHairstyle}, high quality, realistic`;
    const encodedPrompt = encodeURIComponent(prompt);
    
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=768&nologo=true`;
    
    console.log("Phase 2: Generating AI Image via Cloudinary Proxy...");
    
    let generatedImageUrl = "";
    try {
      // We use Cloudinary to fetch the image from Pollinations.
      // This bypasses any local network blocks because Cloudinary's servers do the fetching.
      const { uploadBase64Image, configureCloudinary } = await import("@/lib/cloudinary");
      const cloudinary = configureCloudinary();
      
      const uploadRes = await cloudinary.uploader.upload(pollinationsUrl, {
        folder: "glamora/hairstyle-previews",
        transformation: [{ width: 800, crop: "limit" }]
      });
      
      generatedImageUrl = uploadRes.secure_url;
      console.log("Phase 2: Cloudinary Proxy Successful.");
    } catch (err) {
      console.error("Cloudinary Proxy Failed, falling back to server-side fetch:", err);
      
      // Fallback: Try to fetch it directly on the server if Cloudinary fails
      try {
        const imgRes = await fetch(pollinationsUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        generatedImageUrl = `data:image/jpeg;base64,${base64}`;
        console.log("Phase 2: Server-side fetch successful.");
      } catch (fallbackErr) {
        console.error("All fetch methods failed:", fallbackErr);
        generatedImageUrl = pollinationsUrl; // Last resort
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
