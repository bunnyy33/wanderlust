"use client";

import { useRouter } from "next/navigation";
import { Compass, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export function Footer() {
  const router = useRouter();
  const goSection = (id: string) => {
    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="mt-auto bg-[oklch(0.22_0.04_195)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                <Compass size={20} className="text-gold" />
              </span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
                Wander<span className="gold-text">lust</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/80">
              Curated luxury travel experiences across the world's most stunning
              destinations. Handpicked tours, premium hotels and seamless
              transfers — booked with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-gold hover:text-[var(--gold-foreground)]"
                  aria-label="social"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-gold">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              <li><a href="/#destinations" className="transition-colors hover:text-gold">Destinations</a></li>
              <li><a href="/#experiences" className="transition-colors hover:text-gold">Tours & Activities</a></li>
              <li><a href="/#hotels" className="transition-colors hover:text-gold">Luxury Hotels</a></li>
              <li><a href="/#experiences" className="transition-colors hover:text-gold">Airport Transfers</a></li>
              <li><a href="/#planner" className="transition-colors hover:text-gold">Trip Planner</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-gold">
              Company
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              <li><button onClick={() => useStore.getState().setInquiryOpen(true)} className="transition-colors hover:text-gold">About Us</button></li>
              <li><button onClick={() => useStore.getState().setInquiryOpen(true)} className="transition-colors hover:text-gold">Become a Partner</button></li>
              <li><button onClick={() => useStore.getState().setInquiryOpen(true)} className="transition-colors hover:text-gold">Careers</button></li>
              <li><button onClick={() => useStore.getState().setInquiryOpen(true)} className="transition-colors hover:text-gold">Press</button></li>
              <li><button onClick={() => useStore.getState().setInquiryOpen(true)} className="transition-colors hover:text-gold">Sustainability</button></li>
            </ul>
          </div>

          {/* Newsletter + contact */}
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wider text-gold">
              Stay in the loop
            </h4>
            <p className="mt-4 text-sm text-white/80">
              Exclusive deals & travel inspiration, monthly.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("You're subscribed! Check your inbox for a welcome offer.");
                (e.currentTarget.querySelector("input") as HTMLInputElement).value = "";
              }}
              className="mt-3 flex gap-2"
            >
              <Input
                type="email"
                required
                placeholder="Your email"
                className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
              <Button type="submit" className="bg-gold text-[var(--gold-foreground)] hover:bg-gold/90">
                Join
              </Button>
            </form>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li>
                <button onClick={() => useStore.getState().setInquiryOpen(true)} className="flex items-center gap-2 transition-colors hover:text-gold">
                  <Mail size={14} className="text-gold" /> concierge@wanderlust.travel
                </button>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-gold" /> +971 4 555 0199
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-gold" /> 24/7 Global Concierge
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Wanderlust Travel Co. All rights reserved.</p>
          <div className="flex gap-5">
            <button onClick={() => useStore.getState().setInquiryOpen(true)} className="hover:text-gold">Privacy</button>
            <button onClick={() => useStore.getState().setInquiryOpen(true)} className="hover:text-gold">Terms</button>
            <button onClick={() => useStore.getState().setInquiryOpen(true)} className="hover:text-gold">Cookies</button>
            <button onClick={() => useStore.getState().setInquiryOpen(true)} className="hover:text-gold">Trust & Safety</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
