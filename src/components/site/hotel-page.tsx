"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, MapPin, Clock, Check, Heart, ChevronRight, Loader2, ShieldCheck, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { computeHotelPrice } from "@/lib/format";
import { useFormatPrice } from "@/lib/use-currency";
import { Stars } from "./ui-bits";
import { PaymentCardModal } from "./payment-card-modal";
import { Header } from "./header";
import { Footer } from "./footer";
import type { HotelT, ReviewT } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = "details" | "checkout" | "confirmed";

export function HotelPageView({ hotel, reviews }: { hotel: HotelT; reviews: ReviewT[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [checkIn, setCheckIn] = useState(() => new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(() => new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10));
  const [roomIndex, setRoomIndex] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const fmt = useFormatPrice();
  const inWish = useStore((s) => s.wishlist.includes(`HOTEL:${hotel.id}`));
  const toggleWish = useStore((s) => s.toggleWish);

  const nights = useMemo(() => Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)), [checkIn, checkOut]);
  const room = hotel.roomTypes[roomIndex] || hotel.roomTypes[0];
  const price = useMemo(() => computeHotelPrice({ pricePerNight: hotel.pricePerNight, nights, priceModifier: room?.priceModifier, coupon }), [hotel.pricePerNight, nights, room, coupon]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true); setCouponMsg(null);
    try {
      const { coupon: c, discount } = await api.validateCoupon(couponCode, price.subtotal + price.taxesAndFees);
      setCoupon({ discountType: c.discountType, discountValue: c.discountValue, maxDiscount: c.maxDiscount });
      setCouponMsg({ ok: true, text: `Coupon applied — you save ${fmt(discount)}!` });
    } catch (e) { setCoupon(null); setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Invalid coupon" }); }
    finally { setValidating(false); }
  };

  const confirmBooking = async (info: { name: string; email: string; phone: string; requests: string }) => {
    try {
      await api.createBooking({
        type: "HOTEL", hotelId: hotel.id, checkInDate: checkIn, checkOutDate: checkOut,
        guests: room?.maxGuests || 2, nights, unitPrice: hotel.pricePerNight, addonsTotal: 0,
        taxesAndFees: price.taxesAndFees, discount: price.discount, totalAmount: price.total,
        customerName: info.name, customerEmail: info.email, customerPhone: info.phone,
        specialRequests: `${room?.name} · ${info.requests}`.trim(), couponCode: coupon ? couponCode.toUpperCase() : null, roomTypeName: room?.name,
      });
      toast.success("Reservation confirmed!"); setStep("confirmed");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Booking failed"); }
  };

  if (step === "confirmed") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"><PartyPopper size={36} className="text-emerald-600 dark:text-emerald-400" /></div>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold">Reservation confirmed! 🎉</h2>
          <p className="mt-2 max-w-md text-muted-foreground">Your stay at <strong className="text-foreground">{hotel.name}</strong> is confirmed. A confirmation has been sent to your email.</p>
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push("/")}>Back to Wanderlust <ArrowRight size={14} /></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <Gallery images={hotel.images} title={hotel.name} />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-gold">{Array.from({ length: hotel.starRating }).map((_, i) => <Star key={i} size={16} className="fill-[var(--gold)]" />)}</div>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight sm:text-4xl">{hotel.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Star size={15} className="text-gold fill-[var(--gold)]" /><strong className="text-foreground">{hotel.rating.toFixed(1)}</strong><span>({hotel.reviewCount.toLocaleString()} reviews)</span></span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {hotel.destination?.name}, {hotel.destination?.country}</span>
            </div>
            <p className="mt-6 text-lg leading-relaxed text-foreground/85">{hotel.longDescription}</p>
            <div className="mt-8"><h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">Amenities</h2><div className="flex flex-wrap gap-2">{hotel.amenities.map((a) => <span key={a} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium"><Check size={12} className="text-emerald-500" /> {a}</span>)}</div></div>
            <div className="mt-8"><h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">Room types</h2><div className="space-y-3">{hotel.roomTypes.map((r, i) => (<button key={r.name} onClick={() => setRoomIndex(i)} className={cn("flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors", roomIndex === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}><div><div className="font-medium text-foreground">{r.name}</div><div className="text-sm text-muted-foreground">{r.description}</div><div className="mt-1 text-xs text-muted-foreground">Sleeps {r.maxGuests}</div></div><div className="text-right"><div className="font-[family-name:var(--font-display)] font-bold">{fmt(hotel.pricePerNight + r.priceModifier)}</div><div className="text-xs text-muted-foreground">per night</div></div></button>))}</div></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoCard icon={<Clock size={16} />} title="Check-in / out" text={`Check-in from ${hotel.checkInTime} · Check-out by ${hotel.checkOutTime}`} />
              <InfoCard icon={<MapPin size={16} />} title="Location" text={hotel.address || hotel.destination?.name || ""} />
            </div>
            <div className="mt-8"><h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">Reviews ({hotel.reviewCount.toLocaleString()})</h2><div className="space-y-4"><div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/40 p-4"><div className="text-center"><div className="font-[family-name:var(--font-display)] text-3xl font-bold gold-text">{hotel.rating.toFixed(1)}</div><Stars rating={hotel.rating} /></div><div className="text-sm text-muted-foreground">Based on {reviews.length} verified reviews.</div></div>{reviews.map((r) => (<div key={r.id} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{r.authorName.charAt(0)}</div><div><div className="text-sm font-semibold">{r.authorName}</div><div className="text-xs text-muted-foreground">{r.travelDate} · Verified booking</div></div></div><Stars rating={r.rating} /></div><h4 className="mt-3 font-medium">{r.title}</h4><p className="mt-1 text-sm text-muted-foreground">{r.comment}</p></div>))}</div></div>
          </div>
          <div className="lg:sticky lg:top-20 lg:self-start">
            {step === "details" ? (
              <div className="rounded-2xl border border-border bg-card shadow-lg">
                <div className="border-b border-border bg-muted/30 px-5 py-4"><div className="flex items-baseline gap-2"><span className="font-[family-name:var(--font-display)] text-3xl font-bold">{fmt(hotel.pricePerNight + (room?.priceModifier || 0))}</span><span className="text-sm text-muted-foreground">/ night</span>{hotel.originalPrice && <span className="text-sm text-muted-foreground line-through">{fmt(hotel.originalPrice)}</span>}</div><div className="mt-0.5 text-xs text-muted-foreground">{room?.name} · Sleeps {room?.maxGuests}</div></div>
                <div className="space-y-6 p-5">
                  <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Dates</h4><div className="grid grid-cols-2 gap-3"><div><Label className="mb-1.5 block text-xs text-muted-foreground">Check-in</Label><Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div><div><Label className="mb-1.5 block text-xs text-muted-foreground">Check-out</Label><Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div></div><p className="mt-2 text-xs text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} selected</p></div>
                  <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Promo code</h4><div className="flex gap-2"><Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="WELCOME10" className="uppercase" /><Button variant="outline" onClick={applyCoupon} disabled={validating || !couponCode.trim()} className="shrink-0">{validating ? <Loader2 size={14} className="animate-spin" /> : "Apply"}</Button></div>{couponMsg ? <p className={cn("mt-2 text-xs", couponMsg.ok ? "text-emerald-600" : "text-rose-500")}>{couponMsg.text}</p> : <p className="mt-2 text-[11px] text-muted-foreground">Try <span className="font-medium text-foreground">WELCOME10</span> or <span className="font-medium text-foreground">HONEYMOON15</span></p>}</div>
                  <div className="rounded-xl border border-border bg-card p-4"><h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Price summary</h4><div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">{fmt(hotel.pricePerNight + (room?.priceModifier || 0))} × {nights} night{nights > 1 ? "s" : ""}</span><span>{fmt(price.subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Taxes & fees</span><span>{fmt(price.taxesAndFees)}</span></div>{price.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{fmt(price.discount)}</span></div>}</div><Separator className="my-3" /><div className="flex items-end justify-between"><span className="text-sm font-medium text-muted-foreground">Total</span><span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">{fmt(price.total)}</span></div></div>
                  <div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Toggle wishlist" onClick={async () => { const a = await toggleWish("HOTEL", hotel.id); toast.success(a ? "Saved to wishlist" : "Removed from wishlist"); }} className={cn("shrink-0", inWish && "border-rose-400 text-rose-500")}><Heart size={16} className={cn(inWish && "fill-current")} /></Button><Button className="h-12 flex-1 bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90" onClick={() => setStep("checkout")}>Reserve now <ChevronRight size={18} /></Button></div>
                  <div className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} className="text-emerald-500" /> Free cancellation · No booking fees</div>
                </div>
              </div>
            ) : (
              <Checkout title={hotel.name} date={`${checkIn} → ${checkOut}`} breakdown={price} summary={`${room?.name} · ${nights} night${nights > 1 ? "s" : ""}`} onBack={() => setStep("details")} onConfirm={confirmBooking} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const imgs = images.length > 0 ? images : ["https://images.unsplash.com/photo-1568607979400-366bd4ba1b73?auto=format&fit=crop&w=2000&q=80"];
  return (<div className="relative"><div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[2/1]"><Image src={imgs[active] || imgs[0]} alt={title} fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 1024px" /></div>{imgs.length > 1 && (<div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">{imgs.map((img, i) => (<button key={i} onClick={() => setActive(i)} className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all", i === active ? "border-primary" : "border-transparent opacity-60 hover:opacity-100")}><Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" sizes="96px" /></button>))}</div>)}</div>);
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<div className="rounded-xl border border-border bg-muted/30 p-4"><div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="text-primary">{icon}</span> {title}</div><p className="text-sm text-muted-foreground">{text}</p></div>);
}

function Checkout({ title, date, breakdown, summary, onBack, onConfirm }: { title: string; date: string; breakdown: { subtotal: number; taxesAndFees: number; discount: number; total: number }; summary: string; onBack: () => void; onConfirm: (info: { name: string; email: string; phone: string; requests: string }) => Promise<void> }) {
  const user = useStore((s) => s.user);
  const fmt = useFormatPrice();
  const [name, setName] = useState(() => user?.name || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [requests, setRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);
  const submit = () => setCardOpen(true);
  const onPaid = async () => { setCardOpen(false); setLoading(true); await onConfirm({ name, email, phone, requests }); setLoading(false); };
  return (<div className="rounded-2xl border border-border bg-card shadow-lg"><div className="border-b border-border bg-muted/30 px-5 py-4"><button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ChevronRight size={13} className="rotate-180" /> Back</button><h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">Checkout</h3><p className="mt-0.5 text-sm text-muted-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{date} · {summary}</p></div><div className="space-y-6 p-5"><div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Your details</h4><div className="space-y-3"><div><Label className="mb-1.5 block text-xs text-muted-foreground">Full name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div><div><Label className="mb-1.5 block text-xs text-muted-foreground">Email *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@email.com" /></div><div><Label className="mb-1.5 block text-xs text-muted-foreground">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" /></div><div><Label className="mb-1.5 block text-xs text-muted-foreground">Special requests</Label><Textarea value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="Dietary needs, accessibility, celebration…" className="min-h-[70px] resize-none" /></div></div></div><div className="rounded-xl border border-border bg-card p-4"><h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Order summary</h4><div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(breakdown.subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Taxes & fees</span><span>{fmt(breakdown.taxesAndFees)}</span></div>{breakdown.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>−{fmt(breakdown.discount)}</span></div>}</div><Separator className="my-3" /><div className="flex items-end justify-between"><span className="text-sm font-medium text-muted-foreground">Total due today</span><span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">{fmt(breakdown.total)}</span></div></div><Button className="h-12 w-full bg-gold text-base font-semibold text-[var(--gold-foreground)] hover:bg-gold/90" disabled={!valid || loading} onClick={submit}>{loading ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>Confirm & pay {fmt(breakdown.total)}</>}</Button><p className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} className="text-emerald-500" /> 256-bit SSL secure payment</p></div><PaymentCardModal open={cardOpen} amount={breakdown.total} onPaid={onPaid} onCancel={() => setCardOpen(false)} /></div>);
}
