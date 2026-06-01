import { auth } from "@clerk/nextjs/server";
import { DEMO_USER_ID, isClerkConfigured } from "@/lib/clerk-config";

/** Resolves Clerk user id, or a stable demo id when Clerk env is missing. */
export async function getUserId(): Promise<string | null> {
  if (!isClerkConfigured()) {
    // In hackathon demo mode, we use a generic ID. 
    // Ideally this would be session-based if Clerk is off.
    return DEMO_USER_ID;
  }
  try {
    const { userId } = await auth();
    return userId;
  } catch (err) {
    console.warn("Auth check failed, falling back to demo user", err);
    return DEMO_USER_ID;
  }
}

/** Agent works on the public /agent page — allow guests when Clerk has no session. */
export async function getAgentUserId(): Promise<string> {
  const userId = await getUserId();
  return userId ?? DEMO_USER_ID;
}
