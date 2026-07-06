"use client";

import { useStore } from "@/lib/store";

// Approximate static rates relative to USD. In production, fetch from an FX API.
export const CURRENCIES: { code: string; symbol: string; rate: number; label: string }[] = [
  { code: "USD", symbol: "$", rate: 1, label: "USD · US Dollar" },
  { code: "AED", symbol: "AED ", rate: 3.67, label: "AED · UAE Dirham" },
  { code: "EUR", symbol: "€", rate: 0.92, label: "EUR · Euro" },
  { code: "GBP", symbol: "£", rate: 0.79, label: "GBP · British Pound" },
  { code: "INR", symbol: "₹", rate: 83.2, label: "INR · Indian Rupee" },
];

// Format a USD amount into the user's selected currency.
export function useFormatPrice() {
  const currency = useStore((s) => s.currency);
  const cur = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  return (amountUSD: number, opts?: { compact?: boolean }) => {
    const converted = amountUSD * cur.rate;
    if (opts?.compact) {
      const n = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(converted);
      return `${cur.symbol}${n}`;
    }
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: converted % 1 === 0 ? 0 : 2,
    }).format(converted);
    return `${cur.symbol}${formatted}`;
  };
}

export function formatInCurrency(amountUSD: number, currencyCode: string): string {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  const converted = amountUSD * cur.rate;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: converted % 1 === 0 ? 0 : 2,
  }).format(converted);
  return `${cur.symbol}${formatted}`;
}
