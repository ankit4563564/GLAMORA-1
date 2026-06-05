"use client";

import Link from "next/link";
import { SalonImage } from "@/components/salon-image";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { SalonCard, type SalonCardData } from "@/components/salon-card";
import { SEED_SALONS } from "@/lib/seed-data";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { Sparkles, ScanFace, ShoppingBag, ArrowRight, Star, Quote } from "lucide-react";

const words = "Bangalore's Beauty, Curated by AI.".split(" ");

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = 40;
    const id = setInterval(() => {
      frame++;
      setN(end % 1 ? Math.round(end * 10 * (frame / total)) / 10 : Math.round((end * frame) / total));
      if (frame >= total) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [started, end]);

  return (
    <span ref={ref} className="font-mono text-2xl text-amber-400 md:text-3xl">
      {n}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const featured = SEED_SALONS.slice(0, 4).map((s, i) => ({
    ...s,
    _id: `seed-${i}`,
  })) as SalonCardData[];

  return (
    <PageTransition>
      {/* HERO SECTION */}
      <section className="noise-overlay relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0B0C10] to-[#12131C] px-4 py-12 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_65%)]" />
        
        <p className="relative z-10 mb-4 rounded-full border border-white/10 bg-[#1A1C29]/60 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-300 backdrop-blur-md">
          📍 Premium Grooming in Bangalore
        </p>

        <h1 className="relative z-10 max-w-4xl font-display text-4xl leading-tight md:text-6xl lg:text-7xl">
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-metallic mr-[0.25em] inline-block"
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <p className="relative z-10 mt-6 max-w-xl text-base text-cream-muted sm:text-lg">
          Discover, compare, and book the city&apos;s finest grooming lounges—powered by
          deep facial analysis and conversational intelligence.
        </p>

        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" variant="ai" className="px-8 shadow-ai-glow" asChild>
            <Link href="/agent">Consult AI Agent</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/10 px-8 hover:bg-white/5" asChild>
            <Link href="/salons">Explore Marketplace</Link>
          </Button>
        </div>

        {/* TRUST BAR */}
        <div className="relative z-10 mt-10 flex items-center gap-4 text-[11px] font-medium tracking-wider text-cream-muted/60 uppercase">
            <span>500+ Salons</span>
            <div className="h-3 w-[1px] bg-white/10" />
            <span>10,000+ Bookings</span>
            <div className="h-3 w-[1px] bg-white/10" />
            <span className="flex items-center gap-1">4.9★ Rated</span>
        </div>
      </section>

      {/* FEATURE SHOWCASE SECTION */}
      <section className="bg-[#12131C] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl text-metallic sm:text-4xl">Everything you need</h2>
            <p className="mt-3 text-cream-muted">Discover the future of grooming with our AI-powered ecosystem.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard 
                icon={<ScanFace className="h-6 w-6" />}
                title="BeautyAI"
                desc="Upload a selfie for an algorithmic breakdown of your facial architecture."
                href="/beauty-ai"
            />
            <FeatureCard 
                icon={<Sparkles className="h-6 w-6" />}
                title="AI Agent"
                desc="Chat with our digital concierge to find slots and book instantly."
                href="/agent"
            />
            <FeatureCard 
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Marketplace"
                desc="Browse the city's finest enclaves with advanced sorting and maps."
                href="/salons"
            />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="bg-gradient-to-b from-[#12131C] to-[#0B0C10] py-20 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl text-cream mb-12">Trusted by Bangalore</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard 
                name="Aditi Rao"
                initials="AR"
                quote="The BeautyAI analysis was spot on! It recommended a layered bob that perfectly matches my face shape."
            />
            <TestimonialCard 
                name="Rohan Mehta"
                initials="RM"
                quote="Booking through the AI agent felt like texting a friend. Found a slot in Indiranagar in under 30 seconds."
            />
            <TestimonialCard 
                name="Priya Das"
                initials="PD"
                quote="Finally, a place to find truly premium salons in Whitefield. The interactive map makes discovery so easy."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#12131C]/80 py-12 backdrop-blur-sm">
        <motion.div
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            { end: 50, label: "Elite Partners", suffix: "+" },
            { end: 2500, label: "Curated Services", suffix: "+" },
            { end: 1200, label: "Avg. Booking", suffix: "" },
            { end: 4.7, label: "Global Rating", suffix: "★" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center">
              <CountUp end={stat.end} suffix={stat.suffix} />
              <p className="mt-2 text-sm text-cream-muted">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-gradient-to-b from-transparent to-[#0B0C10] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-3xl text-cream">Featured Partners</h2>
            <Button variant="ghost" asChild>
              <Link href="/salons">View All Partners</Link>
            </Button>
          </div>
          <motion.div
            className="flex gap-4 overflow-x-auto pb-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {featured.map((s, i) => (
              <motion.div key={s._id} variants={fadeUp} className="w-[280px] shrink-0">
                <SalonCard salon={s} index={i} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

function FeatureCard({ icon, title, desc, href }: { icon: React.ReactNode, title: string, desc: string, href: string }) {
    return (
        <Link href={href} className="group glass-card p-8 transition-all hover:border-violet-500/40 hover:shadow-ai-glow-sm">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-display text-xl text-white mb-2">{title}</h3>
            <p className="text-sm text-cream-muted leading-relaxed mb-6">{desc}</p>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300 group-hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-3 w-3" />
            </div>
        </Link>
    );
}

function TestimonialCard({ name, initials, quote }: { name: string, initials: string, quote: string }) {
    return (
        <div className="glass-card p-6 relative overflow-hidden">
            <Quote className="absolute -top-2 -right-2 h-12 w-12 text-white/5" />
            <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                ))}
            </div>
            <p className="text-sm text-cream-muted italic leading-relaxed mb-6">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold text-xs">
                    {initials}
                </div>
                <div>
                    <p className="text-sm font-semibold text-cream">{name}</p>
                    <p className="text-[10px] text-cream-muted uppercase tracking-widest">Verified Customer</p>
                </div>
            </div>
        </div>
    );
}
