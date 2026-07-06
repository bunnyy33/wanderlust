"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Header } from "./header";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { DestinationsSection } from "./destinations-section";
import { ExperiencesSection } from "./experiences-section";
import { HotelsSection } from "./hotels-section";
import { PlannerSection } from "./planner-section";
import { RecommendationsSection } from "./recommendations-section";
import { WhyUs } from "./why-us";
import { Testimonials } from "./testimonials";
import { DetailDialog } from "./detail-dialog";
import { AIChat } from "./ai-chat";
import { WishlistDrawer } from "./wishlist-drawer";
import { AccountDialog } from "./account-dialog";
import { AuthDialog } from "./auth-dialog";
import { InquiryDialog } from "./inquiry-dialog";
import { CartDrawer } from "./cart-drawer";
import { WhatsAppFab } from "./whatsapp-fab";
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
        <HotelsSection />
        <PlannerSection destinations={destinations} />
        <RecommendationsSection />
        <WhyUs />
        <Testimonials />
      </main>
      <Footer />

      {/* Overlays */}
      <DetailDialog />
      <AIChat />
      <WhatsAppFab />
      <WishlistDrawer />
      <CartDrawer />
      <AccountDialog />
      <AuthDialog />
      <InquiryDialog open={inquiryOpen} onOpenChange={setInquiryOpen} />
    </div>
  );
}
