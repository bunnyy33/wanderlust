"use client";

import { useEffect, useState, useCallback } from "react";
import { SlidersHorizontal, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExperienceCard } from "./cards";
import { api } from "@/lib/api";
import type { ExperienceT, DestinationT } from "@/lib/types";
import { useStore } from "@/lib/store";

const TYPES = [
  { value: "ALL", label: "All experiences" },
  { value: "TOUR", label: "Tours" },
  { value: "ACTIVITY", label: "Activities" },
  { value: "ADVENTURE", label: "Adventure" },
  { value: "CRUISE", label: "Cruises" },
  { value: "ATTRACTION", label: "Attractions" },
  { value: "TRANSFER", label: "Transfers" },
];

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "duration", label: "Shortest first" },
];

export function ExperiencesSection({
  destinations,
  initialFilter,
}: {
  destinations: DestinationT[];
  initialFilter?: { destination: string; type: string };
}) {
  const { openDetail } = useStore();
  const [experiences, setExperiences] = useState<ExperienceT[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(initialFilter?.type || "ALL");
  const [destination, setDestination] = useState(initialFilter?.destination || "all");
  const [sort, setSort] = useState("popular");
  const [q, setQ] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { experiences } = await api.experiences({
        type,
        destination: destination === "all" ? undefined : destination,
        sort,
        q: q || undefined,
        minPrice: priceRange[0] || undefined,
        maxPrice: priceRange[1] === 2000 ? undefined : priceRange[1],
      });
      setExperiences(experiences);
    } catch {
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [type, destination, sort, q, priceRange]);

  useEffect(() => {
    load();
  }, [load]);

  // Apply initial filter when hero search changes
  useEffect(() => {
    if (initialFilter) {
      setType(initialFilter.type);
      setDestination(initialFilter.destination);
    }
  }, [initialFilter]);

  return (
    <section id="experiences" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
              Curated experiences
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
              Tours & activities travelers <span className="gold-text">love</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search experiences..."
                className="w-56 pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal size={15} /> Filters
            </Button>
          </div>
        </div>

        {/* Quick filter chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (type === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-accent border border-border")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters bar */}
        {showFilters && (
          <div className="mb-6 grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destination</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All destinations</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.slug}>
                      {d.name}, {d.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Price range
                </Label>
                <span className="text-xs font-medium text-foreground">
                  ${priceRange[0]} – ${priceRange[1]}{priceRange[1] === 2000 ? "+" : ""}
                </span>
              </div>
              <Slider
                className="mt-3"
                value={priceRange}
                min={0}
                max={2000}
                step={50}
                onValueChange={(v) => setPriceRange(v as [number, number])}
              />
            </div>
          </div>
        )}

        {/* Active filters */}
        {(destination !== "all" || q) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Active:</span>
            {destination !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {destinations.find((d) => d.slug === destination)?.name}
                <X size={12} className="cursor-pointer" onClick={() => setDestination("all")} />
              </Badge>
            )}
            {q && (
              <Badge variant="secondary" className="gap-1">
                "{q}"
                <X size={12} className="cursor-pointer" onClick={() => setQ("")} />
              </Badge>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading experiences...
          </div>
        ) : experiences.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
              No experiences match your filters
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setType("ALL");
                setDestination("all");
                setQ("");
                setPriceRange([0, 2000]);
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {experiences.map((e) => (
              <ExperienceCard key={e.id} experience={e} onOpen={(id) => openDetail({ kind: "EXPERIENCE", id })} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
