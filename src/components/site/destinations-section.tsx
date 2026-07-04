"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { DestinationT } from "@/lib/types";

export function DestinationsSection({
  destinations,
  onPick,
}: {
  destinations: DestinationT[];
  onPick?: (slug: string) => void;
}) {
  const featured = destinations.filter((d) => d.featured).slice(0, 6);
  const rest = destinations.filter((d) => !d.featured).slice(0, 4);

  return (
    <section id="destinations" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
            Where to next
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            Iconic destinations, <span className="gold-text">unforgettable</span> stays
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          From the golden dunes of Dubai to the overwater villas of the Maldives —
          explore the world's most coveted places.
        </p>
      </div>

      {/* Featured large grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((d, i) => (
          <button
            key={d.id}
            onClick={() => onPick?.(d.slug)}
            className={
              "group relative overflow-hidden rounded-2xl text-left " +
              (i === 0 ? "lg:col-span-2 lg:row-span-2 min-h-[320px] lg:min-h-[440px]" : "min-h-[220px]")
            }
          >
            <Image
              src={d.image}
              alt={d.name}
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                {d.country}
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {d.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-white/80">{d.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold opacity-0 transition-opacity group-hover:opacity-100">
                Explore <ArrowUpRight size={15} />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Rest */}
      {rest.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((d) => (
            <button
              key={d.id}
              onClick={() => onPick?.(d.slug)}
              className="group relative h-40 overflow-hidden rounded-2xl text-left"
            >
              <Image
                src={d.image}
                alt={d.name}
                fill
                sizes="(max-width:640px) 100vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/70">{d.country}</p>
                <h4 className="font-[family-name:var(--font-display)] text-lg font-bold text-white">
                  {d.name}
                </h4>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
