import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Wanderlust — Curated Luxury Travel & Experiences",
  description:
    "Discover handpicked tours, luxury hotels, private transfers and unforgettable experiences across the world's most stunning destinations. Book with confidence on Wanderlust.",
  keywords: [
    "luxury travel",
    "tours",
    "experiences",
    "hotels",
    "transfers",
    "Dubai tours",
    "Maldives",
    "Santorini",
    "AI trip planner",
    "book experiences",
  ],
  authors: [{ name: "Wanderlust" }],
  metadataBase: new URL("https://wanderlust-puce-nine.vercel.app"),
  openGraph: {
    title: "Wanderlust — Curated Luxury Travel & Experiences",
    description:
      "Handpicked tours, luxury hotels and unforgettable experiences. Plan smarter with our concierge and book with total confidence.",
    siteName: "Wanderlust",
    type: "website",
    images: [{ url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80", width: 1200, height: 630, alt: "Wanderlust luxury travel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderlust — Curated Luxury Travel & Experiences",
    description: "Handpicked tours, luxury hotels and unforgettable experiences across the world's most stunning destinations.",
    images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Sonner />
      </body>
    </html>
  );
}
