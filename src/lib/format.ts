// Currency formatting & pricing utilities.

export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function discountPercent(price: number, original?: number | null): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

// Compute booking totals for an experience.
//  - unit price * guests
//  - addons (optional array of {price})
//  - taxes & service fees (10%)
//  - coupon discount
export interface PriceBreakdown {
  subtotal: number;
  addonsTotal: number;
  taxesAndFees: number;
  discount: number;
  total: number;
}

export function computeExperiencePrice(opts: {
  price: number;
  guests: number;
  addons?: { price: number }[];
  coupon?: { discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null;
}): PriceBreakdown {
  const subtotal = opts.price * Math.max(1, opts.guests);
  const addonsTotal = (opts.addons ?? []).reduce((s, a) => s + a.price, 0);
  const taxesAndFees = Math.round((subtotal + addonsTotal) * 0.1 * 100) / 100;
  const base = subtotal + addonsTotal + taxesAndFees;

  let discount = 0;
  if (opts.coupon) {
    if (opts.coupon.discountType === "PERCENT") {
      discount = (base * opts.coupon.discountValue) / 100;
      if (opts.coupon.maxDiscount && discount > opts.coupon.maxDiscount) {
        discount = opts.coupon.maxDiscount;
      }
    } else {
      discount = opts.coupon.discountValue;
    }
    discount = Math.min(discount, base);
  }

  const total = Math.max(0, base - discount);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    addonsTotal: Math.round(addonsTotal * 100) / 100,
    taxesAndFees: Math.round(taxesAndFees * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function computeHotelPrice(opts: {
  pricePerNight: number;
  nights: number;
  priceModifier?: number;
  coupon?: { discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null;
}): PriceBreakdown {
  const nightly = opts.pricePerNight + (opts.priceModifier ?? 0);
  const subtotal = nightly * Math.max(1, opts.nights);
  const addonsTotal = 0;
  const taxesAndFees = Math.round(subtotal * 0.12 * 100) / 100;
  const base = subtotal + taxesAndFees;

  let discount = 0;
  if (opts.coupon) {
    if (opts.coupon.discountType === "PERCENT") {
      discount = (base * opts.coupon.discountValue) / 100;
      if (opts.coupon.maxDiscount && discount > opts.coupon.maxDiscount) {
        discount = opts.coupon.maxDiscount;
      }
    } else {
      discount = opts.coupon.discountValue;
    }
    discount = Math.min(discount, base);
  }

  const total = Math.max(0, base - discount);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    addonsTotal,
    taxesAndFees: Math.round(taxesAndFees * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function generateReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "WL-";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
