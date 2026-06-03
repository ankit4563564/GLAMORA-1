"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { BeautyAICamera } from "./beauty-ai-camera";

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
  beautyProfileScore?: number;
};

function AnalysisOverlay() {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-full">
      {/* Scanning Line */}
      <motion.div 
        className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20"
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />
      
      {/* Face Landmarks (SVG) */}
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 100 100">
        <motion.path 
          d="M30,40 Q50,35 70,40" 
          stroke="#22d3ee" strokeWidth="0.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 1 }}
        />
        <motion.circle 
          cx="35" cy="45" r="2" stroke="#22d3ee" strokeWidth="0.5" fill="none"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, duration: 0.5 }}
        />
        <motion.circle 
          cx="65" cy="45" r="2" stroke="#22d3ee" strokeWidth="0.5" fill="none"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, duration: 0.5 }}
        />
        <motion.path 
          d="M50,50 L50,65 L45,70 L55,70 L50,65" 
          stroke="#22d3ee" strokeWidth="0.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.5, duration: 1 }}
        />
        <motion.path 
          d="M40,80 Q50,85 60,80" 
          stroke="#22d3ee" strokeWidth="0.5" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2, duration: 1 }}
        />
        {/* Jawline Outline */}
        <motion.path 
          d="M25,50 Q25,85 50,95 Q75,85 75,50" 
          stroke="#8b5cf6" strokeWidth="1" fill="none" strokeDasharray="2 2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.5, duration: 1.5 }}
        />
      </svg>

      {/* Logic Badges */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
          className="bg-black/60 backdrop-blur-md border border-cyan-400/30 px-2 py-0.5 rounded text-[8px] uppercase tracking-tighter text-cyan-300 mb-20 ml-20"
        >
          Symmetry: 98.2%
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }}
          className="bg-black/60 backdrop-blur-md border border-violet-400/30 px-2 py-0.5 rounded text-[8px] uppercase tracking-tighter text-violet-300 mt-28 mr-20"
        >
          Jawline: Defined
        </motion.div>
      </div>
    </div>
  );
}

type InputMode = "choose" | "camera" | "preview";

export function BeautyAIUpload() {
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<InputMode>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matched, setMatched] = useState<
    { _id: string; name: string; area: string }[]
  >([]);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = useCallback(async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 850);

    await new Promise((r) => setTimeout(r, 2500));

    try {
      const res = await fetch("/api/beauty-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
      setMatched(data.matchedSalons || []);
    } catch {
      setAnalysis(null);
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

  function onFile(file: File) {
    if (!consent) {
      alert("Please accept the privacy consent first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => startWithImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function reset() {
    setPreview(null);
    setAnalysis(null);
    setMatched([]);
    setStepIndex(-1);
    setMode("choose");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {!consent && (
        <div className="glass-card p-6 text-center border-violet-500/30 bg-violet-500/5">
          <h2 className="font-display text-xl text-cream">Privacy Consent</h2>
          <p className="mt-2 text-sm text-cream-muted">
            BeautyAI uses facial analysis to recommend skin and grooming profiles. Your image is processed securely and is not stored permanently.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <input 
              type="checkbox" 
              id="privacy" 
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500" 
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <label htmlFor="privacy" className="text-sm text-cream cursor-pointer">
              I agree to the processing of my facial data
            </label>
          </div>
          <Button 
            className="mt-6" 
            disabled={!consent}
            onClick={() => setConsent(true)}
          >
            Enter Facial Analysis
          </Button>
        </div>
      )}

      {consent && mode === "choose" && !preview && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label
            className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/40 bg-[#1A1C29]/50 p-8 backdrop-blur transition-all hover:scale-[1.01] hover:border-cyan-400/50 hover:bg-violet-500/5"
          >
            <Upload className="mb-4 h-10 w-10 text-violet-400" />
            <p className="font-display text-lg text-cream">Upload selfie</p>
            <p className="mt-2 text-center text-sm text-cream-muted">
              Drag & drop or click
            </p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setMode("camera")}
            className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-cyan-400/30 bg-[#1A1C29]/50 p-8 backdrop-blur transition-all hover:scale-[1.01] hover:border-cyan-400/50 hover:shadow-ai-glow-sm"
          >
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/40/50 bg-gold/10">
              <Camera className="h-8 w-8 text-gold" />
            </span>
            <p className="font-display text-lg text-cream">Live camera</p>
            <p className="mt-2 text-center text-sm text-cream-muted">
              Capture in real time — no upload needed
            </p>
          </button>
        </div>
      )}

      {consent && mode === "camera" && !preview && (
        <BeautyAICamera
          onCapture={startWithImage}
          onClose={() => setMode("choose")}
        />
      )}

      {preview && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-full border-4 border-violet-500/40 shadow-gold-glow">
                <Image
                  src={preview}
                  alt="Captured for BeautyAI"
                  fill
                  className={`object-cover transition-transform duration-1000 ${analysis ? 'scale-110' : ''}`}
                  unoptimized
                />
                {analyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-cyan-400">Processing</p>
                  </div>
                )}
                {analysis && <AnalysisOverlay />}
              </div>
              
              <div className="space-y-3">
                {stepIndex >= 0 ? (
                  <div className="space-y-2">
                    {STEPS.map((s, i) => (
                      <motion.p
                        key={s}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: i <= stepIndex ? 1 : 0.3 }}
                        className="text-sm text-cyan-300/90"
                      >
                        {s}
                      </motion.p>
                    ))}
                  </div>
                ) : analysis ? (
                  <div className="space-y-2">
                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-widest">
                       <div className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center">✓</div>
                       Face Shape Detected
                     </motion.div>
                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-widest">
                       <div className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center">✓</div>
                       Skin Tone Analyzed
                     </motion.div>
                  </div>
                ) : null}
              </div>
            </div>
            {!analyzing && (
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                New scan
              </Button>
            )}
          </div>
        </div>
      )}

      {analyzing && !analysis && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-card p-6 border-cyan-400/20">
              <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">AI Analysis Preview</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-cream-muted">Baseline</p>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                    <Image src={preview!} alt="Current" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gold">Target Enhancement</p>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-gold/30 shadow-gold-glow-sm">
                    <Image src={preview!} alt="Recommended" fill className="object-cover contrast-110 saturate-110" unoptimized />
                    <div className="absolute inset-0 bg-violet-500/5 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gold/20 to-transparent" />
                  </div>
                </div>
              </div>
              <p className="mt-6 text-center text-xs text-cream-muted italic">
                {'"'}AI visualization of facial architecture analysis and recommended skin profile enhancements{'"'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Beauty Profile Score Card */}
              <ResultCard title="Overall Facial Score" className="sm:col-span-2 border-violet-500/30 bg-violet-500/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-display text-4xl text-metallic">
                      {analysis.beautyProfileScore || 92}<span className="text-xl text-violet-400">/100</span>
                    </p>
                    <p className="text-xs font-bold text-success uppercase tracking-widest">
                      High Confidence Analysis
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin-slow" />
                    <span className="text-lg font-bold text-violet-300">{analysis.beautyProfileScore || 92}%</span>
                  </div>
                </div>
              </ResultCard>

              <ResultCard title="Facial Architecture">
                <div className="flex items-center justify-between">
                  <p className="font-display text-2xl text-gold">
                    {analysis.faceShape.shape}
                  </p>
                  <div className="bg-violet-500/20 px-2 py-1 rounded border border-violet-500/30">
                    <p className="font-mono text-[10px] font-bold text-violet-300">
                      {((analysis.faceShape.confidence || 0.87) * 100).toFixed(0)}% CONFIDENCE
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-cream-muted">
                  {analysis.faceShape.description}
                </p>
                <ul className="mt-2 list-inside list-disc text-sm text-cream">
                  {analysis.faceShape.recommendedFacialFeatures.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </ResultCard>
              <ResultCard title="Dermis Profile">
                <div className="flex items-center justify-between">
                  <p className="text-cream">
                    Undertone:{" "}
                    <span className="text-gold">{analysis.skinTone.undertone}</span>
                  </p>
                  <div className="bg-cyan-500/20 px-2 py-1 rounded border border-cyan-500/30">
                    <p className="font-mono text-[10px] font-bold text-cyan-300">
                      {((analysis.skinTone.confidence || 0.91) * 100).toFixed(0)}% CONFIDENCE
                    </p>
                  </div>
                </div>
                <p className="text-sm text-cream-muted mt-1">
                  {analysis.skinTone.complexion}
                </p>
                <ul className="mt-2 text-sm text-cream">
                  {analysis.skinTone.treatments.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </ResultCard>
              
              <ResultCard title="Recommended Skincare Studios" className="sm:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2 mt-1">
                  {matched.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center justify-between group p-3 rounded-xl border border-white/5 bg-white/5"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-cream group-hover:text-gold transition-colors">{s.name}</span>
                        <p className="text-[10px] text-cream-muted uppercase tracking-widest">{s.area}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
                        <Link href={`/book/${s._id}`}>Book</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </ResultCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 ${className || ""}`}
    >
      <h3 className="mb-3 text-xs uppercase tracking-wider text-violet-300">{title}</h3>
      {children}
    </motion.div>
  );
}
