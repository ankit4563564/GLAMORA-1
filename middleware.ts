import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/salons(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/salons(.*)",
  "/api/seed(.*)",
]);

const isOwnerRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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
      return Response.redirect(new URL("/salons", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
