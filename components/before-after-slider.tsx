"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg cursor-ew-resize select-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) - The "New" Look */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt="After"
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Before Image (Clipped) - The "Current" Look */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt="Before"
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Slider Line & Handle */}
      <div 
        className="absolute bottom-0 top-0 z-20 w-1 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-violet-600 border-2 border-white/20 shadow-lg flex items-center justify-center pointer-events-auto">
          <MoveHorizontal className="text-white h-5 w-5" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 z-30 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
        Current Look
      </div>
      <div className="absolute bottom-4 right-4 z-30 px-3 py-1 rounded-full bg-violet-600/60 backdrop-blur-md border border-violet-400/30 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
        AI Preview
      </div>
    </div>
  );
}
