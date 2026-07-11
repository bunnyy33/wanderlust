"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useStore } from "@/lib/store";
import { Header } from "./header";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { DestinationsSection } from "./destinations-section";
import { ExperiencesSection } from "./experiences-section";
import { RecentlyViewed } from "./recently-viewed";
import { HotelsSection } from "./hotels-section";
import { WhyUs } from "./why-us";
import { Testimonials } from "./testimonials";

// Lazy load below-the-fold sections + heavy widgets
const PlannerSection = lazy(() => import("./planner-section").then(m => ({ default: m.PlannerSection })));
const RecommendationsSection = lazy(() => import("./recommendations-section").then(m => ({ default: m.RecommendationsSection })));
const AIChat = lazy(() => import("./ai-chat").then(m => ({ default: m.AIChat })));
const WhatsAppFab = lazy(() => import("./whatsapp-fab").then(m => ({ default: m.WhatsAppFab })));

// Lazy load heavy dialogs — only download JS when opened
const DetailDialog = lazy(() => import("./detail-dialog").then(m => ({ default: m.DetailDialog })));
const WishlistDrawer = lazy(() => import("./wishlist-drawer").then(m => ({ default: m.WishlistDrawer })));
const AccountDialog = lazy(() => import("./account-dialog").then(m => ({ default: m.AccountDialog })));
const AuthDialog = lazy(() => import("./auth-dialog").then(m => ({ default: m.AuthDialog })));
const InquiryDialog = lazy(() => import("./inquiry-dialog").then(m => ({ default: m.InquiryDialog })));
const CartDrawer = lazy(() => import("./cart-drawer").then(m => ({ default: m.CartDrawer })));

import type { DestinationT } from "@/lib/types";

export function SiteApp({ destinations }: { destinations: DestinationT[] }) {
  const {
    theme,
    loadWishlist,
    wishlistLoaded,
    user,
    userChecked,
    checkUser,
    inquiryOpen,
    setInquiryOpen,
  } = useStore();
  const [filter, setFilter] = useState<{ destination: string; type: string }>({
    destination: "all",
    type: "ALL",
  });

  // Apply theme on mount (persisted)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Load wishlist once on mount
  useEffect(() => {
    if (!wishlistLoaded) loadWishlist();
  }, [wishlistLoaded, loadWishlist]);

  // Load customer session on mount
  useEffect(() => {
    if (!userChecked) checkUser();
  }, [userChecked, checkUser]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onSearchClick={() => document.getElementById("experiences")?.scrollIntoView({ behavior: "smooth" })} />
      <main className="flex-1">
        <Hero
          destinations={destinations}
          onSearch={(s) =>
            setFilter({ destination: s.destination, type: s.type })
          }
        />
        <DestinationsSection
          destinations={destinations}
          onPick={(slug) => {
            setFilter({ destination: slug, type: "ALL" });
            document.getElementById("experiences")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <ExperiencesSection destinations={destinations} initialFilter={filter} />
        <RecentlyViewed />
        <HotelsSection />
        <Suspense fallback={null}><PlannerSection destinations={destinations} /></Suspense>
        <Suspense fallback={null}><RecommendationsSection /></Suspense>
        <WhyUs />
        <Testimonials />
      </main>
      <Footer />

      {/* Overlays — lazy loaded to reduce initial JS bundle */}
      <Suspense fallback={null}>
        <DetailDialog />
      </Suspense>
      <Suspense fallback={null}><AIChat /></Suspense>
      <Suspense fallback={null}><WhatsAppFab /></Suspense>
      <Suspense fallback={null}>
        <WishlistDrawer />
        <CartDrawer />
        <AccountDialog />
        <AuthDialog />
        <InquiryDialog open={inquiryOpen} onOpenChange={setInquiryOpen} />
      </Suspense>
    </div>
  );
}
