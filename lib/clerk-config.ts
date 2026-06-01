/** True when Clerk can run on server (middleware + API auth). */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

/** True in client bundles when publishable key is present. */
export const isClerkConfiguredClient = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
);

export const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || "";

/** Demo user id when Clerk is not configured (local/Vercel without env). */
export const DEMO_USER_ID = "demo-anonymous";
