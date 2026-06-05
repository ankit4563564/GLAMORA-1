"use client";

import { Skeleton } from "./ui/skeleton";

export function SalonCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1A1C29]/40 backdrop-blur-md">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-8 w-12 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/3 rounded-sm" />
          <Skeleton className="h-3 w-full rounded-sm" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
