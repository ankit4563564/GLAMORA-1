"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MoveHorizontal, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeClassName?: string;
  afterClassName?: string;
}

export function BeforeAfterSlider({ 
  beforeImage, 
  afterImage,
  beforeClassName,
  afterClassName
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset states when afterImage changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [afterImage]);

  // Add a safety timeout to prevent getting stuck
  useEffect(() => {
    if (!isLoading) return;
    
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 20000); // 20 seconds timeout for AI generation
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg cursor-ew-resize select-none bg-black/40"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Before Image (Background) - The "Old" Look */}
      <div className="absolute inset-0">
        <Image
          src={beforeImage}
          alt="Before"
          fill
          className={`object-cover ${beforeClassName || ""}`}
          unoptimized
          priority
        />
      </div>

      {/* After Image (Clipped) - The "New" Look */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ 
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          opacity: (isLoading || hasError) ? 0 : 1 
        }}
      >
        <img
          src={afterImage}
          alt="After"
          className={`h-full w-full object-cover transition-opacity duration-500 ${afterClassName || ""}`}
          onLoad={() => {
            console.log("AI Image Loaded Successfully");
            setIsLoading(false);
          }}
          onError={(e) => {
            console.error("AI Image Load Error:", e);
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
             <div className="relative h-12 w-12">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
                <div className="absolute inset-2 animate-spin-slow rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
             </div>
             <div className="text-center space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white">Generating AI Look</p>
                <p className="text-[10px] text-cream-muted">This may take up to 20 seconds...</p>
             </div>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
          <div className="flex flex-col items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <AlertCircle className="h-6 w-6 text-rose-500" />
             </div>
             <div className="space-y-1">
                <p className="text-sm font-bold text-white">AI Generation Timeout</p>
                <p className="text-xs text-cream-muted">The provider is taking longer than expected. Please try again.</p>
             </div>
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2 border-white/10 hover:bg-white/5"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Reload Page
             </Button>
          </div>
        </div>
      )}

      {/* Slider Line & Handle (Only show if not loading or error) */}
      {!isLoading && !hasError && (
        <div 
          className="absolute bottom-0 top-0 z-30 w-1 bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,1)] pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute inset-0 w-8 -left-4 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-violet-600 border-2 border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.5)] flex items-center justify-center pointer-events-auto transition-transform active:scale-90 hover:scale-110">
            <MoveHorizontal className="text-white h-5 w-5" />
          </div>
        </div>
      )}

      {/* Labels */}
      {!hasError && (
        <>
          <div className="absolute bottom-4 left-4 z-40 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
            Current
          </div>
          <div className="absolute bottom-4 right-4 z-40 px-3 py-1 rounded-full bg-violet-600/60 backdrop-blur-md border border-violet-400/30 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
            AI Preview
          </div>
        </>
      )}
    </div>
  );
}
