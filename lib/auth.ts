import { auth } from "@clerk/nextjs/server";
import { DEMO_USER_ID, isClerkConfigured } from "@/lib/clerk-config";

/** Resolves Clerk user id, or a stable demo id when Clerk env is missing. */
export async function getUserId(): Promise<string | null> {
  if (!isClerkConfigured()) {
    return DEMO_USER_ID;
  }
  try {
    const { userId } = await auth();
    return userId;
  } catch {
    return null;
  }
}

/** Agent works on the public /agent page — allow guests when Clerk has no session. */
export async function getAgentUserId(): Promise<string> {
  const userId = await getUserId();
  return userId ?? DEMO_USER_ID;
}
