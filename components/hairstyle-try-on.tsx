"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Sparkles, Download, RefreshCw, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { BeforeAfterSlider } from "./before-after-slider";
import { HairstylePreviewResponse } from "@/lib/hairstyle-types";

const LOADING_STEPS = [
  "Analyzing face geometry...",
  "Choosing perfect style...",
  "Generating AI preview...",
  "Rendering transformation...",
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
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<HairstylePreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image too large. Please upload a photo under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const compressed = await compressImage(reader.result as string);
        setOriginalImage(compressed);
        setError(null);
        generatePreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePreview = async (image: string) => {
    setLoading(true);
    setError(null);
    setPreviewData(null);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 3000);

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
      
      if (!data.generatedImageUrl) {
        throw new Error("AI did not return a generated image. Please try again.");
      }
      
      setPreviewData(data);
      setRetryCount(0);
    } catch (err: any) {
      console.error("AI Preview Error:", err);
      
      // Provide user-friendly error messages
      let userMessage = err.message || "Something went wrong. Please try again.";
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes("rate")) {
        userMessage = "AI is rate-limited. Free API tokens have limited requests per hour. Please wait a few minutes and try again.";
      } else if (
        lowerMessage.includes("token") ||
        lowerMessage.includes("username") ||
        lowerMessage.includes("password") ||
        lowerMessage.includes("auth") ||
        lowerMessage.includes("credential") ||
        lowerMessage.includes("unauthorized") ||
        lowerMessage.includes("inference provider mapping")
      ) {
        userMessage = "AI API token issue. The Hugging Face token may be expired, invalid, or lacks permissions. Please check your .env configuration.";
      } else if (lowerMessage.includes("401") || lowerMessage.includes("unauthorized") || lowerMessage.includes("sign in")) {
        userMessage = "Please sign in to use AI Hairstyle Preview.";
      }
      
      setError(userMessage);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (originalImage) {
      setRetryCount((c) => c + 1);
      generatePreview(originalImage);
    }
  };

  const downloadPreview = () => {
    if (!previewData) return;
    const link = document.createElement("a");
    link.href = previewData.generatedImageUrl;
    link.download = "glamora-hairstyle-preview.jpg";
    link.click();
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
          <h2 className="font-display text-2xl text-white">AI Hairstyle Preview</h2>
          <p className="text-sm text-cream-muted">Upload a selfie and AI will transform your hairstyle in real-time</p>
        </div>
        <Sparkles className="h-6 w-6 text-gold animate-pulse" />
      </div>

      {/* Upload Area */}
      {!originalImage && !loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-500/40 bg-[#1A1C29]/50 p-8 transition-all hover:border-cyan-400/50 hover:bg-violet-500/5">
            <Upload className="mb-4 h-8 w-8 text-violet-400" />
            <p className="font-display text-lg text-cream">Upload Selfie</p>
            <p className="mt-1 text-center text-xs text-cream-muted">JPG, PNG — Max 5MB</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          <button 
             onClick={() => alert("Live camera feature coming soon to this section!")}
             className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-white/5 bg-[#1A1C29]/50 p-8 transition-all hover:bg-white/5"
          >
            <Camera className="mb-4 h-8 w-8 text-cream-muted" />
            <p className="font-display text-lg text-cream-muted">Live Camera</p>
            <p className="mt-1 text-center text-xs text-cream-muted/60">Coming soon</p>
          </button>
        </div>
      )}

      {/* Loading State */}
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
              This may take 15–45 seconds depending on AI provider load
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
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
          {retryCount < 3 && originalImage && (
            <p className="mt-2 text-xs text-cream-muted">
              Retry attempt {retryCount + 1} of 3
            </p>
          )}
          <div className="mt-4 flex gap-3">
            {originalImage && retryCount < 3 && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-rose-500/30 hover:bg-rose-500/10"
                onClick={handleRetry}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fullReset}>
              Upload New Photo
            </Button>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {previewData && originalImage && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300">Before / After Slider</h3>
                <span className="text-[10px] text-cream-muted">Slide to compare</span>
            </div>
            <BeforeAfterSlider 
              beforeImage={originalImage} 
              afterImage={previewData.generatedImageUrl} 
            />
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-6 rounded-2xl border border-white/10 bg-black/40 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">Recommended Style</p>
                <h4 className="mt-1 font-display text-3xl text-gold">{previewData.analysis.recommendedHairstyle}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Hair Type & Texture</p>
                  <p className="text-sm text-cream font-medium">{previewData.analysis.hairType} · {previewData.analysis.hairTexture}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Condition</p>
                  <p className="text-sm text-cream font-medium">{previewData.analysis.hairCondition}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">AI Transformation Insight</p>
                <div className="flex items-start gap-2 rounded-lg bg-violet-500/5 p-3 text-xs text-cream-muted border border-violet-500/10">
                   <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                   <p>Based on your {previewData.analysis.hairTexture.toLowerCase()} hair texture, this {previewData.analysis.recommendedHairstyle.toLowerCase()} style adds the perfect amount of definition and volume.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => generatePreview(originalImage)}
                variant="ai" 
                className="flex-1 min-w-[160px] gap-2 shadow-ai-glow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Generate New Style
              </Button>
              <Button 
                onClick={downloadPreview}
                variant="outline" 
                className="flex-1 min-w-[160px] gap-2 border-white/10 hover:bg-white/5"
              >
                <Download className="h-4 w-4" />
                Download Preview
              </Button>
            </div>
            
            <button 
                onClick={fullReset}
                className="text-center text-xs text-cream-muted hover:text-white transition-colors"
            >
                Reset and upload new photo
            </button>
          </div>
        </motion.div>
      )}
    </section>
  );
}
