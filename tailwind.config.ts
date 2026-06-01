import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: "#0B0C10",
          deep: "#12131C",
          card: "#1A1C29",
        },
        bg: {
          primary: "#0B0C10",
          secondary: "#12131C",
          card: "#1A1C29",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F5E6B3",
          dark: "#B8860B",
        },
        cream: { DEFAULT: "#F5F0E8", muted: "#9CA3AF" },
        border: { DEFAULT: "rgba(255,255,255,0.1)" },
        rose: { DEFAULT: "#F472B6" },
        success: { DEFAULT: "#34D399" },
        ai: {
          indigo: "#7C3AED",
          cyan: "#22D3EE",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "midnight-gradient": "linear-gradient(180deg, #0B0C10 0%, #12131C 100%)",
        "gold-gradient":
          "linear-gradient(90deg, #F59E0B 0%, #FACC15 45%, #F59E0B 100%)",
        "gold-metallic":
          "linear-gradient(90deg, #FFFFFF 0%, #FDE68A 40%, #F59E0B 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.15) 50%, transparent 100%)",
      },
      boxShadow: {
        "gold-glow": "0 0 32px rgba(245, 158, 11, 0.25)",
        glass: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        "ai-glow": "0 0 24px rgba(124, 58, 237, 0.35), 0 0 48px rgba(34, 211, 238, 0.12)",
        "ai-glow-sm": "0 0 15px rgba(124, 58, 237, 0.3)",
      },
      animation: {
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slot-pulse": "slot-pulse 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { borderColor: "rgba(245, 158, 11, 0.35)" },
          "50%": { borderColor: "rgba(250, 204, 21, 0.85)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slot-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245, 158, 11, 0.2)" },
          "50%": { boxShadow: "0 0 12px 2px rgba(245, 158, 11, 0.35)" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
