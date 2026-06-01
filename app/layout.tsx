import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkPublishableKey, isClerkConfigured } from "@/lib/clerk-config";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DemoBanner } from "@/components/demo-banner";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Glamora — Bangalore's AI-Powered Grooming Marketplace",
  description:
    "Discover, compare, and book premium Bangalore salons with BeautyAI and conversational booking.",
};

/** Avoid static page-data collection failures on Vercel (Clerk + server DB) */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const body = (
    <html
      lang="en"
      className={`dark ${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans">
        {isClerkConfigured() ? <DemoBanner /> : null}
        <Nav />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );

  if (!isClerkConfigured()) {
    return body;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>{body}</ClerkProvider>
  );
}
