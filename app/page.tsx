"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { SalonCard, type SalonCardData } from "@/components/salon-card";
import { SEED_SALONS } from "@/lib/seed-data";
import { staggerContainer, fadeUp } from "@/lib/motion";

const words = "Bangalore's Beauty, Curated by AI.".split(" ");

function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setStarted(true),
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
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
      <section className="noise-overlay relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#0B0C10] to-[#12131C] px-4 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-8 opacity-25 blur-sm">
          {featured.map((s, i) => (
            <motion.div
              key={s._id}
              className="hidden h-48 w-36 overflow-hidden rounded-xl border border-white/10 lg:block"
              style={{ marginTop: i % 2 ? 40 : -40 }}
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4 + i, ease: "easeInOut" }}
            >
              <Image src={s.images[0]} alt="" width={144} height={192} className="object-cover" />
            </motion.div>
          ))}
        </div>

        <p className="relative z-10 mb-4 rounded-full border border-white/10 bg-[#1A1C29]/60 px-4 py-1.5 text-xs text-cream-muted backdrop-blur-md">
          📍 Serving Premium Enclaves in Bangalore, KA
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

        <p className="relative z-10 mt-6 max-w-2xl text-lg text-cream-muted">
          Discover, compare, and book the city&apos;s finest grooming lounges—powered by
          deep facial analysis and conversational intelligence.
        </p>

        <div className="relative z-10 mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/salons">Explore Lounges</Link>
          </Button>
          <Button size="lg" variant="ai" asChild>
            <Link href="/agent">Consult AI Agent</Link>
          </Button>
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

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl text-metallic">Why Glamora</h2>
        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {[
            {
              icon: "🤖",
              title: "Conversational Assistant",
              desc: "Skip the menus. Chat your way directly into an open appointment chair.",
              ai: true,
            },
            {
              icon: "💄",
              title: "BeautyAI Face Diagnostics",
              desc: "Upload a selfie for an algorithmic breakdown of your facial architecture and local recommendations.",
              ai: true,
            },
            {
              icon: "⚡",
              title: "Instant Sync Booking",
              desc: "Real-time slot availability, zero phone confirmation tags.",
              ai: false,
            },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ scale: 1.02, y: -4 }}
              className={
                f.ai
                  ? "ai-surface p-6"
                  : "glass-card p-6 transition-shadow hover:shadow-gold-glow"
              }
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 font-display text-xl text-cream">{f.title}</h3>
              <p className="mt-2 text-sm text-cream-muted">{f.desc}</p>
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
