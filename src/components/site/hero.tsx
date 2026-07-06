"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, MapPin, CalendarDays, Users, Sparkles, ShieldCheck, Award, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { DestinationT } from "@/lib/types";

export function Hero({
  destinations,
  onSearch,
}: {
  destinations: DestinationT[];
  onSearch?: (s: { destination: string; type: string; date: string; guests: number }) => void;
}) {
  const { setPlannerOpen } = useStore();
  const [destination, setDestination] = useState("all");
  const [type, setType] = useState("ALL");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);

  const submit = () => {
    onSearch?.({ destination, type, date, guests });
    const el = document.getElementById("experiences");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=2000&q=80"
          alt="Luxury travel"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Sparkles size={14} className="text-gold" />
            Smart travel planning, now live
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            The world's most
            <br />
            <span className="gold-text">extraordinary</span> journeys,
            <br />
            effortlessly yours.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            Handpicked tours, luxury hotels and private transfers across the world's most stunning destinations.
            Plan smarter with our concierge team and book with total confidence.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-gold text-[var(--gold-foreground)] hover:bg-gold/90"
            >
              Explore destinations
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPlannerOpen(true)}
              className="border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              <Sparkles size={16} className="text-gold" /> Plan my trip with AI
            </Button>
          </div>

          {/* Trust stats */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-white/90">
            <div className="flex items-center gap-2 text-sm">
              <Award size={18} className="text-gold" />
              <span><strong className="font-semibold">4.9/5</strong> from 180k+ travelers</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck size={18} className="text-gold" />
              <span>Free cancellation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe2 size={18} className="text-gold" />
              <span>18+ destinations</span>
            </div>
          </div>
        </div>

        {/* Search widget */}
        <div className="mt-12 max-w-4xl rounded-2xl border border-white/20 bg-white/95 p-3 shadow-2xl backdrop-blur dark:bg-black/80 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
            <Field icon={<MapPin size={16} />} label="Destination">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                <option value="all">All destinations</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.slug}>
                    {d.name}, {d.country}
                  </option>
                ))}
              </select>
            </Field>
            <Field icon={<Search size={16} />} label="Experience">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                <option value="ALL">All types</option>
                <option value="TOUR">Tours</option>
                <option value="ACTIVITY">Activities</option>
                <option value="ADVENTURE">Adventure</option>
                <option value="CRUISE">Cruises</option>
                <option value="ATTRACTION">Attractions</option>
                <option value="TRANSFER">Transfers</option>
              </select>
            </Field>
            <Field icon={<CalendarDays size={16} />} label="Date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
              />
            </Field>
            <Field icon={<Users size={16} />} label="Guests">
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </Field>
            <Button
              onClick={submit}
              size="lg"
              className="h-full min-h-[52px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Search size={18} className="sm:mr-1" />
              <span className="sm:hidden lg:inline">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 transition-colors hover:border-primary/40">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}
