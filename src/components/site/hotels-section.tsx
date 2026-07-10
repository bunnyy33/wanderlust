"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { HotelCard } from "./cards";
import { api } from "@/lib/api";
import type { HotelT } from "@/lib/types";
import { useStore } from "@/lib/store";

export function HotelsSection() {
  const { openDetail } = useStore();
  const [hotels, setHotels] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .hotels({ sort: "rating", limit: 8 })
      .then(({ hotels }) => setHotels(hotels))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="hotels" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
            Stay in style
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            Handpicked <span className="gold-text">luxury</span> hotels
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          From overwater villas to clifftop palaces — only the finest addresses,
          verified by our travel curators.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading hotels...
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hotels.map((h, i) => (
            <HotelCard key={h.id} hotel={h} priority={i < 4} onOpen={(id) => openDetail({ kind: "HOTEL", id })} />
          ))}
        </div>
      )}
    </section>
  );
}
