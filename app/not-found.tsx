import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-amber-400/80">404</p>
      <h1 className="mt-2 font-display text-4xl text-metallic">Studio not found</h1>
      <p className="mt-3 max-w-md text-cream-muted">
        This lounge isn&apos;t on our map. Explore premium partners across Bangalore.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/salons">Browse Marketplace</Link>
      </Button>
    </div>
  );
}
