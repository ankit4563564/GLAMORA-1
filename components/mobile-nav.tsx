"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/salons", icon: Search },
    { label: "Bookings", href: "/profile", icon: Calendar },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/5 bg-[#1A1C29]/80 px-4 pb-safe backdrop-blur-xl md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-amber-400" : "text-cream-muted hover:text-cream"
            )}
          >
            <tab.icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]")} />
            <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
