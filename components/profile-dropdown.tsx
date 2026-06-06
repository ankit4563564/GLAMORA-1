"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useClerk, useUser, SignedIn } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Heart,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import { isClerkConfiguredClient } from "@/lib/clerk-config";

export function ProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isClerkConfiguredClient || !user) return null;

  const menuItems = [
    { label: "My Bookings", href: "/profile", icon: Calendar },
    { label: "Saved Salons", href: "/profile?tab=saved", icon: Heart },
    { label: "Settings", href: "/profile?tab=settings", icon: Settings },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pl-1 pr-3 transition-all hover:bg-white/10"
      >
        <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20 relative">
          <Image 
            src={user.imageUrl} 
            alt={user.fullName || "Profile"} 
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <span className="hidden text-xs font-medium text-cream md:block">
          {user.firstName || "Account"}
        </span>
        <ChevronDown size={14} className={`text-cream-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/10 bg-[#1A1C29]/90 p-2 shadow-2xl backdrop-blur-xl z-50"
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-cream-muted truncate">{user.primaryEmailAddress?.emailAddress}</p>
            </div>

            <div className="space-y-0.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cream-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <item.icon size={16} className="text-violet-400" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-1 border-t border-white/5 pt-1">
              <button
                onClick={() => {
                  signOut();
                  window.location.href = "/";
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
