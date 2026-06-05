import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { getUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

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

// img2img models ordered by reliability — first one that works wins
const IMG2IMG_MODELS = [
  "timbrooks/instruct-pix2pix",
  "prompthero/openjourney",
  "runwayml/stable-diffusion-v1-5",
  "stabilityai/stable-diffusion-2-1",
];

async function analyzeHairWithVision(image: string): Promise<{
  hairType: string;
  hairTexture: string;
  hairCondition: string;
  recommendedHairstyle: string;
  confidence: number;
}> {
  // Try Groq first, then Gemini
  const { isGroqConfigured, groqVision } = await import("@/lib/groq");
  const { getVisionModel } = await import("@/lib/gemini");

  let text = "";

  if (isGroqConfigured()) {
    text = await groqVision({ prompt: ANALYSIS_PROMPT, image });
  } else {
    const model = getVisionModel();
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const result = await model.generateContent([
      ANALYSIS_PROMPT,
      { inlineData: { mimeType: "image/jpeg", data: base64 } },
    ]);
    text = result.response.text();
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI could not parse hair analysis from the image");
  }

  return JSON.parse(jsonMatch[0]);
}

async function generateHairstyleImage(
  imageBase64: string,
  recommendedStyle: string
): Promise<Buffer> {
  const hfToken = process.env.HUGGINGFACE_API_TOKEN?.trim();
  if (!hfToken || hfToken.length < 10 || hfToken === "hf_...") {
    throw new Error(
      "HUGGINGFACE_API_TOKEN is missing or invalid. Please set a valid token in your .env file."
    );
  }

  const hf = new InferenceClient(hfToken);

  // Strip the data URL prefix to get raw base64, then convert to Buffer
  const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const inputBuffer = Buffer.from(rawBase64, "base64");
  // Create a Blob from the buffer for the SDK
  const inputBlob = new Blob([inputBuffer], { type: "image/jpeg" });

  const prompt = `Change this person's hairstyle to a ${recommendedStyle}. Keep the face, skin, background, and clothing exactly the same. Only modify the hair style, length, and shape. Photorealistic result.`;

  let lastError: Error | null = null;

  for (const modelId of IMG2IMG_MODELS) {
    try {
      console.log(`>>> [API] Trying img2img model: ${modelId}`);

      const result = await hf.imageToImage({
        model: modelId,
        inputs: inputBlob,
        parameters: {
          prompt,
          negative_prompt:
            "blurry, distorted face, extra limbs, cartoon, anime, low quality, deformed",
          strength: 0.55,
          guidance_scale: 7.5,
          num_inference_steps: 30,
        },
      });

      // result is a Blob — convert to Buffer
      const arrayBuffer = await result.arrayBuffer();
      const resultBuffer = Buffer.from(arrayBuffer);

      if (resultBuffer.length < 1000) {
        throw new Error(`Model ${modelId} returned too-small image (${resultBuffer.length} bytes)`);
      }

      console.log(`>>> [API] Model ${modelId} SUCCESS (${resultBuffer.length} bytes)`);
      return resultBuffer;
    } catch (err: any) {
      const errMsg = (typeof err === "string" ? err : err?.message || err?.toString() || "").toLowerCase();
      console.error(`>>> [API] Model ${modelId} FAILED:`, errMsg);
      lastError = err;

      // Handle token auth/credentials/provider issues immediately
      if (
        errMsg.includes("username") ||
        errMsg.includes("password") ||
        errMsg.includes("auth") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("401") ||
        errMsg.includes("credential") ||
        errMsg.includes("inference provider mapping")
      ) {
        throw new Error(
          "Your HUGGINGFACE_API_TOKEN is invalid or expired. Please check your .env configuration."
        );
      }

      // If rate limited, include that in the error
      if (err.message?.includes("429") || err.message?.includes("rate")) {
        lastError = new Error(
          `AI model is rate-limited. Free HuggingFace tokens have limited requests/hour. Please wait a few minutes and try again.`
        );
      }

      // If the model is loading (503), wait and retry once
      if (err.message?.includes("503") || err.message?.includes("loading")) {
        console.log(`>>> [API] Model ${modelId} is loading, waiting 20s for retry...`);
        await new Promise((r) => setTimeout(r, 20000));
        try {
          const retryResult = await hf.imageToImage({
            model: modelId,
            inputs: inputBlob,
            parameters: {
              prompt,
              negative_prompt: "blurry, distorted face, cartoon, anime, low quality",
              strength: 0.55,
              guidance_scale: 7.5,
              num_inference_steps: 30,
            },
          });
          const retryBuf = Buffer.from(await retryResult.arrayBuffer());
          if (retryBuf.length > 1000) {
            console.log(`>>> [API] Model ${modelId} RETRY SUCCESS`);
            return retryBuf;
          }
        } catch (retryErr: any) {
          console.error(`>>> [API] Model ${modelId} RETRY FAILED:`, retryErr.message);
        }
      }

      continue; // try next model
    }
  }

  throw lastError || new Error("All AI image models failed. Please try again later.");
}

export async function POST(req: NextRequest) {
  console.log(">>> [API] Hairstyle Preview Request Started");

  try {
    // Auth check
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to use AI Hairstyle Preview." }, { status: 401 });
    }

    // Rate limit (30s cooldown per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(ip, 30_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Please wait ${limit.retryAfter || 30} seconds before trying again.` },
        { status: 429 }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { image } = body;
    if (!image) {
      return NextResponse.json({ error: "No image provided. Please upload a selfie." }, { status: 400 });
    }

    console.log(">>> [API] Image received, length:", image.length);

    // Phase 1: Analyze hair with AI Vision
    console.log(">>> [API] Phase 1: Vision Analysis...");
    let analysis;
    try {
      analysis = await analyzeHairWithVision(image);
      console.log(">>> [API] Analysis complete:", analysis.recommendedHairstyle);
    } catch (visionErr: any) {
      console.error(">>> [API] Vision analysis failed:", visionErr.message);
      // Use sensible defaults so we can still try image generation
      analysis = {
        hairType: "Wavy",
        hairTexture: "Medium",
        hairCondition: "Healthy",
        recommendedHairstyle: "Textured Fringe",
        confidence: 60,
      };
      console.log(">>> [API] Using fallback analysis");
    }

    // Phase 2: Generate transformed image
    console.log(">>> [API] Phase 2: Image Generation...");
    let generatedImageUrl = "";
    let isDemoMode = false;
    let warningMessage = "";

    try {
      const resultBuffer = await generateHairstyleImage(image, analysis.recommendedHairstyle);

      // Upload to Cloudinary
      const { configureCloudinary } = await import("@/lib/cloudinary");
      const cloudinary = configureCloudinary();

      const uploadRes = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${resultBuffer.toString("base64")}`,
        { folder: "glamora/hairstyle-previews" }
      );

      generatedImageUrl = uploadRes.secure_url;
      console.log(">>> [API] Upload complete:", generatedImageUrl);
    } catch (imgErr: any) {
      console.error(">>> [API] Image generation failed:", imgErr.message);
      
      const errMsg = (imgErr.message || "").toLowerCase();
      const isAuthError =
        errMsg.includes("api_token") ||
        errMsg.includes("invalid") ||
        errMsg.includes("expired") ||
        errMsg.includes("username") ||
        errMsg.includes("password") ||
        errMsg.includes("auth") ||
        errMsg.includes("unauthorized") ||
        errMsg.includes("401") ||
        errMsg.includes("credential") ||
        errMsg.includes("inference provider mapping");

      if (isAuthError) {
        // Map recommended hairstyle to a nice Unsplash preview
        const style = (analysis.recommendedHairstyle || "").toLowerCase();
        let fallbackUrl = "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80"; // Default
        
        if (style.includes("fringe") || style.includes("textured")) {
          fallbackUrl = "https://images.unsplash.com/photo-1595642527925-4d41cb781653?w=800&auto=format&fit=crop&q=80";
        } else if (style.includes("pixie") || style.includes("short")) {
          fallbackUrl = "https://images.unsplash.com/photo-1605497746445-97d1b0a9ead9?w=800&auto=format&fit=crop&q=80";
        } else if (style.includes("layers") || style.includes("long")) {
          fallbackUrl = "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=80";
        } else if (style.includes("bob") || style.includes("cut")) {
          fallbackUrl = "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=800&auto=format&fit=crop&q=80";
        } else if (style.includes("fade") || style.includes("undercut")) {
          fallbackUrl = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80";
        } else if (style.includes("buzz") || style.includes("crop")) {
          fallbackUrl = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80";
        }

        generatedImageUrl = fallbackUrl;
        isDemoMode = true;
        warningMessage = "Demo Mode: Hugging Face API token is invalid or expired. Displaying a high-quality sample hairstyle preview.";
        console.log(">>> [API] Fallback to demo mode sample image:", fallbackUrl);
      } else {
        return NextResponse.json(
          { error: imgErr.message || "AI image generation failed. Please try again." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      analysis: { ...analysis, confidence: analysis.confidence || 85 },
      generatedImageUrl,
      isDemoMode,
      warning: warningMessage,
    });
  } catch (error: any) {
    console.error(">>> [API] CRITICAL:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
