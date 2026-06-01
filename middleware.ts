import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const isClerkConfigured =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim());

const isPublic = createRouteMatcher([
  "/",
  "/salons(.*)",
  "/book(.*)",
  "/beauty-ai(.*)",
  "/agent(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/salons(.*)",
  "/api/agent(.*)",
  "/api/beauty-ai(.*)",
]);

const isOwnerRoute = createRouteMatcher(["/dashboard(.*)"]);

const withClerk = clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!isPublic(req) && !userId) {
    return redirectToSignIn();
  }

  if (isOwnerRoute(req) && userId) {
    const meta = sessionClaims as {
      publicMetadata?: { role?: string };
      metadata?: { role?: string };
    };
    const role = meta?.publicMetadata?.role || meta?.metadata?.role;
    if (role !== "owner") {
      return NextResponse.redirect(new URL("/salons", req.url));
    }
  }
});

/** Skip Clerk on Edge when keys are missing — avoids MIDDLEWARE_INVOCATION_FAILED on Vercel. */
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured) {
    return NextResponse.next();
  }
  return withClerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
