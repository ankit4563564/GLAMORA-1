import { BeautyAIUpload } from "@/components/beauty-ai-upload";
import { PageTransition } from "@/components/page-transition";
import { AIGlowPanel } from "@/components/ai-glow-panel";
import { HairstyleTryOn } from "@/components/hairstyle-try-on";

export default function BeautyAIPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-violet-300/80">
            Vision AI
          </p>
          <h1 className="font-display text-4xl text-metallic">BeautyAI</h1>
          <p className="mt-2 text-cream-muted">
            Upload a selfie or use live camera — Gemini Vision pairs you with
            Bangalore&apos;s finest studios.
          </p>
        </div>

        <HairstyleTryOn />

        <div className="space-y-6">
          <h2 className="font-display text-2xl text-white">Advanced Facial Analysis</h2>
          <AIGlowPanel className="p-6">
            <BeautyAIUpload />
          </AIGlowPanel>
        </div>
      </div>
    </PageTransition>
  );
}
