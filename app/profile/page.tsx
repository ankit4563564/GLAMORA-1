"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatINR, cn } from "@/lib/utils";
import { Calendar, Clock, MapPin, RotateCcw, XCircle, ChevronRight, Heart, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type Booking = {
  _id: string;
  bookingId: string;
  salonId: string;
  salonName: string;
  service: { name: string; price: number };
  date: string;
  timeSlot: string;
  status: string;
};

export default function ProfilePage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "bookings";
  
  const { success: toastSuccess, error: toastError } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (res.ok) {
        toastSuccess("Booking cancelled successfully.");
        fetchBookings();
      } else {
        toastError("Failed to cancel booking.");
      }
    } catch (e) {
      toastError("An error occurred.");
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 space-y-2 lg:w-64">
            <div className="mb-6 flex items-center gap-4 px-2">
              <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-violet-500/20 relative">
                <Image src={user?.imageUrl || "/default-avatar.png"} alt={user?.fullName || "User"} fill className="h-full w-full object-cover" unoptimized />
              </div>
              <div>
                <p className="font-display text-lg text-white">{user?.firstName || "Guest"}</p>
                <p className="text-[10px] uppercase tracking-widest text-cream-muted font-bold">Bangalore Member</p>
              </div>
            </div>

            <TabButton active={activeTab === "bookings"} icon={<Calendar size={18} />} label="My Bookings" href="/profile?tab=bookings" />
            <TabButton active={activeTab === "saved"} icon={<Heart size={18} />} label="Saved Salons" href="/profile?tab=saved" />
            <TabButton active={activeTab === "settings"} icon={<Settings size={18} />} label="Settings" href="/profile?tab=settings" />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "bookings" && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl text-white">Booking History</h2>
                
                <div className="space-y-4">
                  {loading && Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                  
                  {!loading && bookings.length === 0 && (
                    <div className="rounded-3xl border border-white/5 bg-white/5 p-12 text-center">
                      <p className="text-cream-muted">No appointments found.</p>
                      <Button className="mt-4" asChild>
                        <Link href="/salons">Explore Marketplace</Link>
                      </Button>
                    </div>
                  )}

                  {bookings.map((b) => (
                    <div 
                      key={b.bookingId} 
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]/40 p-5 transition-all hover:border-violet-500/30",
                        b.status === "cancelled" && "opacity-60"
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-gold uppercase tracking-widest">{b.bookingId}</span>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter",
                              b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/10 text-cream-muted"
                            )}>
                              {b.status}
                            </span>
                          </div>
                          <h3 className="font-display text-xl text-white">{b.salonName}</h3>
                          <p className="text-sm text-cream-muted">{b.service.name} · {formatINR(b.service.price)}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-cream-muted">
                           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                             <Calendar size={14} className="text-cyan-400" />
                             <span>{new Date(b.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric' })}</span>
                           </div>
                           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
                             <Clock size={14} className="text-amber-400" />
                             <span>{b.timeSlot}</span>
                           </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
                        {b.status === "confirmed" ? (
                          <>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider" asChild>
                               <Link href={`/book/${b.salonId}?reschedule=${b._id}`}>Reschedule</Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => cancelBooking(b._id)}
                              className="h-8 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2" asChild>
                            <Link href={`/book/${b.salonId}`}>
                              <RotateCcw size={12} />
                              Book Again
                            </Link>
                          </Button>
                        )}
                        <Link href={`/salons/${b.salonId}`} className="ml-auto text-[10px] font-bold uppercase tracking-widest text-violet-400 hover:text-violet-300">
                          View Studio →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "saved" && (
              <div className="rounded-3xl border border-white/5 bg-white/5 p-12 text-center">
                <p className="text-cream-muted">Your saved salons will appear here.</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="rounded-3xl border border-white/5 bg-white/5 p-12 text-center">
                <p className="text-cream-muted">Account settings configuration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function TabButton({ active, icon, label, href }: { active: boolean; icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
        active 
          ? "bg-violet-600 text-white shadow-lg shadow-violet-900/20" 
          : "text-cream-muted hover:bg-white/5 hover:text-cream"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
