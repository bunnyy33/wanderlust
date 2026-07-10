"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { CURRENCIES } from "@/lib/use-currency";
import { cn } from "@/lib/utils";

export { CURRENCIES };

export function CurrencySwitcher() {
  const { currency, setCurrency } = useStore();
  const [open, setOpen] = useState(false);
  const current = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)} className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground" aria-label="Switch currency">
        <span className="font-semibold">{current.code}</span>
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {CURRENCIES.map((c) => (
            <button key={c.code} onClick={() => { setCurrency(c.code); setOpen(false); }} className={cn("flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent", c.code === currency && "bg-primary/5 font-semibold text-primary")}>
              <span>{c.label}</span><span className="text-muted-foreground">{c.symbol.trim()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
