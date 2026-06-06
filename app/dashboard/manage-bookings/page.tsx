"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  IndianRupee,
  Filter,
  Search
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Booking = {
  _id: string;
  bookingId: string;
  salonName: string;
  service: { name: string; price: number; duration: number };
  date: string;
  timeSlot: string;
  status: "confirmed" | "cancelled" | "completed";
  userId: string;
};

export default function ManageBookingsPage() {
  const { user } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status }),
      });
      if (res.ok) {
        toastSuccess(`Booking ${status} successfully!`);
        fetchBookings();
      } else {
        toastError("Failed to update booking status");
      }
    } catch (err) {
      toastError("An error occurred");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch = 
      searchQuery === "" ||
      booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.salonName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cream-muted hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="mt-4 font-display text-4xl text-white">Manage Bookings</h1>
          <p className="mt-2 text-cream-muted">View and manage all your salon bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          <StatCard title="Total" value={stats.total} color="violet" />
          <StatCard title="Confirmed" value={stats.confirmed} color="emerald" />
          <StatCard title="Completed" value={stats.completed} color="cyan" />
          <StatCard title="Cancelled" value={stats.cancelled} color="rose" />
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(["all", "confirmed", "completed", "cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                  filter === status
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-cream-muted hover:bg-white/10"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[#1A1C29]/50 border border-white/10 text-white focus:border-violet-500/30 focus:outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-cream-muted">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function BookingCard({ booking, onStatusUpdate }: { booking: Booking; onStatusUpdate: (id: string, status: string) => void }) {
  return (
    <div className="glass-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-xs text-gold uppercase tracking-widest">{booking.bookingId}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                booking.status === "confirmed" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                booking.status === "completed" && "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                booking.status === "cancelled" && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}
            >
              {booking.status}
            </span>
          </div>
          
          <h3 className="font-display text-lg text-white mb-2">{booking.service.name}</h3>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-cream-muted">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-cyan-400" />
              {new Date(booking.date).toLocaleDateString("en-IN", { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              {booking.timeSlot}
            </span>
            <span className="flex items-center gap-1.5">
              <IndianRupee size={14} className="text-gold" />
              {booking.service.price}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {booking.status === "confirmed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(booking._id, "completed")}
                className="gap-2 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30"
              >
                <Check size={14} /> Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusUpdate(booking._id, "cancelled")}
                className="gap-2 text-rose-400 hover:text-rose-300 hover:border-rose-500/30"
              >
                <X size={14} /> Cancel
              </Button>
            </>
          )}
          {booking.status === "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate(booking._id, "confirmed")}
              className="gap-2 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30"
            >
              <Check size={14} /> Restore
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: "violet" | "emerald" | "cyan" | "rose" }) {
  const colorClasses = {
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    rose: "bg-rose-500/10 border-rose-500/30 text-rose-300",
  };

  return (
    <div className={cn("glass-card p-4 border", colorClasses[color])}>
      <p className="text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-display text-white">{value}</p>
    </div>
  );
}
