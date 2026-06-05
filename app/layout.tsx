import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkPublishableKey, isClerkConfigured } from "@/lib/clerk-config";
import { Nav } from "@/components/nav";
import { MobileNav } from "@/components/mobile-nav";
import { Footer } from "@/components/footer";
import { DemoBanner } from "@/components/demo-banner";
import { ToastProvider } from "@/components/ui/toast";
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
  title: {
    default: "Glamora — Bangalore's AI-Powered Grooming Marketplace",
    template: "%s | Glamora Bangalore",
  },
  description: "Discover, compare, and book premium Bangalore salons with BeautyAI and conversational booking.",
  openGraph: {
    title: "Glamora Bangalore",
    description: "AI-Powered Grooming Marketplace",
    url: "https://glamora-bangalore.vercel.app",
    siteName: "Glamora",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glamora Bangalore",
    description: "AI-Powered Grooming Marketplace",
    images: ["/og-image.jpg"],
  },
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
        <ToastProvider>
          {isClerkConfigured() ? <DemoBanner /> : null}
          <Nav />
          <main className="min-h-screen pb-16 md:pb-0">{children}</main>
          <MobileNav />
          <Footer />
        </ToastProvider>
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
