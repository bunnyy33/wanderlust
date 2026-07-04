"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X, Clock, MapPin, Users, Star, Check, X as XIcon, Heart, Share2,
  CalendarDays, ChevronRight, Loader2, ShieldCheck, Tag, Sparkles,
  PartyPopper, Copy, ArrowRight, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  computeExperiencePrice, computeHotelPrice, formatPrice,
} from "@/lib/format";
import { TypeBadge, Stars, RatingPill } from "./ui-bits";
import type { ExperienceT, HotelT, ReviewT } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ADDONS = [
  { id: "guide", name: "Private guide upgrade", price: 50 },
  { id: "photo", name: "Professional photo package", price: 35 },
  { id: "transfer", name: "Hotel pickup & drop-off", price: 25 },
];

type Step = "details" | "checkout" | "confirmed";

export function DetailDialog() {
  const { detail, closeDetail } = useStore();
  const open = !!detail;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDetail()}>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0 sm:rounded-3xl [&>button]:hidden">
        <DialogTitle className="sr-only">Experience details</DialogTitle>
        {detail && (
          <DetailLoader key={`${detail.kind}:${detail.id}`} target={detail} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailLoader({
  target,
}: {
  target: { kind: "EXPERIENCE" | "HOTEL"; id: string };
}) {
  const { sessionId } = useStore();
  const [experience, setExperience] = useState<ExperienceT | null>(null);
  const [hotel, setHotel] = useState<HotelT | null>(null);
  const [reviews, setReviews] = useState<ReviewT[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("details");

  useEffect(() => {
    let active = true;
    const fn =
      target.kind === "EXPERIENCE" ? api.experience(target.id) : api.hotel(target.id);
    fn
      .then((res: any) => {
        if (!active) return;
        if (target.kind === "EXPERIENCE") setExperience(res.experience);
        else setHotel(res.hotel);
        setReviews(res.reviews);
      })
      .catch(() => toast.error("Could not load details"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [target]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (experience) {
    return (
      <ExperienceDetail
        experience={experience}
        reviews={reviews}
        step={step}
        setStep={setStep}
        sessionId={sessionId}
      />
    );
  }
  if (hotel) {
    return (
      <HotelDetail
        hotel={hotel}
        reviews={reviews}
        step={step}
        setStep={setStep}
        sessionId={sessionId}
      />
    );
  }
  return null;
}

/* ----------------------------- Experience ----------------------------- */

function ExperienceDetail({
  experience, reviews, step, setStep, sessionId,
}: {
  experience: ExperienceT;
  reviews: ReviewT[];
  step: Step;
  setStep: (s: Step) => void;
  sessionId: string;
}) {
  const { closeDetail, openDetail } = useStore();
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

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponMsg(null);
    try {
      const { coupon: c, discount } = await api.validateCoupon(couponCode, price.subtotal + price.addonsTotal + price.taxesAndFees);
      setCoupon({ discountType: c.discountType, discountValue: c.discountValue, maxDiscount: c.maxDiscount });
      setCouponMsg({ ok: true, text: `Coupon applied — you save ${formatPrice(discount)}!` });
    } catch (e) {
      setCoupon(null);
      setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Invalid coupon" });
    } finally {
      setValidating(false);
    }
  };

  const confirmBooking = async (info: { name: string; email: string; phone: string; requests: string }) => {
    try {
      const { reference } = await api.createBooking({
        type: "EXPERIENCE",
        experienceId: experience.id,
        checkInDate: date,
        guests,
        nights: 1,
        unitPrice: experience.price,
        addonsTotal: price.addonsTotal,
        taxesAndFees: price.taxesAndFees,
        discount: price.discount,
        totalAmount: price.total,
        customerName: info.name,
        customerEmail: info.email,
        customerPhone: info.phone,
        specialRequests: info.requests,
        couponCode: coupon ? couponCode.toUpperCase() : null,
      });
      setBooking({ reference, total: price.total });
      setStep("confirmed");
      toast.success("Booking confirmed!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    }
  };

  return (
    <div className="relative flex max-h-[92vh] flex-col">
      <button
        onClick={closeDetail}
        className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
      >
        <X size={18} />
      </button>

      {step === "confirmed" && booking ? (
        <Confirmation
          reference={booking.reference}
          title={experience.title}
          total={booking.total}
          date={date}
          guests={guests}
          onClose={closeDetail}
        />
      ) : (
        <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.6fr_1fr]">
          {/* Left: details (scroll) */}
          <ScrollArea className="h-[92vh] lg:h-[88vh]">
            <Gallery images={experience.images} title={experience.title} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={experience.type} />
                {experience.bestseller && (
                  <Badge className="bg-gold text-[var(--gold-foreground)] hover:bg-gold">Bestseller</Badge>
                )}
                {experience.featured && <Badge variant="secondary">Featured</Badge>}
              </div>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight sm:text-3xl">
                {experience.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star size={15} className="text-gold fill-[var(--gold)]" />
                  <strong className="text-foreground">{experience.rating.toFixed(1)}</strong>
                  <span>({experience.reviewCount.toLocaleString()} reviews)</span>
                </span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {experience.destination?.name}, {experience.destination?.country}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {experience.duration}</span>
                <span className="flex items-center gap-1"><Users size={14} /> Max {experience.groupSize}</span>
              </div>

              <p className="mt-5 leading-relaxed text-foreground/85">{experience.longDescription}</p>

              {/* Highlights */}
              <Section title="Highlights">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {experience.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {h}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Itinerary */}
              {experience.itinerary.length > 0 && (
                <Section title="Itinerary">
                  <ol className="relative space-y-4 border-l border-border pl-6">
                    {experience.itinerary.map((it, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gold">{it.time}</div>
                        <div className="font-medium text-foreground">{it.title}</div>
                        <p className="text-sm text-muted-foreground">{it.description}</p>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* Includes / Excludes */}
              <div className="my-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-[family-name:var(--font-display)] font-semibold text-emerald-600 dark:text-emerald-400">What's included</h3>
                  <ul className="space-y-2">
                    {experience.includes.map((x, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><Check size={15} className="mt-0.5 shrink-0 text-emerald-500" /> {x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-3 font-[family-name:var(--font-display)] font-semibold text-rose-600 dark:text-rose-400">Not included</h3>
                  <ul className="space-y-2">
                    {experience.excludes.map((x, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><XIcon size={15} className="mt-0.5 shrink-0 text-rose-500" /> {x}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Meeting & cancellation */}
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={<MapPin size={16} />} title="Meeting point" text={experience.meetingPoint || experience.destination?.name || "Hotel pickup"} />
                <InfoCard icon={<ShieldCheck size={16} />} title="Cancellation" text={experience.cancellationPolicy} />
              </div>

              {/* Reviews */}
              <Section title={`Reviews (${experience.reviewCount.toLocaleString()})`}>
                <ReviewsList reviews={reviews} rating={experience.rating} />
              </Section>

              <p className="mt-8 text-xs text-muted-foreground">
                Operated by <strong className="text-foreground">{experience.vendorName}</strong> · Verified Wanderlust Partner
              </p>
            </div>
          </ScrollArea>

          {/* Right: booking widget */}
          <div className="border-l border-border bg-card">
            <ScrollArea className="h-[92vh] lg:h-[88vh]">
              {step === "details" ? (
                <BookingWidget
                  title={experience.title}
                  priceLabel={`${formatPrice(experience.price)} / person`}
                  original={experience.originalPrice}
                  date={date} setDate={setDate}
                  guests={guests} setGuests={setGuests}
                  guestsLabel="Participants"
                  addons={ADDONS}
                  selectedAddons={selectedAddons}
                  toggleAddon={(id) => setSelectedAddons((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
                  couponCode={couponCode} setCouponCode={setCouponCode}
                  couponMsg={couponMsg} applyCoupon={applyCoupon} validating={validating}
                  breakdown={price}
                  availability={experience.availability}
                  cta="Reserve now"
                  onCta={() => setStep("checkout")}
                />
              ) : (
                <Checkout
                  title={experience.title}
                  date={date}
                  breakdown={price}
                  summary={`${guests} participant${guests > 1 ? "s" : ""} · ${experience.duration}`}
                  onBack={() => setStep("details")}
                  onConfirm={confirmBooking}
                />
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Hotel ------------------------------- */

function HotelDetail({
  hotel, reviews, step, setStep, sessionId,
}: {
  hotel: HotelT;
  reviews: ReviewT[];
  step: Step;
  setStep: (s: Step) => void;
  sessionId: string;
}) {
  const { closeDetail } = useStore();
  const today = new Date();
  const [checkIn, setCheckIn] = useState(new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10));
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10));
  const [roomIndex, setRoomIndex] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ discountType: "PERCENT" | "FIXED"; discountValue: number; maxDiscount?: number | null } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [validating, setValidating] = useState(false);

  const nights = useMemo(() => {
    const a = new Date(checkIn).getTime();
    const b = new Date(checkOut).getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  }, [checkIn, checkOut]);

  const room = hotel.roomTypes[roomIndex] || hotel.roomTypes[0];
  const price = useMemo(
    () => computeHotelPrice({
      pricePerNight: hotel.pricePerNight,
      nights,
      priceModifier: room?.priceModifier,
      coupon,
    }),
    [hotel.pricePerNight, nights, room, coupon]
  );

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponMsg(null);
    try {
      const { coupon: c, discount } = await api.validateCoupon(couponCode, price.subtotal + price.taxesAndFees);
      setCoupon({ discountType: c.discountType, discountValue: c.discountValue, maxDiscount: c.maxDiscount });
      setCouponMsg({ ok: true, text: `Coupon applied — you save ${formatPrice(discount)}!` });
    } catch (e) {
      setCoupon(null);
      setCouponMsg({ ok: false, text: e instanceof Error ? e.message : "Invalid coupon" });
    } finally {
      setValidating(false);
    }
  };

  const confirmBooking = async (info: { name: string; email: string; phone: string; requests: string }) => {
    try {
      const { reference } = await api.createBooking({
        type: "HOTEL",
        hotelId: hotel.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: room?.maxGuests || 2,
        nights,
        unitPrice: hotel.pricePerNight,
        addonsTotal: 0,
        taxesAndFees: price.taxesAndFees,
        discount: price.discount,
        totalAmount: price.total,
        customerName: info.name,
        customerEmail: info.email,
        customerPhone: info.phone,
        specialRequests: `${room?.name} · ${info.requests}`.trim(),
        couponCode: coupon ? couponCode.toUpperCase() : null,
        roomTypeName: room?.name,
      });
      toast.success("Reservation confirmed!");
      setStep("confirmed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    }
  };

  return (
    <div className="relative flex max-h-[92vh] flex-col">
      <button
        onClick={closeDetail}
        className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
      >
        <X size={18} />
      </button>
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.6fr_1fr]">
        <ScrollArea className="h-[92vh] lg:h-[88vh]">
          <Gallery images={hotel.images} title={hotel.name} />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-1 text-gold">
              {Array.from({ length: hotel.starRating }).map((_, i) => <Star key={i} size={16} className="fill-[var(--gold)]" />)}
            </div>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold leading-tight sm:text-3xl">{hotel.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star size={15} className="text-gold fill-[var(--gold)]" /><strong className="text-foreground">{hotel.rating.toFixed(1)}</strong><span>({hotel.reviewCount.toLocaleString()} reviews)</span></span>
              <span className="flex items-center gap-1"><MapPin size={14} /> {hotel.destination?.name}, {hotel.destination?.country}</span>
            </div>
            <p className="mt-5 leading-relaxed text-foreground/85">{hotel.longDescription}</p>

            {/* Amenities */}
            <Section title="Amenities">
              <div className="flex flex-wrap gap-2">
                {hotel.amenities.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                    <Check size={12} className="text-emerald-500" /> {a}
                  </span>
                ))}
              </div>
            </Section>

            {/* Room types */}
            <Section title="Room types">
              <div className="space-y-3">
                {hotel.roomTypes.map((r, i) => (
                  <button
                    key={r.name}
                    onClick={() => setRoomIndex(i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors",
                      roomIndex === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div>
                      <div className="font-medium text-foreground">{r.name}</div>
                      <div className="text-sm text-muted-foreground">{r.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Sleeps {r.maxGuests}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-display)] font-bold">
                        {formatPrice(hotel.pricePerNight + r.priceModifier)}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard icon={<Clock size={16} />} title="Check-in / out" text={`Check-in from ${hotel.checkInTime} · Check-out by ${hotel.checkOutTime}`} />
              <InfoCard icon={<MapPin size={16} />} title="Location" text={hotel.address || hotel.destination?.name || ""} />
            </div>

            <Section title={`Reviews (${hotel.reviewCount.toLocaleString()})`}>
              <ReviewsList reviews={reviews} rating={hotel.rating} />
            </Section>
          </div>
        </ScrollArea>

        <div className="border-l border-border bg-card">
          <ScrollArea className="h-[92vh] lg:h-[88vh]">
            {step === "details" ? (
              <div className="flex flex-col">
                {/* Price header */}
                <div className="border-b border-border bg-muted/30 px-5 py-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-foreground">
                      {formatPrice(hotel.pricePerNight + (room?.priceModifier || 0))}
                    </span>
                    <span className="text-sm text-muted-foreground">/ night</span>
                    {hotel.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(hotel.originalPrice)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {room?.name} · Sleeps {room?.maxGuests}
                  </div>
                </div>

                <div className="flex-1 space-y-6 p-5">
                  {/* Dates */}
                  <WidgetSection label="Dates">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5 block text-xs text-muted-foreground">Check-in</Label>
                        <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                      </div>
                      <div>
                        <Label className="mb-1.5 block text-xs text-muted-foreground">Check-out</Label>
                        <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {nights} night{nights > 1 ? "s" : ""} selected
                    </p>
                  </WidgetSection>

                  {/* Coupon */}
                  <WidgetSection label="Promo code" hint="Save more">
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="WELCOME10"
                        className="uppercase"
                      />
                      <Button
                        variant="outline"
                        onClick={applyCoupon}
                        disabled={validating || !couponCode.trim()}
                        className="shrink-0"
                      >
                        {validating ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {couponMsg ? (
                      <p className={cn("mt-2 text-xs", couponMsg.ok ? "text-emerald-600" : "text-rose-500")}>
                        {couponMsg.text}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Try <span className="font-medium text-foreground">WELCOME10</span> or <span className="font-medium text-foreground">HONEYMOON15</span>
                      </p>
                    )}
                  </WidgetSection>

                  {/* Price summary */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Price summary</h4>
                    <div className="space-y-1.5 text-sm">
                      <Row
                        label={`${formatPrice(hotel.pricePerNight + (room?.priceModifier || 0))} × ${nights} night${nights > 1 ? "s" : ""}`}
                        value={formatPrice(price.subtotal)}
                      />
                      <Row label="Taxes & fees" value={formatPrice(price.taxesAndFees)} />
                      {price.discount > 0 && (
                        <Row label="Discount" value={`−${formatPrice(price.discount)}`} className="text-emerald-600" />
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                      <span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
                        {formatPrice(price.total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                    onClick={() => setStep("checkout")}
                  >
                    Reserve now <ChevronRight size={18} />
                  </Button>
                  <div className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck size={13} className="text-emerald-500" /> Free cancellation · No booking fees
                  </div>
                </div>
              </div>
            ) : (
              <Checkout
                title={hotel.name}
                date={`${checkIn} → ${checkOut}`}
                breakdown={price}
                summary={`${room?.name} · ${nights} night${nights > 1 ? "s" : ""}`}
                onBack={() => setStep("details")}
                onConfirm={confirmBooking}
              />
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Shared bits ----------------------------- */

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="relative">
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
        <Image src={images[active] || images[0]} alt={title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-gold" : "w-1.5 bg-white/60")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h3 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span> {title}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function ReviewsList({ reviews, rating }: { reviews: ReviewT[]; rating: number }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Be the first to review this experience.</p>;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-4">
        <div className="text-center">
          <div className="font-[family-name:var(--font-display)] text-3xl font-bold gold-text">{rating.toFixed(1)}</div>
          <Stars rating={rating} />
        </div>
        <div className="text-sm text-muted-foreground">Based on {reviews.length} verified reviews from happy travelers.</div>
      </div>
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {r.authorName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold">{r.authorName}</div>
                <div className="text-xs text-muted-foreground">{r.travelDate} · Verified booking</div>
              </div>
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

function BookingWidget({
  title, priceLabel, original, date, setDate, guests, setGuests, guestsLabel,
  addons, selectedAddons, toggleAddon, couponCode, setCouponCode, couponMsg, applyCoupon, validating, breakdown, availability, cta, onCta,
}: {
  title: string; priceLabel: string; original?: number | null;
  date: string; setDate: (v: string) => void;
  guests: number; setGuests: (v: number) => void; guestsLabel: string;
  addons: { id: string; name: string; price: number }[];
  selectedAddons: string[]; toggleAddon: (id: string) => void;
  couponCode: string; setCouponCode: (v: string) => void;
  couponMsg: { ok: boolean; text: string } | null;
  applyCoupon: () => void; validating: boolean;
  breakdown: { subtotal: number; addonsTotal: number; taxesAndFees: number; discount: number; total: number };
  availability: number; cta: string; onCta: () => void;
}) {
  const [priceAmt, priceUnit] = priceLabel.split(" / ");
  return (
    <div className="flex flex-col">
      {/* Price header */}
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-foreground">{priceAmt}</span>
          {original && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(original)}</span>
          )}
          {original && (
            <Badge className="ml-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
              {Math.round((1 - (original ? Number(priceAmt.replace(/[^0-9.]/g, "")) / original : 1)) * 100)}% off
            </Badge>
          )}
        </div>
        {priceUnit && <div className="mt-0.5 text-xs text-muted-foreground">{priceUnit}</div>}
        {availability <= 5 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            Only {availability} spots left
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 p-5">
        {/* Date & guests */}
        <WidgetSection label="When & who">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays size={12} /> Date
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Users size={12} /> {guestsLabel}
              </Label>
              <Select value={String(guests)} onValueChange={(v) => setGuests(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </WidgetSection>

        {/* Addons */}
        {addons.length > 0 && (
          <WidgetSection label="Add-ons" hint="Optional">
            <div className="space-y-2">
              {addons.map((a) => {
                const on = selectedAddons.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAddon(a.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm transition-colors",
                      on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "grid h-4 w-4 place-items-center rounded border transition-colors",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}>
                        {on && <Check size={11} />}
                      </span>
                      {a.name}
                    </span>
                    <span className="font-medium text-muted-foreground">+{formatPrice(a.price)}</span>
                  </button>
                );
              })}
            </div>
          </WidgetSection>
        )}

        {/* Coupon */}
        <WidgetSection label="Promo code" hint="Save more">
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="WELCOME10"
              className="uppercase"
            />
            <Button
              variant="outline"
              onClick={applyCoupon}
              disabled={validating || !couponCode.trim()}
              className="shrink-0"
            >
              {validating ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
            </Button>
          </div>
          {couponMsg ? (
            <p className={cn("mt-2 text-xs", couponMsg.ok ? "text-emerald-600" : "text-rose-500")}>
              {couponMsg.text}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Try <span className="font-medium text-foreground">WELCOME10</span>, <span className="font-medium text-foreground">LUXE25</span> or <span className="font-medium text-foreground">HONEYMOON15</span>
            </p>
          )}
        </WidgetSection>

        {/* Price summary */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(breakdown.subtotal)} />
            {breakdown.addonsTotal > 0 && <Row label="Add-ons" value={formatPrice(breakdown.addonsTotal)} />}
            <Row label="Taxes & fees" value={formatPrice(breakdown.taxesAndFees)} />
            {breakdown.discount > 0 && (
              <Row label="Discount" value={`−${formatPrice(breakdown.discount)}`} className="text-emerald-600" />
            )}
          </div>
          <Separator className="my-3" />
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
              {formatPrice(breakdown.total)}
            </span>
          </div>
        </div>

        <Button
          className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          onClick={onCta}
        >
          {cta} <ChevronRight size={18} />
        </Button>
        <div className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={13} className="text-emerald-500" /> Free cancellation · Secure payment
        </div>
      </div>
    </div>
  );
}

function WidgetSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {label}
        </h4>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}

function Checkout({
  title, date, breakdown, summary, onBack, onConfirm,
}: {
  title: string; date: string;
  breakdown: { subtotal: number; addonsTotal: number; taxesAndFees: number; discount: number; total: number };
  summary: string; onBack: () => void; onConfirm: (info: { name: string; email: string; phone: string; requests: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState("");
  const [pay, setPay] = useState("CARD");
  const [loading, setLoading] = useState(false);

  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    setLoading(true);
    await onConfirm({ name, email, phone, requests });
    setLoading(false);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronRight size={13} className="rotate-180" /> Back
        </button>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold">Checkout</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{date} · {summary}</p>
      </div>

      <div className="flex-1 space-y-6 p-5">
        {/* Contact details */}
        <WidgetSection label="Your details">
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Full name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Email *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@email.com" />
              <p className="mt-1 text-[11px] text-muted-foreground">Confirmation will be sent here.</p>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Special requests</Label>
              <Textarea value={requests} onChange={(e) => setRequests(e.target.value)} placeholder="Dietary needs, accessibility, celebration…" className="min-h-[70px] resize-none" />
            </div>
          </div>
        </WidgetSection>

        {/* Payment */}
        <WidgetSection label="Payment method">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "CARD", label: "Card" },
              { id: "APPLE", label: "Apple Pay" },
              { id: "PAYPAL", label: "PayPal" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPay(m.id)}
                className={cn(
                  "rounded-lg border p-2.5 text-sm font-medium transition-colors",
                  pay === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </WidgetSection>

        {/* Order summary */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">Order summary</h4>
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(breakdown.subtotal + breakdown.addonsTotal)} />
            <Row label="Taxes & fees" value={formatPrice(breakdown.taxesAndFees)} />
            {breakdown.discount > 0 && (
              <Row label="Discount" value={`−${formatPrice(breakdown.discount)}`} className="text-emerald-600" />
            )}
          </div>
          <Separator className="my-3" />
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total due today</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
              {formatPrice(breakdown.total)}
            </span>
          </div>
        </div>

        <Button
          className="h-12 w-full bg-gold text-base font-semibold text-[var(--gold-foreground)] hover:bg-gold/90"
          disabled={!valid || loading}
          onClick={submit}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Processing…</>
          ) : (
            <>Confirm & pay {formatPrice(breakdown.total)}</>
          )}
        </Button>
        <p className="-mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck size={13} className="text-emerald-500" /> 256-bit SSL secure payment
        </p>
      </div>
    </div>
  );
}

function Confirmation({
  reference, title, total, date, guests, onClose,
}: {
  reference: string; title: string; total: number; date: string; guests: number; onClose: () => void;
}) {
  return (
    <div className="flex h-[92vh] flex-col items-center justify-center p-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <PartyPopper size={36} className="text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold">You're going! 🎉</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        Your booking for <strong className="text-foreground">{title}</strong> is confirmed.
        A confirmation has been sent to your email.
      </p>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-border bg-muted/30 p-5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Booking reference</span>
          <button
            onClick={() => { navigator.clipboard.writeText(reference); toast.success("Reference copied"); }}
            className="flex items-center gap-1 font-mono font-bold text-primary hover:underline"
          >
            {reference} <Copy size={13} />
          </button>
        </div>
        <Separator className="my-3" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{date}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span>{guests}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount paid</span><span className="font-semibold gold-text">{formatPrice(total)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Confirmed</Badge></div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onClose}>Continue exploring</Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onClose}>
          <Sparkles size={15} /> Plan more <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
