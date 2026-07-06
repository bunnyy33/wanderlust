"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatCompact, discountPercent } from "@/lib/format";
import { useFormatPrice } from "@/lib/use-currency";
import type { ExperienceType } from "@/lib/types";

export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-muted-foreground/25" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="text-gold fill-[var(--gold)]" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function PriceTag({
  price,
  original,
  currency = "USD",
  className,
  perNight,
}: {
  price: number;
  original?: number | null;
  currency?: string;
  className?: string;
  perNight?: boolean;
}) {
  const off = discountPercent(price, original);
  const fmt = useFormatPrice();
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">
          {fmt(price)}
        </span>
        {original && original > price && (
          <span className="text-sm text-muted-foreground line-through">
            {fmt(original)}
          </span>
        )}
      </div>
      {perNight && <span className="text-xs text-muted-foreground">per night</span>}
      {!perNight && off > 0 && (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {off}% off
        </span>
      )}
    </div>
  );
}

const TYPE_LABELS: Record<ExperienceType, string> = {
  TOUR: "Tour",
  ACTIVITY: "Activity",
  TRANSFER: "Transfer",
  CRUISE: "Cruise",
  ATTRACTION: "Attraction",
  ADVENTURE: "Adventure",
};

const TYPE_STYLES: Record<ExperienceType, string> = {
  TOUR: "bg-primary/10 text-primary",
  ACTIVITY: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  TRANSFER: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  CRUISE: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  ATTRACTION: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  ADVENTURE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export function TypeBadge({ type, className }: { type: ExperienceType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TYPE_STYLES[type],
        className
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

export function RatingPill({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm dark:bg-black/40",
        className
      )}
    >
      <Star size={12} className="text-gold fill-[var(--gold)]" />
      <span className="text-foreground">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-muted-foreground">({formatCompact(reviewCount)})</span>
      )}
    </div>
  );
}

export { TYPE_LABELS };
