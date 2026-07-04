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
  openGraph: {
    title: "Wanderlust — Curated Luxury Travel & Experiences",
    description:
      "Handpicked tours, luxury hotels and unforgettable experiences. Plan smarter with our AI travel assistant.",
    siteName: "Wanderlust",
    type: "website",
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
