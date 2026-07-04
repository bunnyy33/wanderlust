"use client";

import { useState } from "react";
import { User, Mail, Loader2, CalendarDays, Ticket, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { BookingT } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-500 text-white hover:bg-emerald-500",
  COMPLETED: "bg-primary text-primary-foreground hover:bg-primary",
  CANCELLED: "bg-rose-500 text-white hover:bg-rose-500",
  REFUNDED: "bg-amber-500 text-white hover:bg-amber-500",
  PENDING: "bg-muted text-muted-foreground hover:bg-muted",
};

export function AccountDialog() {
  const { accountOpen, setAccountOpen } = useStore();
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState<BookingT[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async () => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const { bookings } = await api.bookings(email);
      setBookings(bookings);
      setSearched(true);
    } catch {
      toast.error("Could not fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setAccountOpen(false);
    setSearched(false);
    setBookings([]);
    setEmail("");
  };

  return (
    <Dialog open={accountOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-display)]">
            <User size={18} className="text-gold" /> My Bookings
          </DialogTitle>
          <DialogDescription>
            Enter the email used at checkout to view your booking history.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="your@email.com"
              className="pl-9"
            />
          </div>
          <Button onClick={lookup} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={15} /> Find</>}
          </Button>
        </div>

        {searched && (
          <div className="mt-2 max-h-[50vh] space-y-3 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Ticket size={32} className="text-muted-foreground/50" />
                <p className="mt-2 font-medium">No bookings found</p>
                <p className="text-sm text-muted-foreground">Try a different email address.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{b.reference}</span>
                        <Badge className={STATUS_STYLES[b.status] || "bg-muted"}>{b.status}</Badge>
                      </div>
                      <h4 className="mt-1 font-[family-name:var(--font-display)] font-semibold">
                        {b.experience?.title || b.hotel?.name || "Booking"}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {format(parseISO(b.checkInDate), "MMM d, yyyy")}</span>
                        <span>{b.guests} guest{b.guests > 1 ? "s" : ""}{b.nights > 1 ? ` · ${b.nights} nights` : ""}</span>
                        {b.couponCode && <span className="text-gold">🏷 {b.couponCode}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-display)] text-lg font-bold gold-text">{formatPrice(b.totalAmount)}</div>
                      <div className="text-xs text-muted-foreground">{b.paymentStatus}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
