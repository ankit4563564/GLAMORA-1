"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { isClerkConfiguredClient } from "@/lib/clerk-config";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const links = [
  { href: "/salons", label: "Marketplace" },
  { href: "/beauty-ai", label: "BeautyAI", ai: true },
  { href: "/agent", label: "AI Agent", ai: true },
  { href: "/dashboard", label: "Partner Portal" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky z-40 border-b border-white/5 glass-panel",
        isClerkConfiguredClient ? "top-10" : "top-0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          <span className="text-cream">Glam</span>
          <span className="text-metallic">ora</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm transition-colors",
                pathname === l.href
                  ? l.ai
                    ? "font-medium text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                    : "font-medium text-amber-400"
                  : "text-cream-muted hover:text-cream",
                l.ai && pathname !== l.href && "hover:text-violet-300"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isClerkConfiguredClient ? (
            <>
              <SignedOut>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/salons">Explore Salons</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
