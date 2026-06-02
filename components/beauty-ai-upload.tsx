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
    recommendedStyles: string[];
  };
  skinTone: {
    undertone: string;
    complexion: string;
    treatments: string[];
  };
  hairTexture: {
    type: string;
    condition: string;
    treatments: string[];
  };
};

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
            BeautyAI uses facial analysis to recommend grooming styles. Your image is processed securely and is not stored permanently on our servers.
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
            Enter BeautyAI
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
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-full border-4 border-violet-500/40 shadow-gold-glow">
                <Image
                  src={preview}
                  alt="Captured for BeautyAI"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {analyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-cyan-400">Processing</p>
                  </div>
                )}
              </div>
              {stepIndex >= 0 && (
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
              )}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <ResultCard title="Facial Architecture">
              <p className="font-display text-2xl text-gold">
                {analysis.faceShape.shape}
              </p>
              <p className="font-mono text-sm text-cream-muted">
                Confidence {(analysis.faceShape.confidence * 100).toFixed(0)}%
              </p>
              <p className="mt-2 text-sm text-cream-muted">
                {analysis.faceShape.description}
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-cream">
                {analysis.faceShape.recommendedStyles.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </ResultCard>
            <ResultCard title="Dermis Profile">
              <p className="text-cream">
                Undertone:{" "}
                <span className="text-gold">{analysis.skinTone.undertone}</span>
              </p>
              <p className="text-sm text-cream-muted">
                {analysis.skinTone.complexion}
              </p>
              <ul className="mt-2 text-sm text-cream">
                {analysis.skinTone.treatments.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </ResultCard>
            <ResultCard title="Strand Analytics">
              <p className="text-cream">
                {analysis.hairTexture.type} · {analysis.hairTexture.condition}
              </p>
              <ul className="mt-2 text-sm text-cream">
                {analysis.hairTexture.treatments.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </ResultCard>
            <ResultCard title="Curated Matches">
              {matched.map((s) => (
                <div
                  key={s._id}
                  className="mb-2 flex items-center justify-between border-b border-border pb-2"
                >
                  <span className="text-sm text-cream">{s.name}</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/book/${s._id}`}>Book</Link>
                  </Button>
                </div>
              ))}
            </ResultCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h3 className="mb-3 text-xs uppercase tracking-wider text-violet-300">{title}</h3>
      {children}
    </motion.div>
  );
}
