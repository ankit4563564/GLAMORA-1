import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5 glass-panel">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-2xl">
              <span className="text-cream">Glam</span>
              <span className="text-metallic">ora</span>
            </p>
            <p className="mt-2 text-sm text-cream-muted">
              Bangalore&apos;s Beauty, Curated by AI.
            </p>
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-cream-muted">
            <Link href="/salons" className="transition hover:text-amber-400">
              Marketplace
            </Link>
            <Link href="/beauty-ai" className="transition hover:text-cyan-300">
              BeautyAI
            </Link>
            <Link href="/agent" className="transition hover:text-cyan-300">
              AI Agent
            </Link>
            <Link href="/dashboard" className="transition hover:text-amber-400">
              For Salon Owners
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-white/5 pt-8 text-center text-xs text-cream-muted">
          Built with AI at SuperXGen AI Buildathon 2026
        </p>
      </div>
    </footer>
  );
}
