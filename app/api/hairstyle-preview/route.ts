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
  "gender": "string",
  "confidence": number
}
Focus exclusively on hairstyle recommendations and hair characteristics.`;

const IMG2IMG_MODELS = [
  "timbrooks/instruct-pix2pix",
  "prompthero/openjourney",
  "runwayml/stable-diffusion-v1-5",
  "stabilityai/sd-x2-latent-upscaler"
];

async function analyzeHairWithVision(image: string) {
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
      { inlineData: { mimeType: "image/jpeg", data: base64 } }
    ]);
    text = result.response.text();
  }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI could not parse hair analysis from the image");
  return JSON.parse(jsonMatch[0]);
}

async function generateHairstyleHF(imageBase64: string, recommendedStyle: string) {
  // Retrieve HuggingFace token – strip any surrounding quotes that Vercel may add
  let hfToken = process.env.HUGGINGFACE_API_TOKEN ?? "";
  hfToken = hfToken.replace(/^['"]|['"]$/g, "").trim();
  if (!hfToken) {
    throw new Error("HUGGINGFACE_API_TOKEN missing");
  }
  // Mask token in logs for safety
  console.log('>>> [API] Using HuggingFace token (masked):', hfToken.slice(0, 4) + '***' + hfToken.slice(-4));
  const hf = new InferenceClient(hfToken);
  const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const inputBlob = new Blob([Buffer.from(rawBase64, "base64")], { type: "image/jpeg" });
  const prompt = `Change this person's hairstyle to a ${recommendedStyle}. Keep the face, skin, background, and clothing exactly the same. Only modify the hair style, length, and shape. Photorealistic result.`;

  for (const modelId of IMG2IMG_MODELS) {
    try {
      const result = await hf.imageToImage({ model: modelId, inputs: inputBlob, parameters: { prompt, strength: 0.55, guidance_scale: 7.5, num_inference_steps: 30 } });
      const buf = Buffer.from(await result.arrayBuffer());
      if (buf.length > 1000) return buf;
    } catch (e: any) {
      const msg = (e.message || "").toLowerCase();
      // Stop early on auth errors
      if (msg.includes("invalid") || msg.includes("expired") || msg.includes("credential") || msg.includes("username") || msg.includes("password") || msg.includes("unauthorized") || msg.includes("401") || msg.includes("inference provider mapping")) {
        throw new Error("HF_AUTH_ERROR");
      }
    }
  }
  throw new Error("HF_GENERATION_FAILED");
}

function buildPollinationsUrl(analysis: { recommendedHairstyle: string; hairTexture: string; hairType: string; gender?: string }) {
  const genderTerm = analysis.gender?.toLowerCase().includes("female") ? "beautiful woman" : analysis.gender?.toLowerCase().includes("male") ? "handsome man" : "person";
  const prompt = `professional salon studio portrait of a ${genderTerm}, with a perfect ${analysis.recommendedHairstyle} hairstyle, ${analysis.hairTexture} ${analysis.hairType} hair, photorealistic, 8k quality, sharp focus, studio lighting, clean white background, ultra detailed hair, magazine quality, salon advertisement`;
  const seed = Math.floor(Math.random() * 1_000_000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&model=flux&nologo=true&enhance=true&seed=${seed}`;
}

export async function POST(req: NextRequest) {
  console.log(">>> [API] Hairstyle Preview Request Started");
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in to use AI Hairstyle Preview." }, { status: 401 });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(ip, 30_000);
    if (!limit.allowed) return NextResponse.json({ error: `Please wait ${limit.retryAfter || 30} seconds before trying again.` }, { status: 429 });
    const body = await req.json().catch(() => ({}));
    const { image } = body;
    if (!image) return NextResponse.json({ error: "No image provided. Please upload a selfie." }, { status: 400 });

    // Phase 1 – analysis
    let analysis;
    try {
      analysis = await analyzeHairWithVision(image);
    } catch (e) {
      console.error("Vision failed", e);
      analysis = { hairType: "Wavy", hairTexture: "Medium", hairCondition: "Healthy", recommendedHairstyle: "Textured Fringe", gender: "person", confidence: 60 };
    }

    // Phase 2 – try HF generation first
    let generatedImageUrl: string | undefined;
    let isDemoMode = false;
    let warning = "";
    try {
      const buf = await generateHairstyleHF(image, analysis.recommendedHairstyle);
      const { configureCloudinary } = await import("@/lib/cloudinary");
      const cloudinary = configureCloudinary();
      const uploadRes = await cloudinary.uploader.upload(`data:image/jpeg;base64,${buf.toString("base64")}`, { folder: "glamora/hairstyle-previews" });
      generatedImageUrl = uploadRes.secure_url;
    } catch (e: any) {
      const errMsg = (e.message || "").toLowerCase();
      if (errMsg.includes("hf_auth_error")) {
        warning = "Demo Mode: Hugging Face token invalid or expired – showing AI preview via Pollinations.";
        isDemoMode = true;
        generatedImageUrl = buildPollinationsUrl(analysis);
        console.log(">>> [API] Falling back to Pollinations.ai");
      } else {
        // Other errors – still fallback to Pollinations to keep UI functional
        warning = "AI generation issue – using Pollinations preview instead.";
        isDemoMode = true;
        generatedImageUrl = buildPollinationsUrl(analysis);
        console.log(">>> [API] HF generation failed, fallback to Pollinations");
      }
    }

    return NextResponse.json({
      analysis: { ...analysis, confidence: analysis.confidence || 85 },
      generatedImageUrl: generatedImageUrl!,
      isDemoMode,
      warning
    });
  } catch (err: any) {
    console.error(">>> [API] CRITICAL", err);
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
