"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Sparkles, RefreshCw, AlertCircle, MapPin, Star, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { useToast } from "./ui/toast";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";

const LOADING_STEPS = [
  "Analyzing facial structure & face shape...",
  "Identifying hair type & texture...",
  "Matching with expert-recommended styles...",
  "Finding top salons in Bangalore for you...",
];

async function compressImage(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const maxSide = 768;
      
      if (width > height) {
        if (width > maxSide) {
          height *= maxSide / width;
          width = maxSide;
        }
      } else {
        if (height > maxSide) {
          width *= maxSide / height;
          height = maxSide;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = base64;
  });
}

export function HairstyleTryOn() {
  const { info: toastInfo } = useToast();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<HairstylePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image too large. Please upload a photo under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string);
        setOriginalImage(compressed);
        setError(null);
        generateRecommendations(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRecommendations = async (image: string) => {
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const res = await fetch("/api/hairstyle-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setPreviewData(data);
      setRetryCount(0);
    } catch (err: any) {
      console.error("Recommendation Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (originalImage) {
      setRetryCount((c) => c + 1);
      generateRecommendations(originalImage);
    }
  };

  const fullReset = () => {
    setOriginalImage(null);
    setPreviewData(null);
    setError(null);
    setLoading(false);
    setStepIndex(0);
    setRetryCount(0);
  };

  return (
    <section className="space-y-8 rounded-3xl border border-white/10 bg-[#12131C]/50 p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">AI Style Recommendations</h2>
          <p className="text-sm text-cream-muted">Upload a selfie and AI will find the perfect hairstyles for your face shape</p>
        </div>
        <Sparkles className="h-6 w-6 text-gold animate-pulse" />
      </div>

      {!originalImage && !loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/40 bg-[#1A1C29]/50 p-8 transition-all hover:border-cyan-400/50 hover:bg-violet-500/5">
            <Upload className="mb-4 h-8 w-8 text-violet-400" />
            <p className="font-display text-lg text-cream">Upload Selfie</p>
            <p className="mt-1 text-center text-xs text-cream-muted">JPG, PNG — Max 5MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <button 
             onClick={() => toastInfo("Live camera feature coming soon!")}
             className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-white/5 bg-[#1A1C29]/50 p-8 transition-all hover:bg-white/5"
          >
            <Camera className="mb-4 h-8 w-8 text-cream-muted" />
            <p className="font-display text-lg text-cream-muted">Live Camera</p>
            <p className="mt-1 text-center text-xs text-cream-muted/60">Coming soon</p>
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-8 h-32 w-32">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
            <div className="absolute inset-4 animate-spin-slow rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-gold animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.p
                key={LOADING_STEPS[stepIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-medium text-cream"
              >
                {LOADING_STEPS[stepIndex]}
              </motion.p>
            </AnimatePresence>
            <div className="flex justify-center gap-1">
              {LOADING_STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-8 rounded-full transition-all duration-500 ${i <= stepIndex ? "bg-violet-500" : "bg-white/10"}`} 
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-cream-muted">
              Matching your unique profile with our expert database...
            </p>
          </div>
        </div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/5 py-8 px-6 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
            <AlertCircle className="h-7 w-7 text-rose-400" />
          </div>
          <p className="max-w-md text-sm font-medium text-rose-300">{error}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button variant="outline" size="sm" onClick={fullReset}>
              Upload New Photo
            </Button>
          </div>
        </motion.div>
      )}

      {previewData && originalImage && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-10"
        >
          {/* Analysis Summary */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-2xl border-2 border-violet-500/20">
                <Image src={originalImage} alt="Analysis Source" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-violet-500/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    ANALYZED
                </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300 border border-violet-500/20">
                AI Vision Report
              </div>
              <h3 className="font-display text-3xl text-white">Your Beauty Profile</h3>
              
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <AnalysisCard label="Face Shape" value={previewData.analysis.faceShape} icon={<MapPin className="h-3 w-3" />} />
                <AnalysisCard label="Hair Type" value={previewData.analysis.hairType} />
                <AnalysisCard label="Texture" value={previewData.analysis.hairTexture} />
                <AnalysisCard label="Confidence" value={`${Math.round(previewData.analysis.confidence)}%`} />
              </div>
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl text-gold">Recommended Styles</h3>
                <p className="text-xs text-cream-muted">Based on your {previewData.analysis.faceShape.toLowerCase()} face shape</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {previewData.recommendations.map((rec) => (
                    <motion.div 
                        key={rec.id}
                        whileHover={{ y: -4 }}
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]/40 transition-all hover:border-violet-500/30 hover:bg-[#1A1C29]/60"
                    >
                        <div className="relative h-56 w-full">
                            <Image src={rec.imageUrl} alt={rec.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#12131C] via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <h4 className="font-display text-xl text-white">{rec.name}</h4>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Top salons in Bangalore</p>
                                <span className="text-[10px] text-violet-400 font-semibold">Available Today</span>
                            </div>

                            <div className="space-y-3">
                                {rec.matchedSalons.map((salon) => (
                                    <Link 
                                        key={salon._id} 
                                        href={`/salons/${salon._id}`}
                                        className="flex items-center justify-between rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-display">
                                                {salon.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-cream">{salon.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-cream-muted">{salon.area}</p>
                                                    <span className="text-[8px] text-white/20">•</span>
                                                    <div className="flex items-center gap-0.5">
                                                        <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                                                        <span className="text-[10px] font-medium text-gold">{salon.rating}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-cream-muted group-hover:text-violet-400 transition-colors" />
                                    </Link>
                                ))}
                            </div>

                            <Button 
                                asChild
                                className="w-full gap-2 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-900/20"
                            >
                                <Link href={`/salons?search=${rec.name}`}>
                                    Book This Style
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
          </div>
          
          <div className="flex justify-center">
            <button 
                onClick={fullReset}
                className="text-sm text-cream-muted hover:text-white transition-colors"
            >
                Reset and upload new photo
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}

function AnalysisCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cream-muted">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-sm font-semibold text-white">{value}</p>
        </div>
    );
}
