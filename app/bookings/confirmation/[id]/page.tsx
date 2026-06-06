"use client";

import { motion } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ConfirmationPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { 
    salonName: string; 
    serviceName: string; 
    date: string; 
    timeSlot: string;
  };
}) {
  const { id } = params;
  const { salonName, serviceName, date, timeSlot } = searchParams;

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
        </motion.div>

        <h1 className="font-display text-4xl text-white">Booking Confirmed!</h1>
        <p className="mt-2 text-cream-muted">Your grooming ritual is scheduled and ready.</p>
        
        <div className="mt-10 rounded-3xl border border-white/10 bg-[#1A1C29]/50 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Reference ID</p>
              <p className="font-mono text-lg text-gold">{id}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Studio</p>
                <div className="flex items-center gap-2 text-white">
                  <MapPin size={16} className="text-violet-400" />
                  <span className="font-medium">{salonName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Service</p>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="font-medium">{serviceName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Date</p>
                <div className="flex items-center gap-2 text-white">
                  <Calendar size={16} className="text-cyan-400" />
                  <span className="font-medium">{date}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream-muted">Time</p>
                <div className="flex items-center gap-2 text-white">
                  <Clock size={16} className="text-amber-400" />
                  <span className="font-medium">{timeSlot}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700">
              <Calendar size={18} />
              Add to Calendar
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/profile">My Bookings</Link>
            </Button>
          </div>
        </div>

        <Link href="/salons" className="mt-8 inline-flex items-center gap-2 text-sm text-cream-muted hover:text-white transition-colors">
          Browse more salons
          <ArrowRight size={14} />
        </Link>
      </div>
    </PageTransition>
  );
}
