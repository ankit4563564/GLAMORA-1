"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, FlipHorizontal, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type BeautyAICameraProps = {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

export function BeautyAICamera({ onCapture, onClose }: BeautyAICameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setReady(false);
      setError(null);
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          "Could not access camera. Allow permission in browser settings and try again."
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 640, 640);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-violet-500/30 bg-[#1A1C29]/70 shadow-ai-glow-sm backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-cream">
          <Camera className="h-4 w-4 text-cyan-400" />
          Live camera scan
        </p>
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="rounded-lg p-1 text-cream-muted hover:bg-white/5 hover:text-cream"
          aria-label="Close camera"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-col items-center p-6">
        {error ? (
          <p className="max-w-sm text-center text-sm text-rose">{error}</p>
        ) : (
          <>
            <div
              className={cn(
                "relative h-64 w-64 overflow-hidden rounded-full border-4 border-violet-500/50 shadow-ai-glow sm:h-72 sm:w-72",
                !ready && "animate-pulse-gold"
              )}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn(
                  "h-full w-full object-cover",
                  facingMode === "user" && "scale-x-[-1]"
                )}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/60">
                  <p className="text-xs text-cream-muted">Starting camera…</p>
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-cream-muted">
              Center your face in the ring — good lighting improves analysis
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!ready}
            onClick={() =>
              setFacingMode((f) => (f === "user" ? "environment" : "user"))
            }
          >
            <FlipHorizontal className="mr-2 h-4 w-4" />
            Flip
          </Button>
          <Button type="button" size="sm" disabled={!ready} onClick={capture}>
            Capture & Analyze
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
