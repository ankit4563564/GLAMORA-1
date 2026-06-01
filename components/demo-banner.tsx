"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBanner() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const [loading, setLoading] = useState(false);

  if (isSignedIn) return null;

  async function handleDemo() {
    if (!signIn) return;
    setLoading(true);
    try {
      const email =
        process.env.NEXT_PUBLIC_DEMO_USER_EMAIL || "demo@glamora.in";
      const password =
        process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD || "Demo@2026";

      const result = await signIn.create({ identifier: email, password });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive!({ session: result.createdSessionId });
        window.location.href = "/salons";
        return;
      }

      if (result.status === "needs_first_factor") {
        const attempt = await signIn.attemptFirstFactor({
          strategy: "password",
          password,
        });
        if (attempt.status === "complete" && attempt.createdSessionId) {
          await setActive!({ session: attempt.createdSessionId });
          window.location.href = "/salons";
        }
      }
    } catch {
      /* silent — user can use sign-in */
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[60] border-b border-amber-600/30 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-md">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between gap-4 px-4">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#0B0C10] sm:text-sm">
            <Crown className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">VIP Judge Access</span>
            <span className="sm:hidden">VIP Access</span>
            <span className="hidden font-normal opacity-80 md:inline">
              — one-click demo, no sign-up
            </span>
          </p>
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className={cn(
              "shrink-0 rounded-md bg-[#0B0C10] px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 transition hover:bg-[#12131C] hover:text-amber-200 disabled:opacity-60"
            )}
          >
            {loading ? "Entering…" : "Try Demo"}
          </button>
        </div>
      </div>
      <div className="h-10" aria-hidden />
    </>
  );
}
