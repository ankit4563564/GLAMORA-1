"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ComparisonSliderProps {
  before: string;
  after: string;
  labelBefore?: string;
  labelAfter?: string;
}

export function ComparisonSlider({ 
  before, 
  after, 
  labelBefore = "Original", 
  labelAfter = "AI Style" 
}: ComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e 
      ? e.touches[0].clientX - rect.left 
      : (e as React.MouseEvent).clientX - rect.left;
    
    const position = (x / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, position)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-3xl border-4 border-violet-500/20 shadow-2xl cursor-col-resize select-none"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <Image 
        src={after} 
        alt={labelAfter} 
        fill 
        className="object-cover"
        unoptimized
      />
      <div className="absolute bottom-4 right-4 z-10 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
        {labelAfter}
      </div>

      {/* Before Image (Overlay) */}
      <div 
        className="absolute inset-0 z-20 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <div className="relative h-full w-[100/sliderPos*100%] min-w-[300px]">
          <Image 
            src={before} 
            alt={labelBefore} 
            fill 
            className="object-cover"
            style={{ width: containerRef.current?.offsetWidth || "100%" }}
            unoptimized
          />
          <div className="absolute bottom-4 left-4 z-30 rounded-full bg-violet-600/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest border border-white/20">
            {labelBefore}
          </div>
        </div>
      </div>

      {/* Slider Line/Handle */}
      <div 
        className="absolute top-0 bottom-0 z-40 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-xl">
          <div className="flex gap-1">
            <div className="h-4 w-0.5 bg-violet-600 rounded-full" />
            <div className="h-4 w-0.5 bg-violet-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
