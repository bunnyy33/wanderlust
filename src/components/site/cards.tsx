"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceT, HotelT } from "@/lib/types";
import { PriceTag, RatingPill, TypeBadge, Stars } from "./ui-bits";
import { formatCompact } from "@/lib/format";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

// Track recently-viewed experiences in localStorage.
const RECENT_KEY = "wl_recent";
const MAX_RECENT = 8;

export function pushRecent(experience: ExperienceT) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: ExperienceT[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => e.id !== experience.id);
    const slim = { ...experience, itinerary: [] };
    const next = [slim, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("recent-changed"));
  } catch { /* ignore */ }
}

export function getRecent(): ExperienceT[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function ExperienceCard({
  experience,
  onOpen,
}: {
  experience: ExperienceT;
  onOpen?: (id: string) => void;
}) {
  const { toggleWish } = useStore();
  const inWish = useStore((s) => s.wishlist.includes(`EXPERIENCE:${experience.id}`));

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggleWish("EXPERIENCE", experience.id);
    toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
  };

  const href = experience.slug ? `/tours/${experience.slug}` : undefined;

  const CardInner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={experience.images[0] || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"}
          alt={experience.title}
          fill
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <TypeBadge type={experience.type} className="backdrop-blur" />
          {experience.bestseller && (
            <span className="rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--gold-foreground)] shadow">
              Bestseller
            </span>
          )}
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle wishlist"
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-all",
            inWish
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-foreground hover:bg-white"
          )}
        >
          <Heart size={16} className={cn(inWish && "fill-current")} />
        </button>
        <RatingPill
          rating={experience.rating}
          reviewCount={experience.reviewCount}
          className="absolute bottom-3 left-3"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span>{experience.destination?.name}, {experience.destination?.country}</span>
        </div>
        <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-foreground">
          {experience.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {experience.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {experience.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} /> Max {experience.groupSize}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <PriceTag price={experience.price} original={experience.originalPrice} />
          <span className="text-xs font-medium text-primary group-hover:underline">
            View details →
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => pushRecent(experience)} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {CardInner}
      </Link>
    );
  }
  return (
    <article onClick={() => onOpen?.(experience.id)} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {CardInner}
    </article>
  );
}

export function HotelCard({
  hotel,
  onOpen,
}: {
  hotel: HotelT;
  onOpen?: (id: string) => void;
}) {
  const { toggleWish } = useStore();
  const inWish = useStore((s) => s.wishlist.includes(`HOTEL:${hotel.id}`));

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggleWish("HOTEL", hotel.id);
    toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
  };

  const href = hotel.slug ? `/hotels/${hotel.slug}` : undefined;

  const CardInner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={hotel.images[0]}
          alt={hotel.name}
          fill
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {Array.from({ length: hotel.starRating }).map((_, i) => (
            <span key={i} className="text-gold">★</span>
          ))}
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle wishlist"
          className={cn(
            "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-all",
            inWish
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-foreground hover:bg-white"
          )}
        >
          <Heart size={16} className={cn(inWish && "fill-current")} />
        </button>
        {hotel.featured && (
          <span className="absolute bottom-3 left-3 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--gold-foreground)] shadow">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin size={12} />
          <span>{hotel.destination?.name}, {hotel.destination?.country}</span>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-foreground">
          {hotel.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {hotel.description}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <Stars rating={hotel.rating} size={13} />
          <span className="text-xs text-muted-foreground">
            {hotel.rating.toFixed(1)} · {formatCompact(hotel.reviewCount)} reviews
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {hotel.amenities.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {a}
            </span>
          ))}
          {hotel.amenities.length > 3 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              +{hotel.amenities.length - 3}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <PriceTag price={hotel.pricePerNight} original={hotel.originalPrice} perNight />
          <span className="text-xs font-medium text-primary group-hover:underline">
            View hotel →
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        {CardInner}
      </Link>
    );
  }
  return (
    <article onClick={() => onOpen?.(hotel.id)} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {CardInner}
    </article>
  );
}

// Wishlist is managed via the Zustand store (useStore.toggleWish / hasWish).
