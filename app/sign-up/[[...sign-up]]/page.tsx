import { SignUp } from "@clerk/nextjs";
import { isClerkConfiguredClient } from "@/lib/clerk-config";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SignUpPage() {
  if (!isClerkConfiguredClient) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="glass-card max-w-md p-8 shadow-gold-glow">
          <h1 className="font-display text-2xl text-cream">Demo Mode</h1>
          <p className="mt-4 text-cream-muted">
            Clerk Authentication is not configured in this environment. 
            Join as a VIP member to explore our premium features.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild>
              <Link href="/sign-in">Already have account?</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/salons">Explore Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <SignUp
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
