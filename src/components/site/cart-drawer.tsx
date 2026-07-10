"use client";

import Image from "next/image";
import { ShoppingCart, Trash2, X, CalendarDays, Users, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { useFormatPrice } from "@/lib/use-currency";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const router = useRouter();
  const { cartOpen, setCartOpen, cart, removeFromCart, clearCart } = useStore();
  const fmt = useFormatPrice();

  const total = cart.reduce((sum, item) => sum + item.price * item.guests, 0);

  const checkoutItem = (experienceId: string, slug?: string) => {
    setCartOpen(false);
    if (slug) router.push(`/tours/${slug}`);
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-[family-name:var(--font-display)]">
            <ShoppingCart size={18} className="text-gold" /> Your Cart
            {cart.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{cart.length}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-12rem)]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <ShoppingCart size={28} className="text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold">Your cart is empty</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add experiences to your cart to book them together.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {cart.map((item) => (
                <div key={item.experienceId} className="flex gap-3 rounded-xl border border-border bg-card p-2.5">
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image src={item.image} alt={item.title} fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <h4 className="line-clamp-2 text-sm font-semibold">{item.title}</h4>
                    {item.destination && (
                      <p className="text-xs text-muted-foreground">{item.destination}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays size={10} /> {item.date}</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {item.guests}</span>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-[family-name:var(--font-display)] text-sm font-bold">{fmt(item.price * item.guests)}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => checkoutItem(item.experienceId, (item as any).slug)}>
                          Book <ArrowRight size={11} />
                        </Button>
                        <button onClick={() => { removeFromCart(item.experienceId); toast.success("Removed from cart"); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Separator className="my-3" />

              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-muted-foreground">Estimated total</span>
                <span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">{fmt(total)}</span>
              </div>
              <p className="px-1 text-xs text-muted-foreground">Taxes & fees calculated at checkout. Book each experience individually.</p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { clearCart(); toast.success("Cart cleared"); }}
              >
                <Trash2 size={14} /> Clear cart
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
