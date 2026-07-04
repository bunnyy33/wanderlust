"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { ExperienceT, HotelT } from "@/lib/types";
import { PriceTag, TypeBadge } from "./ui-bits";
import Image from "next/image";
import { toast } from "sonner";

type Item = { kind: "EXPERIENCE" | "HOTEL"; id: string; data: ExperienceT | HotelT };

export function WishlistDrawer() {
  const { wishlistOpen, setWishlistOpen, sessionId, wishlist, toggleWish } = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (wishlist.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { items } = await api.wishlist(sessionId);
      setItems(items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wishlistOpen) load();
  }, [wishlistOpen, wishlist.length]);

  const remove = async (item: Item) => {
    const added = await toggleWish(item.kind, item.id);
    toast.success(added ? "Saved" : "Removed from wishlist");
  };

  return (
    <Sheet open={wishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-[family-name:var(--font-display)]">
            <Heart size={18} className="text-gold" /> My Wishlist
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
          {loading ? (
            <div className="space-y-3 p-1">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <Heart size={28} className="text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold">No saved items yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the heart on any experience or hotel to save it here for later.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {items.map((item) => {
                const data = item.data as ExperienceT & HotelT;
                const isExp = item.kind === "EXPERIENCE";
                return (
                  <div key={`${item.kind}:${item.id}`} className="flex gap-3 rounded-xl border border-border bg-card p-2.5">
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                      <Image src={data.images[0]} alt={isExp ? data.title : data.name} fill className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-1.5">
                        {isExp ? <TypeBadge type={(data as ExperienceT).type} /> : <span className="text-xs text-gold">{"★".repeat((data as HotelT).starRating)}</span>}
                      </div>
                      <h4 className="mt-1 line-clamp-2 text-sm font-semibold">{isExp ? data.title : data.name}</h4>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin size={10} /> {data.destination?.name}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <PriceTag price={isExp ? (data as ExperienceT).price : (data as HotelT).pricePerNight} perNight={!isExp} />
                        <button onClick={() => remove(item)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
