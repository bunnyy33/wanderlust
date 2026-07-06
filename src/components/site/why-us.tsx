"use client";

import { ShieldCheck, RefreshCw, Headset, BadgeCheck, CreditCard, Award } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Book with total confidence",
    desc: "Verified partners, secure payments and full transparency on every booking.",
  },
  {
    icon: RefreshCw,
    title: "Free cancellation",
    desc: "Plans change. Most experiences offer free cancellation up to 24 hours before.",
  },
  {
    icon: Headset,
    title: "24/7 concierge support",
    desc: "Real humans, anytime, anywhere. We've got your back before, during and after.",
  },
  {
    icon: BadgeCheck,
    title: "Best price guarantee",
    desc: "Find it cheaper elsewhere? We'll match the price and add a travel credit.",
  },
  {
    icon: CreditCard,
    title: "Flexible payments",
    desc: "Pay your way — cards, wallets and local payment methods supported globally.",
  },
  {
    icon: Award,
    title: "Award-winning experiences",
    desc: "Travelers' Choice winners, year after year. Quality you can feel.",
  },
];

export function WhyUs() {
  return (
    <section className="bg-[oklch(0.22_0.04_195)] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
            Why Wanderlust
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            Trusted by 180,000+ travelers worldwide
          </h2>
          <p className="mt-4 text-white/80">
            We obsess over the details so you don't have to. Every experience is
            hand-verified, every partner vetted, every booking protected.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gold/20">
                <f.icon size={22} className="text-gold" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm text-white/75">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats band */}
        <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 md:grid-cols-4">
          {[
            { v: "180K+", l: "Happy travelers" },
            { v: "18+", l: "Destinations" },
            { v: "4.9/5", l: "Average rating" },
            { v: "$240M+", l: "Trips booked" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-[family-name:var(--font-display)] text-4xl font-bold gold-text">
                {s.v}
              </div>
              <div className="mt-1 text-sm text-white/70">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
