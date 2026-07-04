"use client";

import { Quote } from "lucide-react";
import { Stars } from "./ui-bits";

const TESTIMONIALS = [
  {
    name: "Sophie & Marc",
    trip: "Honeymoon · Maldives",
    quote:
      "From the AI itinerary to the overwater villa — every detail was perfect. Wanderlust made our honeymoon truly once-in-a-lifetime. We've already booked our next trip.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "The Whitfield Family",
    trip: "Family · Dubai",
    quote:
      "Traveling with three kids is stressful, but Wanderlust handled everything — transfers, tours, even last-minute changes. The desert balloon sunrise was pure magic.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Aiko Tanaka",
    trip: "Solo · Swiss Alps",
    quote:
      "As a solo traveler I value trust and safety. Every experience felt premium and well-organized. The Jungfrau trip was the highlight of my year.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
          Loved by travelers
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
          Stories from our <span className="gold-text">wanderers</span>
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
          >
            <Quote className="mb-4 h-8 w-8 text-gold/40" />
            <blockquote className="flex-1 font-[family-name:var(--font-display)] text-lg leading-relaxed text-foreground/90">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
              <img
                src={t.avatar}
                alt={t.name}
                className="h-11 w-11 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.trip}</div>
              </div>
              <div className="ml-auto">
                <Stars rating={5} />
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
