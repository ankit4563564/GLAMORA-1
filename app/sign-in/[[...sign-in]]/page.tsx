import { SignIn } from "@clerk/nextjs";
import { isClerkConfiguredClient } from "@/lib/clerk-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignInPage() {
  if (!isClerkConfiguredClient) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="glass-card max-w-md p-8 shadow-gold-glow">
          <h1 className="font-display text-2xl text-cream">Demo Mode</h1>
          <p className="mt-4 text-cream-muted">
            Clerk Authentication is not configured in this environment. 
            Use the VIP Demo Login to explore the dashboard.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gold">Email: demo@glamora.in</p>
            <p className="text-xs text-gold">Pass: Demo@2026</p>
          </div>
          <Button className="mt-8 w-full" asChild>
            <Link href="/dashboard">Continue as Guest (VIP)</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <SignIn
        appearance={{
          variables: {
            colorBackground: "#1A1C29",
            colorText: "#F5F0E8",
            colorPrimary: "#F59E0B",
            colorInputBackground: "#12131C",
            borderRadius: "0.75rem",
          },
        }}
      />
    </div>
  );
}
