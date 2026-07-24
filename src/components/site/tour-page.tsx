"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Clock, Users, Check, X, Heart, CalendarDays, ChevronRight,
  Loader2, ShieldCheck, PartyPopper, Copy, ArrowRight, ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageCarousel } from "./image-carousel";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { computeExperiencePrice } from "@/lib/format";
import { useFormatPrice } from "@/lib/use-currency";
import { getCancellationInfo } from "@/lib/cancellation";
import { TypeBadge, Stars } from "./ui-bits";
import { PaymentCardModal } from "./payment-card-modal";
import { Header } from "./header";
import { Footer } from "./footer";
import { pushRecent } from "./cards";
import type { ExperienceT, ReviewT } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ADDONS = [
  { id: "guide", name: "Private guide upgrade", price: 50 },
  { id: "photo", name: "Professional photo package", price: 35 },
  { id: "transfer", name: "Hotel pickup & drop-off", price: 25 },
];

type Step = "details" | "checkout" | "confirmed";

export function TourPageView({
  experience,
  reviews,
}: {
  experience: ExperienceT;
  reviews: ReviewT[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [date, setDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
  const [guests, setGuests] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [validating, setValidating] = useState(false);
  const [booking, setBooking] = useState<{ reference: string; total: number } | null>(null);

  const addons = ADDONS.filter((a) => selectedAddons.includes(a.id));
  const price = useMemo(
    () => computeExperiencePrice({ price: experience.price, guests, addons, coupon }),
    [experience.price, guests, addons, coupon]
  );
  const fmt = useFormatPrice();
  const inWish = useStore((s) => s.wishlist.includes(`EXPERIENCE:${experience.id}`));
  const toggleWish = useStore((s) => s.toggleWish);
  const cancelInfo = getCancellationInfo(experience.cancellationType);

  useEffect(() => {
    pushRecent(experience);
  }, [experience]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true); setCouponMsg(null);
    try {
      const { coupon: c, discount } = await api.validateCoupon(couponCode, price.subtotal + price.addonsTotal + price.taxesAndFees);
      setCoupon({ discountType: c.discountType, discountValue: c.discountValue, maxDiscount: c.maxDiscount });
      setCouponMsg({ ok: true, text: `Coupon applied — you save ${fmt(discount)}!` });
    } catch (e) {
      setCoupon(null);
      setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Invalid coupon" });
    } finally { setValidating(false); }
  };

  const confirmBooking = async (info: { name: string; email: string; phone: string; requests: string }) => {
    try {
      const { reference } = await api.createBooking({
        type: "EXPERIENCE", experienceId: experience.id,
        checkInDate: date, guests, nights: 1,
        unitPrice: experience.price, addonsTotal: price.addonsTotal,
        taxesAndFees: price.taxesAndFees, discount: price.discount, totalAmount: price.total,
        customerName: info.name, customerEmail: info.email, customerPhone: info.phone,
        specialRequests: info.requests, couponCode: coupon ? couponCode.toUpperCase() : null,
      });
      setBooking({ reference, total: price.total });
      setStep("confirmed");
      toast.success("Booking confirmed!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    }
  };

  if (step === "confirmed" && booking) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <Confirmation reference={booking.reference} title={experience.title} total={booking.total} date={date} guests={guests} onHome={() => router.push("/")} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <ImageCarousel images={experience.images} title={experience.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={experience.type} />
              {experience.bestseller && <Badge className="bg-gold text-[var(--gold-foreground)] hover:bg-gold">Bestseller</Badge>}
              {experience.featured && <Badge variant="secondary">Featured</Badge>}
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold leading-tight sm:text-4xl">{experience.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Star size={15} className="text-gold fill-[var(--gold)]" /><strong className="text-foreground">{experience.rating.toFixed(1)}</strong><span>({experience.reviewCount.toLocaleString()} reviews)</span></span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {experience.destination?.name}, {experience.destination?.country}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {experience.duration}</span>
              <span className="flex items-center gap-1"><Users size={14} /> Max {experience.groupSize}</span>
            </div>

            {/* Cancellation badge */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", cancelInfo.badgeClass)}>
                <ShieldCheck size={12} /> {cancelInfo.title}
              </Badge>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-foreground/85">{experience.longDescription}</p>

            <Section title="Highlights">
              <ul className="grid gap-2 sm:grid-cols-2">
                {experience.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {h}</li>
                ))}
              </ul>
            </Section>

            {experience.itinerary.length > 0 && (
              <Section title="Itinerary">
                <ol className="relative space-y-4 border-l border-border pl-6">
                  {experience.itinerary.map((it, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                      <div className="text-xs font-semibold uppercase tracking-wider text-gold">{it.time}</div>
                      <div className="font-medium text-foreground">{it.title}</div>
                      <p className="text-sm text-muted-foreground">{it.description}</p>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            <div className="my-10 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-[family-name:var(--font-display)] font-semibold text-emerald-600 dark:text-emerald-400">What's included</h3>
                <ul className="space-y-2">{experience.includes.map((x, i) => (<li key={i} className="flex items-start gap-2 text-sm"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {x}</li>))}</ul>
              </div>
              <div>
                <h3 className="mb-3 font-[family-name:var(--font-display)] font-semibold text-rose-600 dark:text-rose-400">Not included</h3>
                <ul className="space-y-2">{experience.excludes.map((x, i) => (<li key={i} className="flex items-start gap-2 text-sm"><X size={15} className="mt-0.5 shrink-0 text-rose-500" /> {x}</li>))}</ul>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard icon={<MapPin size={16} />} title="Meeting point" text={experience.meetingPoint || experience.destination?.name || "Hotel pickup"} />
              <InfoCard icon={<ShieldCheck size={16} />} title="Cancellation policy" text={cancelInfo.description} />
            </div>

            <Section title={`Reviews (${experience.reviewCount.toLocaleString()})`}>
              <ReviewsList reviews={reviews} rating={experience.rating} />
            </Section>

            <p className="mt-8 text-xs text-muted-foreground">Operated by <strong className="text-foreground">{experience.vendorName}</strong> · Verified Wanderlust Partner</p>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            {step === "details" ? (
              <BookingSidebar
                experience={experience} cancelInfo={cancelInfo}
                date={date} setDate={setDate} guests={guests} setGuests={setGuests}
                selectedAddons={selectedAddons} toggleAddon={(id) => setSelectedAddons((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
                couponCode={couponCode} setCouponCode={setCouponCode} couponMsg={couponMsg} applyCoupon={applyCoupon} validating={validating}
                breakdown={price} inWish={inWish}
                onWish={async () => { const a = await toggleWish("EXPERIENCE", experience.id); toast.success(a ? "Saved to wishlist" : "Removed from wishlist"); }}
                onCta={() => setStep("checkout")}
              />
            ) : (
              <Checkout title={experience.title} date={date} breakdown={price} summary={`${guests} participant${guests > 1 ? "s" : ""} · ${experience.duration}`} onBack={() => setStep("details")} onConfirm={confirmBooking} />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<div className="mt-8"><h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold sm:text-2xl">{title}</h2>{children}</div>);
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (<div className="rounded-xl border border-border bg-muted/30 p-4"><div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground"><span className="text-primary">{icon}</span> {title}</div><p className="text-sm text-muted-foreground">{text}</p></div>);
}

function BookingSidebar({
  experience, cancelInfo, date, setDate, guests, setGuests,
  selectedAddons, toggleAddon, couponCode, setCouponCode, couponMsg, applyCoupon, validating,
  breakdown, inWish, onWish, onCta,
}: {
  experience: ExperienceT; cancelInfo: ReturnType<typeof getCancellationInfo>;
  date: string; setDate: (v: string) => void; guests: number; setGuests: (v: number) => void;
  selectedAddons: string[]; toggleAddon: (id: string) => void;
  couponCode: string; setCouponCode: (v: string) => void;
  couponMsg: { ok: boolean; text: string } | null; applyCoupon: () => void; validating: boolean;
  breakdown: { subtotal: number; addonsTotal: number; taxesAndFees: number; discount: number; total: number };
  inWish: boolean; onWish: () => void; onCta: () => void;
}) {
  const fmt = useFormatPrice();
  const addToCart = useStore((s) => s.addToCart);
  const availability = experience.availability;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-foreground">{fmt(experience.price)}</span>
          {experience.originalPrice && <span className="text-sm text-muted-foreground line-through">{fmt(experience.originalPrice)}</span>}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">per person</div>
        {availability <= 5 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /></span>
            Only {availability} spots left
          </div>
        )}
      </div>
      <div className="space-y-6 p-5">
        <WidgetSection label="When & who">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays size={12} /> Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Users size={12} /> Participants</Label>
              <Select value={String(guests)} onValueChange={(v) => setGuests(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
        </WidgetSection>

        <WidgetSection label="Add-ons" hint="Optional">
          <div className="space-y-2">
            {ADDONS.map((a) => {
              const on = selectedAddons.includes(a.id);
              return (
                <button key={a.id} onClick={() => toggleAddon(a.id)} className={cn("flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm transition-colors", on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                  <span className="flex items-center gap-2"><span className={cn("grid h-4 w-4 place-items-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>{on && <Check size={11} />}</span>{a.name}</span>
                  <span className="font-medium text-muted-foreground">+{fmt(a.price)}</span>
                </button>
              );
            })}
          </div>
        </WidgetSection>

        <WidgetSection label="Promo code" hint="Save more">
          <div className="flex gap-2">
            <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="WELCOME10" className="uppercase" />
            <Button variant="outline" onClick={applyCoupon} disabled={validating || !couponCode.trim()} className="shrink-0">{validating ? <Loader2 size={14} className="animate-spin" /> : "Apply"}</Button>
          </div>
          {couponMsg ? <p className={cn("mt-2 text-xs", couponMsg.ok ? "text-emerald-600" : "text-rose-500")}>{couponMsg.text}</p> : <p className="mt-2 text-[11px] text-muted-foreground">Try <span className="font-medium text-foreground">WELCOME10</span>, <span className="font-medium text-foreground">LUXE25</span> or <span className="font-medium text-foreground">HONEYMOON15</span></p>}
        </WidgetSection>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={fmt(breakdown.subtotal)} />
            {breakdown.addonsTotal > 0 && <Row label="Add-ons" value={fmt(breakdown.addonsTotal)} />}
            <Row label="Taxes & fees" value={fmt(breakdown.taxesAndFees)} />
            {breakdown.discount > 0 && <Row label="Discount" value={`−${fmt(breakdown.discount)}`} className="text-emerald-600" />}
          </div>
          <Separator className="my-3" />
          <div className="flex items-end justify-between"><span className="text-sm font-medium text-muted-foreground">Total</span><span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">{fmt(breakdown.total)}</span></div>
        </div>

        {/* Cancellation note in sidebar */}
        <div className={cn("rounded-lg border px-3 py-2 text-xs", cancelInfo.badgeClass)}>
          <strong>{cancelInfo.title}.</strong> {cancelInfo.short}.
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Toggle wishlist" onClick={onWish} className={cn("shrink-0", inWish && "border-rose-400 text-rose-500")}><Heart size={16} className={cn(inWish && "fill-current")} /></Button>
          <Button
            variant="outline"
            className="h-12 shrink-0 gap-1.5"
            onClick={() => {
              addToCart({
                experienceId: experience.id,
                title: experience.title,
                image: experience.images[0] || "",
                price: experience.price,
                date,
                guests,
                destination: experience.destination?.name,
              });
              toast.success("Added to cart");
            }}
          >
            <ShoppingCart size={16} /> <span className="hidden sm:inline">Add to cart</span>
          </Button>
          <Button className="h-12 flex-1 bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90" onClick={onCta}>Reserve now <ChevronRight size={18} /></Button>
        </div>
      </div>
    </div>
  );
}

function WidgetSection({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (<div><div className="mb-2 flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{label}</h4>{hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}</div>{children}</div>);
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (<div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className={className}>{value}</span></div>);
}

function Checkout({
  title, date, breakdown, summary, onBack, onConfirm,
}: {
  title: string; date: string;
  breakdown: { subtotal: number; addonsTotal: number; taxesAndFees: number; discount: number; total: number };
  summary: string; onBack: () => void; onConfirm: (info: { name: string; email: string; phone: string; requests: string }) => Promise<void>;
}) {
  const user = useStore((s) => s.user);
  const fmt = useFormatPrice();
  const [name, setName] = useState(() => user?.name || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [requests, setRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [pay, setPay] = useState("CARD");
  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);

  const submit = () => setCardOpen(true);
  const onPaid = async () => { setCardOpen(false); setLoading(true); await onConfirm({ name, email, phone, requests }); setLoading(false); };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"><ChevronRight size={13} className="rotate-180" /> Back</button>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">Checkout</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{date} · {summary}</p>
      </div>
      <div className="space-y-6 p-5">
        <WidgetSection label="Your details">
          <div className="space-y-3">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Full name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Email *</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@email.com" /><p className="mt-1 text-[11px] text-muted-foreground">Confirmation will be sent here.</p></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Special requests</Label><Textarea value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="Dietary needs, accessibility, celebration…" className="min-h-[70px] resize-none" /></div>
          </div>
        </WidgetSection>
        <WidgetSection label="Payment method">
          <div className="grid grid-cols-3 gap-2">
            {[{id:"CARD",l:"Card"},{id:"APPLE",l:"Apple Pay"},{id:"PAYPAL",l:"PayPal"}].map((m) => (<button key={m.id} onClick={() => setPay(m.id)} className={cn("rounded-lg border p-2.5 text-sm font-medium transition-colors", pay === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>{m.l}</button>))}
          </div>
        </WidgetSection>
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Order summary</h4>
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={fmt(breakdown.subtotal + breakdown.addonsTotal)} />
            <Row label="Taxes & fees" value={fmt(breakdown.taxesAndFees)} />
            {breakdown.discount > 0 && <Row label="Discount" value={`−${fmt(breakdown.discount)}`} className="text-emerald-600" />}
          </div>
          <Separator className="my-3" />
          <div className="flex items-end justify-between"><span className="text-sm font-medium text-muted-foreground">Total due today</span><span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">{fmt(breakdown.total)}</span></div>
        </div>
        <Button className="h-12 w-full bg-gold text-base font-semibold text-[var(--gold-foreground)] hover:bg-gold/90" disabled={!valid || loading} onClick={submit}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>Confirm & pay {fmt(breakdown.total)}</>}
        </Button>
        <p className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} className="text-emerald-500" /> 256-bit SSL secure payment</p>
      </div>
      <PaymentCardModal open={cardOpen} amount={breakdown.total} onPaid={onPaid} onCancel={() => setCardOpen(false)} />
    </div>
  );
}

function ReviewsList({ reviews, rating }: { reviews: ReviewT[]; rating: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
        <div className="flex items-center gap-4">
          <div className="text-center"><div className="font-[family-name:var(--font-display)] text-3xl font-bold gold-text">{rating.toFixed(1)}</div><Stars rating={rating} /></div>
          <div className="text-sm text-muted-foreground">Based on {reviews.length} verified reviews from happy travelers.</div>
        </div>
      </div>
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{r.authorName.charAt(0)}</div>
              <div><div className="text-sm font-semibold">{r.authorName}</div><div className="text-xs text-muted-foreground">{r.travelDate} · Verified booking</div></div>
            </div>
            <Stars rating={r.rating} />
          </div>
          <h4 className="mt-3 font-medium">{r.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}

function Confirmation({ reference, title, total, date, guests, onHome }: { reference: string; title: string; total: number; date: string; guests: number; onHome: () => void }) {
  const fmt = useFormatPrice();
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"><PartyPopper size={36} className="text-emerald-600 dark:text-emerald-400" /></div>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold">You're going! 🎉</h2>
      <p className="mt-2 max-w-md text-muted-foreground">Your booking for <strong className="text-foreground">{title}</strong> is confirmed. A confirmation has been sent to your email.</p>
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-muted/30 p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Booking reference</span>
          <button onClick={() => { navigator.clipboard.writeText(reference); toast.success("Reference copied"); }} className="flex items-center gap-1 font-mono font-bold text-primary hover:underline">{reference} <Copy size={13} /></button>
        </div>
        <Separator className="my-3" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{date}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span>{guests}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount paid</span><span className="font-semibold gold-text">{fmt(total)}</span></div>
        </div>
      </div>
      <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onHome}>Back to Wanderlust <ArrowRight size={14} /></Button>
    </div>
  );
}
