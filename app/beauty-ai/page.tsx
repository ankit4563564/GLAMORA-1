"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ScanFace } from "lucide-react";
import { BeautyAIUpload } from "@/components/beauty-ai-upload";
import { PageTransition } from "@/components/page-transition";
import { AIGlowPanel } from "@/components/ai-glow-panel";
import { HairstyleTryOn } from "@/components/hairstyle-try-on";

type Tab = "hairstyle" | "facial";

export default function BeautyAIPage() {
  const [activeTab, setActiveTab] = useState<Tab>("hairstyle");

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-violet-300/80">
            Vision AI
          </p>
          <h1 className="font-display text-4xl text-metallic">BeautyAI</h1>
          <p className="mt-2 text-cream-muted">
            AI-powered beauty analysis and hairstyle transformation — see your
            new look before you book.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl border border-white/10 bg-[#12131C]/60 p-1 backdrop-blur-md">
          <TabButton
            active={activeTab === "hairstyle"}
            onClick={() => setActiveTab("hairstyle")}
            icon={<Sparkles className="h-4 w-4" />}
            label="AI Hairstyle Preview"
            description="Transform your hair with AI"
          />
          <TabButton
            active={activeTab === "facial"}
            onClick={() => setActiveTab("facial")}
            icon={<ScanFace className="h-4 w-4" />}
            label="Facial Analysis"
            description="Face shape & skin profiling"
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "hairstyle" && (
            <motion.div
              key="hairstyle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <HairstyleTryOn />
            </motion.div>
          )}

          {activeTab === "facial" && (
            <motion.div
              key="facial"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <AIGlowPanel className="p-6">
                <BeautyAIUpload />
              </AIGlowPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-300 ${
        active
          ? "bg-violet-500/15 border border-violet-500/30 shadow-ai-glow-sm"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active
            ? "bg-violet-500/20 text-violet-300"
            : "bg-white/5 text-cream-muted"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold transition-colors ${
            active ? "text-white" : "text-cream-muted"
          }`}
        >
          {label}
        </p>
        <p className="hidden text-[10px] text-cream-muted sm:block">
          {description}
        </p>
      </div>
      {active && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 rounded-lg border border-violet-500/30"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
}
