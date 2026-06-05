"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatINR, cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit,
  Settings,
  Plus
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [isLoaded]);

  const role = user?.publicMetadata?.role;
  const isDemo = true; // For buildathon, allow demo view

  if (!isLoaded) return null;

  if (role !== "owner" && !isDemo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-cream-muted">
          This portal is for salon owners. Set{" "}
          <code className="text-gold">publicMetadata.role = &quot;owner&quot;</code> in
          Clerk for demo access.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/salons">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl text-white">Owner Dashboard</h1>
            <p className="mt-2 text-cream-muted">Managing your Bangalore grooming enclave</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="gap-2">
               <Settings size={16} /> Manage Salon
             </Button>
             <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
               <Plus size={16} /> Add Service
             </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Metric Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard 
                title="Total Revenue" 
                value={formatINR(data.metrics.totalRevenue)} 
                icon={<IndianRupee className="text-emerald-400" />} 
                trend="+12.5%" 
                up
              />
              <StatCard 
                title="Appointments" 
                value={data.metrics.totalBookings} 
                icon={<Calendar className="text-violet-400" />} 
                trend="+8.2%" 
                up
              />
              <StatCard 
                title="Retention" 
                value={`${data.metrics.retentionRate.toFixed(1)}%`} 
                icon={<Users className="text-cyan-400" />} 
                trend="+4.1%" 
                up
              />
              <StatCard 
                title="Cancellation" 
                value={`${data.metrics.cancellationRate.toFixed(1)}%`} 
                icon={<ArrowDownRight className="text-rose-400" />} 
                trend="-2.4%" 
                up={false}
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Top Services Table */}
              <div className="lg:col-span-2 glass-card p-6">
                <h3 className="font-display text-xl text-white mb-6">Top Performing Services</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-cream-muted border-b border-white/5">
                        <th className="pb-3 font-bold">Service</th>
                        <th className="pb-3 font-bold">Bookings</th>
                        <th className="pb-3 font-bold">Revenue</th>
                        <th className="pb-3 font-bold">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {data.topServices.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-white/5 last:border-0">
                          <td className="py-4 font-medium text-white">{s.name}</td>
                          <td className="py-4 text-cream-muted">{s.count}</td>
                          <td className="py-4 text-gold font-mono">{formatINR(s.revenue)}</td>
                          <td className="py-4 text-emerald-400 text-xs font-bold">+{10 + i * 2}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Insights & Conversion */}
              <div className="space-y-6">
                <div className="glass-card p-6 border-violet-500/20 bg-violet-500/5">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="text-violet-400 h-5 w-5" />
                    <h3 className="font-display text-xl text-white">AI Insights</h3>
                  </div>
                  <div className="space-y-4">
                    {data.aiInsights.map((insight: string, i: number) => (
                      <div key={i} className="rounded-xl bg-white/5 p-4 border border-white/5 text-sm text-cream leading-relaxed italic">
                        &quot;{insight}&quot;
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                   <p className="text-xs font-bold uppercase tracking-widest text-cream-muted mb-1">Conversion Rate</p>
                   <div className="flex items-end gap-2">
                     <p className="text-3xl font-display text-white">{data.metrics.conversionRate}%</p>
                     <p className="text-xs text-emerald-400 font-bold mb-1">+1.2%</p>
                   </div>
                   <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${data.metrics.conversionRate}%` }} />
                   </div>
                   <p className="mt-2 text-[10px] text-cream-muted uppercase tracking-tighter">Bookings vs Profile Views</p>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="glass-card p-6">
              <h3 className="font-display text-xl text-white mb-6">Recent Activity</h3>
              <div className="space-y-3">
                {data.recentBookings.map((b: any) => (
                  <div key={b._id} className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/5 group hover:border-violet-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                        {b.salonName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{b.service.name}</p>
                        <p className="text-xs text-cream-muted">{new Date(b.date).toLocaleDateString("en-IN")} · {b.timeSlot}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-mono text-gold">{formatINR(b.service.price)}</p>
                       <p className="text-[10px] uppercase font-bold text-emerald-400">{b.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function StatCard({ title, value, icon, trend, up }: { title: string, value: string | number, icon: React.ReactNode, trend: string, up: boolean }) {
  return (
    <div className="glass-card p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
          {icon}
        </div>
        <div className={cn("flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full", up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted mb-1">{title}</p>
        <p className="text-3xl font-display text-white">{value}</p>
      </div>
    </div>
  );
}
