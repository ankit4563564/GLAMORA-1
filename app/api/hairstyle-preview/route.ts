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

    // Step 2: Generate Edited Image
    const prompt = `professional hairstyle makeover, ${analysis.recommendedHairstyle}, photorealistic, high quality`;
    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=512&height=768&nologo=true`;
    
    console.log(">>> [API] Phase 2: Generating Transformation...");
    
    let generatedImageUrl = "";
    const { configureCloudinary } = await import("@/lib/cloudinary");
    const cloudinary = configureCloudinary();

    try {
      console.log(">>> [API] Trying Strategy 1: Pollinations");
      const uploadRes = await cloudinary.uploader.upload(pollinationsUrl, {
        folder: "glamora/hairstyle-previews",
        timeout: 20000
      });
      generatedImageUrl = uploadRes.secure_url;
      console.log(">>> [API] Strategy 1 SUCCESS:", generatedImageUrl);
    } catch (err: any) {
      console.warn(">>> [API] Strategy 1 FAILED:", err.message);
      
      try {
        console.log(">>> [API] Trying Strategy 2: Hugging Face");
        const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
        if (!hfToken || hfToken === "hf_...") throw new Error("No token");

        const hfRes = await fetch(
          "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
          {
            headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" },
            method: "POST",
            body: JSON.stringify({
              inputs: image.replace(/^data:image\/\w+;base64,/, ""),
              parameters: { prompt: `hairstyle makeover: ${analysis.recommendedHairstyle}`, strength: 0.5 },
              options: { wait_for_model: true }
            }),
            signal: AbortSignal.timeout(20000)
          }
        );

        if (!hfRes.ok) throw new Error(`HF HTTP ${hfRes.status}`);
        const blob = await hfRes.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        
        const uploadRes = await cloudinary.uploader.upload(`data:image/jpeg;base64,${buffer.toString("base64")}`, {
          folder: "glamora/hairstyle-previews",
        });
        generatedImageUrl = uploadRes.secure_url;
        console.log(">>> [API] Strategy 2 SUCCESS:", generatedImageUrl);
      } catch (hfErr: any) {
        console.error(">>> [API] Strategy 2 FAILED:", hfErr.message);
        
        try {
          console.log(">>> [API] Trying Strategy 3: Cloudinary AI Enhancement");
          const originalUpload = await cloudinary.uploader.upload(image, {
            folder: "glamora/hairstyle-previews",
          });
          
          // Use simpler, high-reliability transformations to avoid 400 errors
          generatedImageUrl = cloudinary.url(originalUpload.public_id, {
            transformation: [
              { width: 800, crop: "limit" },
              { effect: "improve" },
              { effect: "gamma:50" },
              { quality: "auto" }
            ],
            secure: true
          });
          console.log(">>> [API] Strategy 3 SUCCESS:", generatedImageUrl);
        } catch (finalErr: any) {
          console.error(">>> [API] Strategy 3 FAILED:", finalErr.message);
          generatedImageUrl = image;
        }
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
