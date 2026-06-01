import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getMarketingModel } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const FALLBACK = [
  "✨ Monsoon-ready hair rituals now at your studio. Book before slots fill — link in bio. #BangaloreBeauty #Glamora",
  "Rain outside, glow inside. Exclusive monsoon scalp detox + 20% off first visit this week. DM to reserve.",
  "Tech city, tired strands? Our Ayurvedic monsoon recovery package restores shine in 60 mins. Tap to book on Glamora.",
];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) || "user";
  if (role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const { prompt, channel } = await req.json();

  try {
    const model = getMarketingModel();
    const result = await model.generateContent(
      `Generate exactly 3 distinct high-converting ${channel} marketing copy variations for a premium Bangalore salon. Promotion: ${prompt}. Return ONLY a JSON array of 3 strings, no markdown.`
    );
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const copies = JSON.parse(match[0]);
      return NextResponse.json({ copies });
    }
  } catch {
    /* fallback */
  }

  return NextResponse.json({ copies: FALLBACK });
}
