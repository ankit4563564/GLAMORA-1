"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Camera, 
  RotateCcw, 
  AlertCircle, 
  Sparkles, 
  Heart, 
  Share2, 
  Check, 
  ArrowRight,
  User,
  Zap
} from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { BeautyAICamera } from "./beauty-ai-camera";
import { useToast } from "./ui/toast";
import { ComparisonSlider } from "./beauty-ai-comparison";
import { HAIRSTYLES, hairstyleImageUrl } from "@/lib/hairstyles";

const STEPS = [
  "Analyzing facial geometry…",
  "Detecting tone profiles…",
  "Evaluating strand density…",
];

type Analysis = {
  faceShape: {
    shape: string;
    confidence: number;
    description: string;
    recommendedFacialFeatures: string[];
  };
  skinTone: {
    undertone: string;
    confidence: number;
    complexion: string;
    treatments: string[];
  };
  styleCompatibilityScore?: number;
};

function AnalysisOverlay() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-full">
      <motion.div 
        className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20"
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 100 100">
        <motion.path d="M30,40 Q50,35 70,40" stroke="#22d3ee" strokeWidth="0.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
        <motion.circle cx="35" cy="45" r="2" stroke="#22d3ee" strokeWidth="0.5" fill="none" />
        <motion.circle cx="65" cy="45" r="2" stroke="#22d3ee" strokeWidth="0.5" fill="none" />
        <motion.path d="M25,50 Q25,85 50,95 Q75,85 75,50" stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

export function BeautyAIUpload() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [consent, setConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [mode, setMode] = useState<"choose" | "camera" | "preview">("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matched, setMatched] = useState<{ _id: string; name: string; area: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedStyles, setSavedStyles] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("glamora-saved-styles") || "[]");
    setSavedStyles(saved);
  }, []);

  const saveStyle = (styleId: string) => {
    const newSaved = [...savedStyles, styleId];
    setSavedStyles(newSaved);
    localStorage.setItem("glamora-saved-styles", JSON.stringify(newSaved));
    toastSuccess("Style saved to your profile!");
  };

  const shareResult = () => {
    const text = `I just got my style analysis from Glamora! My style confidence score is ${analysis?.styleCompatibilityScore || 92}%. Check it out!`;
    navigator.clipboard.writeText(text);
    toastInfo("Summary copied to clipboard!");
  };

  const runAnalysis = useCallback(async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    setError(null);
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 850);

    try {
      const res = await fetch("/api/beauty-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed`);
      setAnalysis(data.analysis);
      setMatched(data.matchedSalons || []);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      clearInterval(interval);
      setStepIndex(-1);
      setAnalyzing(false);
    }
  }, []);

  function startWithImage(dataUrl: string) {
    if (!consent) return;
    setPreview(dataUrl);
    setMode("preview");
    runAnalysis(dataUrl);
  }

  function reset() {
    setPreview(null);
    setAnalysis(null);
    setMatched([]);
    setStepIndex(-1);
    setError(null);
    setMode("choose");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {!consent && (
        <div className="glass-card p-6 text-center border-violet-500/30 bg-violet-500/5">
          <h2 className="font-display text-xl text-cream">Privacy Consent</h2>
          <p className="mt-2 text-sm text-cream-muted">
            BeautyAI uses facial analysis to recommend grooming profiles. Your image is processed securely.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <input type="checkbox" id="privacy" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="accent-violet-500" />
            <label htmlFor="privacy" className="text-sm text-cream">I agree to facial processing</label>
          </div>
          <Button className="mt-6" disabled={!consentChecked} onClick={() => setConsent(true)}>
            Enter Facial Analysis
          </Button>
        </div>
      )}

      {consent && mode === "choose" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/40 bg-[#1A1C29]/50 p-8 backdrop-blur hover:bg-violet-500/5">
            <Upload className="mb-4 h-10 w-10 text-violet-400" />
            <p className="font-display text-lg text-cream">Upload selfie</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && startWithImage(URL.createObjectURL(e.target.files[0]))} />
          </label>
          <button onClick={() => setMode("camera")} className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-cyan-400/30 bg-[#1A1C29]/50 p-8 backdrop-blur hover:shadow-ai-glow-sm">
            <Camera className="mb-4 h-10 w-10 text-gold" />
            <p className="font-display text-lg text-cream">Live camera</p>
          </button>
        </div>
      )}

      {consent && mode === "camera" && (
        <BeautyAICamera onCapture={startWithImage} onClose={() => setMode("choose")} />
      )}

      {preview && (
        <div className="space-y-12">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="w-full max-w-sm shrink-0">
               {analysis ? (
                 <ComparisonSlider 
                   before={preview} 
                   after={hairstyleImageUrl(HAIRSTYLES[0].unsplashPhotoId)} 
                 />
               ) : (
                 <div className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-violet-500/40">
                    <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                    {analyzing && <AnalysisOverlay />}
                 </div>
               )}
            </div>
            
            <div className="flex-1 space-y-6 text-center lg:text-left">
              {analyzing ? (
                <div className="space-y-4">
                  <h2 className="font-display text-3xl text-white">Generating Style Report</h2>
                  <div className="flex flex-col gap-2">
                    {STEPS.map((s, i) => (
                      <p key={i} className={cn("text-sm transition-opacity", i <= stepIndex ? "text-cyan-400" : "text-white/20")}>{s}</p>
                    ))}
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4 lg:items-start">
                    <div className="rounded-full bg-violet-600/20 border border-violet-500/30 px-4 py-1 text-xs font-bold text-violet-300 uppercase tracking-widest">
                      Style Confidence Score: {analysis.styleCompatibilityScore || 92}%
                    </div>
                    <h2 className="font-display text-4xl text-white">Your Analysis is Ready</h2>
                    <p className="text-cream-muted max-w-md">We&apos;ve analyzed your {analysis.faceShape.shape.toLowerCase()} facial structure and matched you with premium styles in Bangalore.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                    <Button onClick={shareResult} variant="outline" className="gap-2">
                      <Share2 size={16} /> Share Result
                    </Button>
                    <Button onClick={reset} variant="ghost" className="gap-2 text-cream-muted">
                      <RotateCcw size={16} /> New Scan
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              {/* Profile Grid */}
              <div className="grid gap-4 sm:grid-cols-3">
                <ResultCard title="Skin Type" icon={<Zap size={14} className="text-cyan-400" />}>
                  <p className="text-lg font-display text-white">{analysis.skinTone.complexion}</p>
                  <p className="text-xs text-cream-muted mt-1">{analysis.skinTone.undertone} undertones detected.</p>
                </ResultCard>
                <ResultCard title="Hair Type" icon={<Sparkles size={14} className="text-violet-400" />}>
                  <p className="text-lg font-display text-white">{analysis.faceShape.shape}</p>
                  <p className="text-xs text-cream-muted mt-1">Symmetrical features observed.</p>
                </ResultCard>
                <ResultCard title="Recommendation" icon={<Check size={14} className="text-emerald-400" />}>
                  <p className="text-lg font-display text-white">{analysis.skinTone.treatments[0]}</p>
                  <p className="text-xs text-cream-muted mt-1">High compatibility with current texture.</p>
                </ResultCard>
              </div>

              {/* Hairstyle Gallery */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl text-white">Signature Hairstyle Gallery</h3>
                  <p className="text-xs text-cream-muted">Top 6 styles for {analysis.faceShape.shape} faces</p>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {HAIRSTYLES.slice(0, 6).map((style) => (
                    <motion.div 
                      key={style.id}
                      whileHover={{ y: -5 }}
                      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]"
                    >
                      <Image 
                        src={hairstyleImageUrl(style.unsplashPhotoId)} 
                        alt={style.name} 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <p className="text-sm font-bold text-white">{style.name}</p>
                        <div className="mt-2 flex gap-2">
                          <button 
                            onClick={() => saveStyle(style.id)}
                            className="flex-1 rounded-lg bg-white/10 backdrop-blur-md py-1.5 text-[10px] font-bold text-white hover:bg-violet-600 transition-colors"
                          >
                            {savedStyles.includes(style.id) ? "SAVED" : "SAVE"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Treatment Cards */}
              <div className="space-y-6">
                 <h3 className="font-display text-2xl text-white">Recommended Dermal Rituals</h3>
                 <div className="grid gap-4 sm:grid-cols-2">
                   {analysis.skinTone.treatments.map((t, i) => (
                     <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-violet-500/30">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                          <Zap size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{t}</p>
                          <p className="text-xs text-cream-muted">Optimized for {analysis.skinTone.complexion.toLowerCase()} skin profiles.</p>
                        </div>
                        <ArrowRight size={16} className="text-cream-muted" />
                     </div>
                   ))}
                 </div>
              </div>

              {/* Studios */}
              {matched.length > 0 && (
                <div className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-8 text-center">
                   <h3 className="font-display text-2xl text-white">Available in Bangalore Studios</h3>
                   <p className="text-cream-muted mt-2">These enclaves are equipped for your recommended treatments.</p>
                   <div className="mt-6 flex flex-wrap justify-center gap-3">
                     {matched.map(s => (
                       <Button key={s._id} variant="outline" asChild>
                         <Link href={`/book/${s._id}`}>{s.name} · {s.area}</Link>
                       </Button>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cream-muted">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
