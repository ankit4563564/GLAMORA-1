"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SalonImage } from "@/components/salon-image";
import { DEFAULT_SALON_IMAGE } from "@/lib/salon-images";
import Link from "next/link";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AIGlowPanel } from "./ai-glow-panel";
import { Star } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  salons?: SalonPayload[];
  booking?: BookingPayload;
};

type SalonPayload = {
  _id: string;
  name: string;
  area: string;
  rating: number;
  priceRange: string;
  specialty: string;
  images: string[];
  matchScore?: number;
  whyRecommended?: string[];
};

type BookingPayload = {
  bookingId: string;
  salonName: string;
  service: string;
  date: string;
  timeSlot: string;
  price: number;
};

const SUGGESTIONS = [
  "Find me a premium spa in Bangalore",
  "Check Indiranagar bridal slots",
  "Who does advanced hydrafacials in HSR Layout?",
  "Book a haircut at Luxe Hair Lounge for tomorrow at 11 AM",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-xs text-cyan-300/80">Glamora is thinking</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: newId(),
      role: "assistant",
      content:
        "Namaste! I&apos;m Glamora&apos;s concierge for Bangalore&apos;s finest lounges. How can I curate your next appointment?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    if (lastMessageRef.current) {
      // If it's a long message with salons, scroll to the start of it
      // so the user reads the advice first. Otherwise scroll to bottom.
      const lastMsg = messages[messages.length - 1];
      const hasSalons = lastMsg?.role === "assistant" && lastMsg.salons && lastMsg.salons.length > 0;
      
      lastMessageRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: hasSalons ? "start" : "nearest" 
      });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, typing]);

  useEffect(() => {
    fetch("/api/salons").catch(() => {});
  }, []);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sendingRef.current) return;

    sendingRef.current = true;
    setTyping(true);
    setInput("");

    const userMsg: Message = { id: newId(), role: "user", content };

    const history = [...messagesRef.current, userMsg]
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg].slice(-11));

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content, messages: history }),
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: await res.text() };

      if (!res.ok) {
        const errText =
          data.error === "Unauthorized"
            ? "Please sign in (or use Try Demo at the top) to chat with the agent."
            : data.error === "Message required"
              ? "Something went wrong sending your message. Please try again."
              : data.error || "Something went wrong. Try again.";
        setMessages((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: errText },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content: data.response || "Here are your matches.",
          salons: data.type === "salons" ? data.salons : undefined,
          booking: data.booking,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: "assistant",
          content:
            "Could not reach the agent. Check your connection or browse the salon marketplace.",
        },
      ]);
    } finally {
      setTyping(false);
      sendingRef.current = false;
    }
  }, [input]);

  return (
    <AIGlowPanel className="flex h-[min(680px,calc(100dvh-11rem))] min-h-[420px] w-full flex-col overflow-hidden lg:h-[min(720px,calc(100dvh-10rem))]">
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:flex-row sm:gap-4 sm:p-4">
        <aside className="hidden shrink-0 space-y-2 sm:block sm:w-64 lg:w-72">
          <p className="px-1 text-xs uppercase tracking-wider text-violet-300/80">
            Try asking
          </p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={typing}
                onClick={() => send(s)}
                className="w-full rounded-lg border border-white/10 bg-[#12131C]/50 p-3 text-left text-xs leading-relaxed text-cream-muted transition-colors hover:border-cyan-400/40 hover:text-cream disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12131C]/80">
          <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:hidden">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-violet-300/80">
              Suggestions
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={typing}
                  onClick={() => send(s)}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-cream-muted hover:border-cyan-400/40"
                >
                  {s.length > 42 ? `${s.slice(0, 40)}…` : s}
                </button>
              ))}
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
          >
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={m.id}
                  ref={idx === messages.length - 1 ? lastMessageRef : null}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[88%] rounded-2xl border border-amber-500/20 bg-amber-500/15 px-4 py-3 text-cream sm:max-w-[75%]"
                        : "w-full max-w-full space-y-3 sm:max-w-md"
                    }
                  >
                    {m.role === "assistant" && (
                      <div className="glass-card px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream">
                          {m.content}
                        </p>
                      </div>
                    )}
                    {m.role === "user" && (
                      <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                    )}

                    {m.salons?.map((salon) => (
                      <motion.div
                        key={salon._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]/90 shadow-glass-lg relative group"
                      >
                        {/* Match Score Badge */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className="flex flex-col items-center bg-black/60 backdrop-blur-md border border-violet-500/40 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-tighter leading-none mb-0.5">Match</span>
                            <span className="text-sm font-display font-bold text-white leading-none">{salon.matchScore || 96}%</span>
                          </div>
                        </div>

                        <div className="relative h-40 w-full overflow-hidden">
                          <SalonImage
                            src={salon.images?.[0] || DEFAULT_SALON_IMAGE}
                            alt={salon.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C29] via-transparent to-transparent" />
                        </div>
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="font-display text-lg text-white leading-tight">{salon.name}</h4>
                              <p className="text-xs text-cream-muted font-medium uppercase tracking-wider">{salon.area}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-amber-400">{salon.rating}</span>
                            </div>
                          </div>

                          {/* Why Recommended / AI Insights */}
                          {salon.whyRecommended && (
                            <div className="my-3 space-y-1.5">
                              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest mb-1 opacity-80">AI Insights</p>
                              {salon.whyRecommended.map((reason, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-cream">
                                  <div className="h-1 w-1 rounded-full bg-cyan-400" />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <span className="font-mono text-sm text-cream-muted">{salon.priceRange.split('–')[0]}</span>
                            <Button size="sm" variant="ai" className="h-9 px-6 font-bold uppercase tracking-widest shadow-ai-glow-sm" asChild>
                              <Link href={`/book/${salon._id}`}>Book Now</Link>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {m.booking && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="font-mono text-amber-400">
                          {m.booking.bookingId}
                        </p>
                        <p className="text-sm text-cream">
                          {m.booking.service} at {m.booking.salonName}
                        </p>
                        <p className="text-xs text-cream-muted">
                          {m.booking.date} · {m.booking.timeSlot}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && <TypingIndicator />}
            </div>
          </div>

          <form
            className="flex shrink-0 gap-2 border-t border-white/10 p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about salons, slots, or booking…"
              className="min-w-0 flex-1 border-violet-500/20 focus-visible:ring-cyan-400/30"
              disabled={typing}
            />
            <Button type="submit" variant="ai" disabled={typing} className="shrink-0">
              Send
            </Button>
          </form>
        </div>
      </div>
    </AIGlowPanel>
  );
}
