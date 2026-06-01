"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AIGlowPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-500/25 bg-[#1A1C29]/70 shadow-ai-glow backdrop-blur-md",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.2), transparent 40%, rgba(34,211,238,0.15))",
        }}
      />
      <div className="relative flex min-h-0 h-full w-full flex-col">{children}</div>
    </motion.div>
  );
}
