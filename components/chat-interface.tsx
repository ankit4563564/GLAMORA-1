"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
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
  "Find me a premium fade under ₹1200 in Koramangala",
  "Check Indiranagar bridal slots",
  "Who does advanced hydrafacials in HSR Layout?",
  "Book a haircut at Luxe Hair Lounge for tomorrow at 11 AM",
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

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
        "Namaste! I'm Glamora's concierge for Bangalore's finest lounges. How can I curate your next appointment?",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || sendingRef.current) return;

      sendingRef.current = true;
      setTyping(true);

      const userMsg: Message = { id: newId(), role: "user", content };
      setMessages((prev) => [...prev, userMsg].slice(-11));
      setInput("");

      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");

        let salons: SalonPayload[] | undefined = data.salons;
        if (data.type === "salons" && (!salons || salons.length === 0)) {
          const fallback = await fetch("/api/salons");
          const salonData = await fallback.json();
          salons = (salonData.salons || []).slice(0, 4);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: data.response || "Here are your matches.",
            salons,
            booking: data.booking,
          },
        ]);
      } catch {
        try {
          const fallback = await fetch("/api/salons");
          const salonData = await fallback.json();
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: "Here are top Bangalore partners you can book now.",
              salons: (salonData.salons || []).slice(0, 4),
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: "Connection issue — browse /salons.",
            },
          ]);
        }
      } finally {
        setTyping(false);
        sendingRef.current = false;
      }
    },
    [input, messages]
  );

  return (
    <AIGlowPanel className="flex h-[calc(100vh-9rem)] flex-col gap-4 p-4 lg:flex-row">
      <aside className="hidden w-72 shrink-0 space-y-3 glass-card p-4 lg:block">
        <p className="text-xs uppercase tracking-wider text-violet-300/80">
          Try asking
        </p>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={typing}
            onClick={() => send(s)}
            className="w-full rounded-lg border border-white/10 p-3 text-left text-xs text-cream-muted transition-colors hover:border-cyan-400/40 hover:text-cream disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12131C]/60">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl border border-amber-500/20 bg-amber-500/15 px-4 py-3 text-cream"
                    : "max-w-[90%] space-y-3"
                }
              >
                {m.role === "assistant" && (
                  <div className="glass-card px-4 py-3">
                    <p className="text-sm text-cream">{m.content}</p>
                  </div>
                )}
                {m.role === "user" && <p className="text-sm">{m.content}</p>}

                {m.salons?.map((salon) => (
                  <motion.div
                    key={salon._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#1A1C29]/80 shadow-glass"
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={salon.images?.[0] || FALLBACK_IMAGE}
                        alt={salon.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-display text-cream">{salon.name}</p>
                      <p className="text-xs text-cream-muted">
                        {salon.area} · {salon.specialty}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          {salon.rating}
                        </span>
                        <span className="font-mono text-xs text-cream-muted">
                          {salon.priceRange}
                        </span>
                      </div>
                      <Button size="sm" className="mt-3 w-full" asChild>
                        <Link href={`/book/${salon._id}`}>Book</Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {m.booking && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="font-mono text-amber-400">{m.booking.bookingId}</p>
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
          <div ref={bottomRef} />
        </div>
        <form
          className="flex gap-2 border-t border-white/10 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about salons, slots, or booking…"
            className="flex-1 border-violet-500/20 focus-visible:ring-cyan-400/30"
            disabled={typing}
          />
          <Button type="submit" variant="ai" disabled={typing}>
            Send
          </Button>
        </form>
      </div>
    </AIGlowPanel>
  );
}
