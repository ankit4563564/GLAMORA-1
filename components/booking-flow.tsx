"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { formatINR, cn } from "@/lib/utils";
import type { SalonCardData } from "./salon-card";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type Service = { name: string; price: number; duration: number; category: string };

export function BookingFlow({
  salon,
}: {
  salon: SalonCardData & { services: Service[]; availableSlots: string[] };
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [dateKey, setDateKey] = useState(days[0]);
  const [timeSlot, setTimeSlot] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots] = useState<string[]>([]);

  const slotsForDay = salon.availableSlots.filter((s) => s.startsWith(dateKey));

  async function confirm() {
    if (!service || !dateKey || !timeSlot) return;
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salonId: salon._id,
        salonName: salon.name,
        service: {
          name: service.name,
          price: service.price,
          duration: service.duration,
        },
        date: dateKey,
        timeSlot,
      }),
    });
    const data = await res.json();
    setBookingId(data.bookingId || "GM-DEMO");
    setStep(4);
    setLoading(false);
  }

  function downloadIcs() {
    const start = new Date(`${dateKey}T12:00:00`);
    const end = new Date(start.getTime() + (service?.duration || 60) * 60000);
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${service?.name} at ${salon.name}
DESCRIPTION:Glamora Booking ${bookingId}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bookingId}.ics`;
    a.click();
  }

  if (step === 4) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card mx-auto max-w-lg p-8 text-center shadow-gold-glow"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
        </motion.div>
        <h2 className="mt-4 font-display text-2xl text-cream">You&apos;re Booked</h2>
        <p className="mt-2 font-mono text-amber-400">{bookingId}</p>
        <p className="mt-4 text-cream-muted">
          {service?.name} · {salon.name} · {dateKey} · {timeSlot}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={downloadIcs}>
            Sync to Calendar
          </Button>
          <Button asChild>
            <Link href={`/salons/${salon._id}`}>View Portfolio</Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full",
              step >= s ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-white/10"
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <h2 className="font-display text-xl text-cream">Curate Service</h2>
            {salon.services.map((svc) => (
              <button
                key={svc.name}
                type="button"
                onClick={() => setService(svc)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all",
                  service?.name === svc.name
                    ? "border-amber-500/60 bg-amber-500/10 shadow-gold-glow"
                    : "glass-card hover:border-amber-500/30"
                )}
              >
                <div>
                  <p className="text-cream">{svc.name}</p>
                  <p className="text-xs text-cream-muted">{svc.duration} mins</p>
                </div>
                <span className="font-mono text-amber-400">{formatINR(svc.price)}</span>
              </button>
            ))}
            <Button
              className="w-full"
              disabled={!service}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="mb-4 font-display text-xl text-cream">Schedule Slot</h2>
            <div className="flex gap-2 overflow-x-auto pb-4">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDateKey(d);
                    setTimeSlot("");
                  }}
                  className={cn(
                    "shrink-0 rounded-lg border px-4 py-2 text-sm",
                    dateKey === d
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                      : "border-white/10 text-cream-muted hover:border-amber-500/30"
                  )}
                >
                  {new Date(d).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>
            {dateKey && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsForDay.map((slot) => {
                  const time = slot.split("|")[1];
                  const taken = bookedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={taken}
                      onClick={() => setTimeSlot(time)}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-mono",
                        taken && "opacity-40 line-through",
                        timeSlot === time
                          ? "animate-slot-pulse border-amber-500/70 bg-amber-500/15 text-amber-300"
                          : "border-white/10 text-cream-muted hover:border-amber-500/40"
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!timeSlot}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="mb-4 font-display text-xl text-cream">Confirm</h2>
            <div className="glass-card p-6">
              <p className="text-cream-muted">Studio</p>
              <p className="font-display text-lg text-cream">{salon.name}</p>
              <hr className="my-4 border-border" />
              <p className="text-sm text-cream-muted">Service · {service?.name}</p>
              <p className="text-sm text-cream-muted">
                {dateKey} · {timeSlot}
              </p>
              <p className="mt-4 font-mono text-2xl text-amber-400">
                {service && formatINR(service.price)}
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center text-sm text-amber-200/90">
              Pay at Studio — no online payment required
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={confirm} disabled={loading}>
                {loading ? "Confirming…" : "Confirm Appointment"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
