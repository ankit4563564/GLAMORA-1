"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const revenueData = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  revenue: 12000 + Math.random() * 8000,
  bookings: 3 + Math.floor(Math.random() * 8),
}));

const serviceSplit = [
  { name: "Hair", value: 42 },
  { name: "Skin", value: 28 },
  { name: "Bridal", value: 18 },
  { name: "Spa", value: 12 },
];

const heatmap = [
  { hour: "10", load: 20 },
  { hour: "12", load: 45 },
  { hour: "14", load: 55 },
  { hour: "16", load: 70 },
  { hour: "18", load: 65 },
  { hour: "20", load: 30 },
];

import { isClerkConfigured } from "@/lib/clerk-config";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const isDemo = !isClerkConfigured();
  const role = (user?.publicMetadata?.role as string) || (isDemo ? "owner" : "user");
  const [tab, setTab] = useState("overview");
  const [prompt, setPrompt] = useState("");
  const [channel, setChannel] = useState("Instagram Caption");
  const [copies, setCopies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [realBookings, setRealBookings] = useState<any[]>([]);

  useEffect(() => {
    if (isLoaded && role === "owner") {
      fetch("/api/bookings")
        .then(r => r.json())
        .then(d => setRealBookings(d.bookings || []))
        .catch(() => {});
    }
  }, [isLoaded, role]);

  if (isLoaded && role !== "owner" && !isDemo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-cream-muted">
          Partner Portal is for salon owners. Set{" "}
          <code className="text-gold">publicMetadata.role = &quot;owner&quot;</code> in
          Clerk for demo access.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/salons">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  async function generateMarketing() {
    setLoading(true);
    const res = await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, channel }),
    });
    const data = await res.json();
    setCopies(data.copies || []);
    setLoading(false);
  }

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-10">
        <aside className="hidden w-48 shrink-0 space-y-2 md:block">
          {["overview", "marketing", "insights"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm capitalize ${
                tab === t ? "bg-amber-500/20 text-amber-400" : "text-cream-muted hover:bg-white/5"
              }`}
            >
              {t === "marketing" ? "AI Marketing" : t}
            </button>
          ))}
        </aside>

        <div className="flex-1">
          <h1 className="font-display text-3xl text-cream">Owner Dashboard</h1>
          <p className="text-sm text-cream-muted">
            Welcome, {user?.firstName || "Partner"}
          </p>

          {tab === "overview" && (
            <div className="mt-8 space-y-8">
              <div className="h-64 rounded-2xl glass-card p-4">
                <p className="text-sm text-gold">30-Day Revenue</p>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="day" hide />
                    <YAxis stroke="#9B9188" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#16161A",
                        border: "1px solid #2A2826",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#C9A84C"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-56 rounded-2xl glass-card p-4">
                  <p className="text-sm text-gold">Service Mix</p>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={serviceSplit} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={60} stroke="#9B9188" />
                      <Bar dataKey="value" fill="#D4617A" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-2xl glass-card p-4">
                  <p className="mb-3 text-sm text-gold">Recent Bookings</p>
                  {(realBookings.length > 0 ? realBookings.slice(0, 5) : [{ bookingId: "GM-482910" }, { bookingId: "GM-391204" }]).map((b) => (
                    <div
                      key={b.bookingId}
                      className="mb-2 flex justify-between border-b border-border pb-2 text-sm"
                    >
                      <span className="font-mono text-cream-muted">{b.bookingId}</span>
                      <span className="rounded-full bg-success/20 px-2 text-xs text-success">
                        {b.status || "confirmed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "marketing" && (
            <div className="mt-8 max-w-xl space-y-4">
              <Input
                placeholder="e.g. Monsoon hair fall treatment offer"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <select
                className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-cream"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option>Instagram Caption</option>
                <option>WhatsApp Blast</option>
                <option>Push Notification</option>
              </select>
              <Button onClick={generateMarketing} disabled={loading || !prompt}>
                {loading ? "Generating…" : "Generate Copy"}
              </Button>
              <div className="space-y-3">
                {copies.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl glass-card p-4"
                  >
                    <p className="text-sm text-cream">{c}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs text-gold hover:underline"
                      onClick={() => navigator.clipboard.writeText(c)}
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "insights" && (
            <div className="mt-8 space-y-6">
              <div className="h-56 rounded-2xl glass-card p-4">
                <p className="text-sm text-gold">Peak Capacity Hours</p>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={heatmap}>
                    <XAxis dataKey="hour" stroke="#9B9188" />
                    <YAxis stroke="#9B9188" />
                    <Bar dataKey="load" fill="#C9A84C" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
                <p className="text-sm font-medium text-gold">AI Directive</p>
                <p className="mt-2 text-cream-muted">
                  Consider extending Friday hours — 35% search demand unmet in
                  Whitefield.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
