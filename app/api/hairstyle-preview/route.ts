import { NextRequest, NextResponse } from "next/server";
import { getVisionModel } from "@/lib/gemini";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Long timeout for image generation

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
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    // Step 1: Analyze with Gemini Vision
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

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from AI");
    }
    const analysis = JSON.parse(jsonMatch[0]);

    // Step 2: Generate Edited Image
    // In a real production app, you would call Stability AI, Replicate, or a similar service.
    // For this implementation, we will simulate the process and provide a high-quality preview.
    // We'll use a placeholder logic that would be replaced by a real API call.
    
    const generatedImageUrl = await simulateHairstyleGeneration(image, analysis.recommendedHairstyle);

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

async function simulateHairstyleGeneration(originalImage: string, style: string): Promise<string> {
  // This is where you'd call Stability AI's Image-to-Image API.
  // Example call (commented out as it requires an API key):
  /*
  const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-v1-6/image-to-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: `Transform this person's hairstyle into a ${style}. Preserve identity, facial structure, skin tone, clothing, lighting and background. Only modify the hairstyle. Photorealistic salon makeover. High quality beauty industry preview.`,
          weight: 1,
        },
      ],
      init_image: originalImage,
      image_strength: 0.35,
    }),
  });
  */

  // For the purpose of this demonstration/prototype, we'll return the original image 
  // but in a production environment, this would be the URL or base64 of the generated image.
  // We'll simulate a delay to mimic the generation process.
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  // Returning the original image for now as a fallback. 
  // To truly see the effect, a real image generation API is needed.
  return originalImage; 
}
