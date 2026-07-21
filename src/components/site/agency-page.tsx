"use client";

/**
 * Wanderlust — STANDALONE Agency Booking Page (/agency)
 * Back-office ERP for travel agency booking agents.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Bed, Car, ChevronDown, ChevronLeft, Compass, CreditCard,
  Eye, FileText, Gift, Home as HomeIcon, Loader2, LogOut, Mail, MapPin,
  Moon, Pencil, Plane, Plus, RefreshCw, Save, Search, ShieldAlert,
  Sticker, Sun, Ticket, Trash2, UserPlus, X,
} from "lucide-react";

import type {
  EmployeeT, ExtraBookingT, FlightBookingT, GuestT, HotelBookingT,
  PaymentT, ReservationListItemT, ReservationT, SupplierT, TourBookingT,
  TransportBookingT, VisaBookingT,
} from "@/lib/agency-types";
import {
  calcExtraPricing, calcFlightPricing, calcHotelPricing, calcTourPricing, calcVisaPricing,
} from "@/lib/agency-pricing";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

import { AdminLogin } from "./admin-login";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

/* ====================================================================== */
/* Constants                                                              */
/* ====================================================================== */

const BOOKING_STATUSES = [
  { value: "PENDING", label: "In Process", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "SUPPLIER_PENDING", label: "Supplier Confirmation Pending", badge: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "SUPPLIER_CONFIRMED", label: "Supplier Confirmed", badge: "bg-sky-100 text-sky-800 border-sky-200" },
  { value: "CUSTOMER_CONFIRMED", label: "Customer Confirmed", badge: "bg-teal-100 text-teal-800 border-teal-200" },
  { value: "COMPLETED", label: "Completed", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "CANCELLED", label: "Cancelled", badge: "bg-rose-100 text-rose-800 border-rose-200" },
];
const SERVICE_STATUSES = [
  { value: "INITIATED", label: "Initiated" },
  { value: "SUPPLIER_CONFIRMED", label: "Supplier Confirmed" },
  { value: "CUSTOMER_CONFIRMED", label: "Customer Confirmed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];
const CAR_TYPES = [
  { value: "SEDAN", label: "Sedan" }, { value: "SUV", label: "SUV" },
  { value: "MINIVAN", label: "Minivan" }, { value: "VAN", label: "Van" },
  { value: "LUXURY", label: "Luxury" }, { value: "COACH", label: "Coach" },
];
const TRANSPORT_TYPES = [
  { value: "ARRIVAL", label: "Arrival" }, { value: "DEPARTURE", label: "Departure" },
  { value: "INTERCITY", label: "Intercity" }, { value: "HOURLY", label: "Hourly" },
];
const TRANSFER_OPTIONS = [
  { value: "WITHOUT_TRANSFER", label: "Without Transfer" },
  { value: "SHARED", label: "Shared Transfer" },
  { value: "PRIVATE", label: "Private Transfer" },
];
const MEAL_PLANS = [
  { value: "BB", label: "Bed & Breakfast" }, { value: "HB", label: "Half Board" },
  { value: "FB", label: "Full Board" }, { value: "AI", label: "All Inclusive" },
];
const COST_UNITS = [
  { value: "PER_PERSON", label: "Per Person" }, { value: "PER_BOOKING", label: "Per Booking" },
];
const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" }, { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "WHATSAPP", label: "WhatsApp" }, { value: "ONLINE", label: "Online" },
];
const PAYMENT_STATUSES = [
  { value: "PENDING", label: "Pending" }, { value: "RECEIVED", label: "Received" },
  { value: "REFUNDED", label: "Refunded" },
];
const YES_NO = [{ value: "YES", label: "Yes" }, { value: "NO", label: "No" }];
const GUEST_TITLES = ["Mr", "Mrs", "Miss", "Master", "Dr"];
const PAX_TYPES = [
  { value: "ADULT", label: "Adult" }, { value: "CHILD", label: "Child" },
  { value: "INFANT", label: "Infant" },
];
const CABIN_CLASSES = [
  { value: "ECONOMY", label: "Economy" }, { value: "PREMIUM", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" }, { value: "FIRST", label: "First" },
];
const FLIGHT_TYPES = [
  { value: "ONE_WAY", label: "One Way" }, { value: "ROUND_TRIP", label: "Round Trip" },
  { value: "MULTI_CITY", label: "Multi City" },
];
const VISA_TYPES = [
  { value: "TOURIST", label: "Tourist" }, { value: "TRANSIT", label: "Transit" },
  { value: "BUSINESS", label: "Business" }, { value: "STUDENT", label: "Student" },
  { value: "WORK", label: "Work" },
];
const PROCESSING_TYPES = [
  { value: "NORMAL", label: "Normal" }, { value: "URGENT", label: "Urgent" },
  { value: "EXPRESS", label: "Express" },
];
const INVOICE_TYPES = [
  { value: "TAXABLE", label: "Taxable Invoice (5%)" },
  { value: "ZERO_RATED", label: "Zero Rated" },
  { value: "EXEMPT", label: "Exempt" },
];
const COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "India", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "China", "Japan",
  "Singapore", "Malaysia", "Thailand", "Indonesia", "Philippines", "Vietnam",
  "United Kingdom", "United States", "Canada", "Australia", "New Zealand",
  "Germany", "France", "Italy", "Spain", "Netherlands", "Switzerland",
  "Russia", "Turkey", "Egypt", "South Africa", "Nigeria", "Kenya",
  "Brazil", "Argentina", "Mexico", "Other",
];
type ServiceTabId = "home" | "hotels" | "tours" | "visas" | "flights" | "transport" | "extras" | "payments";
const SERVICE_TABS: { id: ServiceTabId; label: string; icon: typeof HomeIcon }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "hotels", label: "Hotels", icon: Bed },
  { id: "tours", label: "Tours", icon: MapPin },
  { id: "visas", label: "Visas", icon: Sticker },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "transport", label: "Transport", icon: Car },
  { id: "extras", label: "Extras", icon: Gift },
  { id: "payments", label: "Payments", icon: CreditCard },
];

/* ====================================================================== */
/* Helpers                                                                */
/* ====================================================================== */

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
function statusLabel(status: string): string {
  return BOOKING_STATUSES.find((s) => s.value === status)?.label ?? status;
}
function statusBadgeClass(status: string): string {
  return BOOKING_STATUSES.find((s) => s.value === status)?.badge ?? "bg-muted text-foreground border-border";
}
function money(cur: string | undefined | null, value: number): string {
  const c = cur || "AED";
  const v = Number.isFinite(value) ? value : 0;
  return `${c} ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(iso); }
}
function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return String(iso); }
}
function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); }
  catch { return ""; }
}
function toInputDateTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

function Field({ label, children, className, hint }: {
  label: string; children: React.ReactNode; className?: string; hint?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={cn("h-6 px-2 text-[11px] font-medium", statusBadgeClass(status))}>{statusLabel(status)}</Badge>;
}
function ServiceFormHeader({ title, updatedAt, onClose }: {
  title: string; updatedAt?: string; onClose?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-t-lg bg-primary px-4 py-2 text-primary-foreground">
      <span className="text-sm font-semibold">{title}</span>
      <div className="flex items-center gap-3 text-[11px] text-primary-foreground/80">
        {updatedAt && <span>Updated: <span className="font-medium">{fmtDateTime(updatedAt)}</span></span>}
        {onClose && (
          <button type="button" onClick={onClose} className="grid size-5 place-items-center rounded hover:bg-white/20" aria-label="Close form">
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
function SaveBtn({ children, onClick, loading, variant = "save" }: {
  children: React.ReactNode; onClick: () => void; loading?: boolean; variant?: "save" | "add";
}) {
  return (
    <Button type="button" size="sm" onClick={onClick} disabled={loading}
      className={cn("h-8 text-xs font-semibold",
        variant === "save" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
      {loading && <Loader2 className="mr-1 size-3.5 animate-spin" />}
      {children}
    </Button>
  );
}

interface TourCatalogItem { id: string; title: string; price: number; }
interface HotelCatalogItem { id: string; name: string; pricePerNight: number; }

/* ====================================================================== */
/* TopBar                                                                 */
/* ====================================================================== */

function TopBar({ onSignOut, onBackToSite, dark, onToggleDark }: {
  onSignOut: () => void; onBackToSite: () => void; dark: boolean; onToggleDark: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Compass className="size-6 text-gold" />
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Wander<span className="gold-text">lust</span>
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:inline">Agency</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onToggleDark} className="h-8 w-8 p-0" aria-label="Toggle dark mode">
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">AD</div>
        <Button type="button" variant="outline" size="sm" onClick={onSignOut} className="h-8 border-border text-xs">
          <LogOut className="mr-1.5 size-3.5" />Sign out
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onBackToSite} className="h-8 text-xs">
          <ChevronLeft className="mr-1 size-3.5" />Site
        </Button>
      </div>
    </header>
  );
}

/* ====================================================================== */
/* Service Tab Bar                                                        */
/* ====================================================================== */

function ServiceTabBar({ active, counts, onActivate }: {
  active: ServiceTabId; counts: Partial<Record<ServiceTabId, number>>; onActivate: (id: ServiceTabId) => void;
}) {
  return (
    <div className="sticky top-14 z-20 flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-2 py-1.5 no-scrollbar">
      {SERVICE_TABS.map((tab) => {
        const isActive = tab.id === active;
        const count = counts[tab.id];
        const Icon = tab.icon;
        return (
          <button key={tab.id} type="button" onClick={() => onActivate(tab.id)}
            className={cn("relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon className="size-3.5" />
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span className="ml-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">{count}</span>
            )}
            {isActive && <span className="absolute inset-x-2 -bottom-1.5 h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

/* ====================================================================== */
/* Booking List                                                           */
/* ====================================================================== */

function BookingList({ onOpen, onView }: {
  onOpen: (id: string) => void; onView: (r: ReservationListItemT) => void;
}) {
  const [items, setItems] = useState<ReservationListItemT[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "100");
      const res = await fetch(`/api/agency/reservations?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setItems(data.reservations ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load reservations");
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  async function handleNewBooking() {
    try {
      const res = await fetch("/api/agency/reservations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: "New Customer", customerEmail: `customer-${Date.now()}@wanderlust.travel`, bookingStatus: "PENDING", invoiceType: "TAXABLE", termsAccepted: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("New reservation created");
      onOpen(data.reservation.id);
    } catch (e: any) { toast.error(e.message ?? "Failed to create reservation"); }
  }

  async function handleOpen(id: string) {
    setOpeningId(id);
    try {
      const res = await fetch(`/api/agency/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingStatus: "PENDING" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, bookingStatus: "PENDING", ...(data.reservation ?? {}) } : r));
      onOpen(id);
    } catch (e: any) {
      toast.error(e.message ?? "Could not open, opening anyway");
      onOpen(id);
    } finally { setOpeningId(null); }
  }

  const kpis = useMemo(() => {
    const total = items.length;
    const revenue = items.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const currency = items[0]?.currency ?? "AED";
    const pending = items.filter((r) => ["PENDING", "SUPPLIER_PENDING"].includes(r.bookingStatus)).length;
    const completed = items.filter((r) => r.bookingStatus === "COMPLETED").length;
    return { total, revenue, currency, pending, completed };
  }, [items]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Bookings", value: kpis.total.toString(), cls: "border-primary/20 bg-primary/5 text-primary" },
          { label: "Revenue", value: money(kpis.currency, kpis.revenue), cls: "border-gold/30 bg-gold/5" },
          { label: "Pending", value: kpis.pending.toString(), cls: "border-amber-200 bg-amber-50 text-amber-800" },
          { label: "Completed", value: kpis.completed.toString(), cls: "border-emerald-200 bg-emerald-50 text-emerald-800" },
        ].map((k) => (
          <div key={k.label} className={cn("rounded-lg border p-3", k.cls)}>
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{k.label}</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by reference, customer, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9 text-sm" />
          </div>
          <div className="w-full sm:w-56">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {BOOKING_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw className="mr-1.5 size-3.5" />Refresh</Button>
            <Button size="sm" onClick={handleNewBooking} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-1.5 size-4" />New Booking</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        {loading ? (
          <div className="space-y-2 p-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Search className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No reservations found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search or create a new booking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="h-9 min-w-[140px] text-xs">Booking #</TableHead>
                  <TableHead className="h-9 min-w-[140px] text-xs">Customer</TableHead>
                  <TableHead className="h-9 min-w-[160px] text-xs">Email</TableHead>
                  <TableHead className="h-9 min-w-[120px] text-xs">Phone</TableHead>
                  <TableHead className="h-9 min-w-[180px] text-xs">Activity</TableHead>
                  <TableHead className="h-9 min-w-[120px] text-xs">Status</TableHead>
                  <TableHead className="h-9 w-12 text-xs text-right">View</TableHead>
                  <TableHead className="h-9 w-20 text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id} className="h-11 text-xs">
                    <TableCell className="font-mono font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        {r.isFlagged && <span className="size-1.5 rounded-full bg-rose-500" title="Flagged" />}
                        {r.reference}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">{r.customerEmail}</TableCell>
                    <TableCell className="text-muted-foreground">{r.customerPhone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.firstServiceName ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={r.bookingStatus} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(r)} title="Booking verification"><Eye className="size-3.5" /></Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" disabled={openingId === r.id} onClick={() => handleOpen(r.id)}>
                        {openingId === r.id ? <Loader2 className="size-3 animate-spin" /> : "Open"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* Booking Verification Dialog (eye button)                               */
/* ====================================================================== */

function BookingVerificationDialog({ reservation, onClose, onViewFull }: {
  reservation: ReservationListItemT | null; onClose: () => void; onViewFull: (r: ReservationListItemT) => void;
}) {
  if (!reservation) return null;
  let signals: string[] = [];
  try { signals = JSON.parse(reservation.fraudSignals); } catch { signals = []; }
  const risk = reservation.fraudScore >= 50 ? "High Risk" : reservation.fraudScore >= 25 ? "Medium Risk" : "Low Risk";
  const tone = reservation.fraudScore >= 50 ? "bg-rose-100 text-rose-700" : reservation.fraudScore >= 25 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";

  async function patchReview(value: string) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ manualReview: value }) });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Marked as ${value}`);
      onClose();
    } catch { toast.error("Failed to update review"); }
  }

  return (
    <Dialog open={!!reservation} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-600" />
            Booking Verification — {reservation.reference}
          </DialogTitle>
          <DialogDescription>Review fraud signals before processing this booking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-4 pt-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Customer</p><p className="font-medium">{reservation.customerName}</p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Email</p><p className="font-medium truncate">{reservation.customerEmail}</p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Phone</p><p className="font-medium">{reservation.customerPhone ?? "—"}</p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Total Amount</p><p className="font-mono font-semibold">{money(reservation.currency, reservation.totalAmount)}</p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">IP Address</p><p className="font-mono text-xs">{reservation.ipAddress ?? "—"}</p></div>
            <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Device</p><p className="text-xs text-muted-foreground">{reservation.userAgent?.slice(0, 40) ?? "—"}</p></div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fraud Score</span>
              <Badge variant="outline" className={cn("text-xs", tone)}>{reservation.fraudScore} — {risk}</Badge>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full transition-all", reservation.fraudScore >= 50 ? "bg-rose-500" : reservation.fraudScore >= 25 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, reservation.fraudScore)}%` }} />
            </div>
            {signals.length > 0 ? (
              <ul className="space-y-1">{signals.map((s, i) => <li key={i} className="flex items-center gap-2 text-xs text-foreground"><span className="size-1.5 rounded-full bg-amber-500" />{s}</li>)}</ul>
            ) : <p className="text-xs text-muted-foreground">No fraud signals detected.</p>}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 p-4 pt-0 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => patchReview("REAL")}>Mark Real</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => patchReview("SPAM")}>Mark Spam</Button>
          </div>
          <Button size="sm" className="h-8 bg-primary text-xs text-primary-foreground" onClick={() => onViewFull(reservation)}>Open Full Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ====================================================================== */
/* Generic Section Header (for module sections)                           */
/* ====================================================================== */

function SectionHeader({ title, count, addLabel, onAdd, disabled }: {
  title: string; count: number; addLabel: string; onAdd: () => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">({count} {count === 1 ? "record" : "records"})</span>
      </h3>
      <Button size="sm" className="h-8 bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onAdd} disabled={disabled}>
        <Plus className="mr-1 size-3.5" />{addLabel}
      </Button>
    </div>
  );
}

function EmptyState({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 px-3 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function RecordCard({ summary, status, expanded, onToggle, onEdit, onRemove, children }: {
  summary: string; status: string; expanded: boolean; onToggle: () => void; onEdit: () => void; onRemove: () => void; children: React.ReactNode;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !expanded && "-rotate-90")} />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{summary}</span>
          <Badge variant="outline" className="ml-1 shrink-0 text-[10px]">{status}</Badge>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit} title="Edit"><Pencil className="size-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDel(true)} title="Remove"><Trash2 className="size-3.5" /></Button>
        </div>
      </div>
      {expanded && <div className="border-t border-border p-3">{children}</div>}
      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent className="max-w-sm gap-0 p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle>Remove this record?</DialogTitle>
            <DialogDescription>This record will be permanently removed from the booking.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-4 pt-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setConfirmDel(false)}>Cancel</Button>
            <Button size="sm" className="h-8 bg-rose-600 text-white hover:bg-rose-700" onClick={() => { setConfirmDel(false); onRemove(); }}>
              <Trash2 className="mr-1.5 size-3.5" />Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Helper: re-fetch reservation after mutation */
async function refetchReservation(id: string): Promise<ReservationT | null> {
  const r = await fetch(`/api/agency/reservations/${id}`);
  const d = await r.json();
  return r.ok ? d.reservation : null;
}

/* ====================================================================== */
/* TOURS                                                                  */
/* ====================================================================== */

interface TourFormState {
  tourId: string; tourName: string; tourOption: string; transferOption: string;
  pickupLocation: string; tourDate: string; pickupTime: string; timeSlot: string;
  noOfAdults: number; noOfChildren: number; supplierId: string;
  confirmationNumber: string; status: string; comments: string;
  costUnit: string; adultCostRate: number; childCostRate: number; carCostRate: number;
  adultSellRate: number; childSellRate: number; carSellRate: number; showOnVoucher: boolean;
}
function emptyTour(): TourFormState {
  return { tourId: "", tourName: "", tourOption: "", transferOption: "WITHOUT_TRANSFER", pickupLocation: "", tourDate: toInputDate(new Date().toISOString()), pickupTime: "", timeSlot: "", noOfAdults: 2, noOfChildren: 0, supplierId: "", confirmationNumber: "", status: "INITIATED", comments: "", costUnit: "PER_PERSON", adultCostRate: 0, childCostRate: 0, carCostRate: 0, adultSellRate: 0, childSellRate: 0, carSellRate: 0, showOnVoucher: true };
}
function tourFromBooking(t: TourBookingT): TourFormState {
  return { tourId: t.tourId ?? "", tourName: t.tourName, tourOption: t.tourOption ?? "", transferOption: t.transferOption, pickupLocation: t.pickupLocation ?? "", tourDate: toInputDate(t.tourDate), pickupTime: t.pickupTime ?? "", timeSlot: t.timeSlot ?? "", noOfAdults: t.noOfAdults, noOfChildren: t.noOfChildren, supplierId: t.supplierId ?? "", confirmationNumber: t.confirmationNumber ?? "", status: t.status, comments: t.comments ?? "", costUnit: t.costUnit, adultCostRate: t.adultCostRate, childCostRate: t.childCostRate, carCostRate: t.carCostRate, adultSellRate: t.adultSellRate, childSellRate: t.childSellRate, carSellRate: t.carSellRate, showOnVoucher: t.showOnVoucher };
}

function TourForm({ initial, reservation, suppliers, experiences, onSaved, onCancel }: {
  initial: TourBookingT | null; reservation: ReservationT; suppliers: SupplierT[]; experiences: TourCatalogItem[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<TourFormState>(initial ? tourFromBooking(initial) : emptyTour());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? tourFromBooking(initial) : emptyTour()); }, [initial]);
  const pricing = useMemo(() => calcTourPricing({ costUnit: form.costUnit, adultCostRate: form.adultCostRate, childCostRate: form.childCostRate, carCostRate: form.carCostRate, adultSellRate: form.adultSellRate, childSellRate: form.childSellRate, carSellRate: form.carSellRate, noOfAdults: form.noOfAdults, noOfChildren: form.noOfChildren }), [form]);
  function patch(p: Partial<TourFormState>) { setForm((f) => ({ ...f, ...p })); }
  function pickTour(id: string) { const exp = experiences.find((e) => e.id === id); patch({ tourId: id, tourName: exp?.title ?? form.tourName, adultSellRate: exp ? exp.price : form.adultSellRate }); }
  async function save() {
    if (!form.tourName.trim()) { toast.error("Tour name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, tourId: form.tourId || null, supplierId: form.supplierId || null, tourDate: form.tourDate || new Date().toISOString() };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/tours/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/tours`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Tour updated" : "Tour added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save tour"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Tour Details" : "Add Tour"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Tour"><Select value={form.tourId || "__none__"} onValueChange={pickTour}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select tour" /></SelectTrigger><SelectContent><SelectItem value="__none__">— Custom tour —</SelectItem>{experiences.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Tour Option"><Input value={form.tourOption} onChange={(e) => patch({ tourOption: e.target.value })} className="h-9 text-xs" placeholder="e.g. 1 Day 2 Park Pass" /></Field>
          <Field label="Transfer Option"><Select value={form.transferOption} onValueChange={(v) => patch({ transferOption: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TRANSFER_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Pickup Location"><Input value={form.pickupLocation} onChange={(e) => patch({ pickupLocation: e.target.value })} className="h-9 text-xs" placeholder="Hotel / area" /></Field>
          <Field label="Tour Date"><Input type="date" value={form.tourDate} onChange={(e) => patch({ tourDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Pickup Time"><Input type="time" value={form.pickupTime} onChange={(e) => patch({ pickupTime: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Time Slot"><Input value={form.timeSlot} onChange={(e) => patch({ timeSlot: e.target.value })} className="h-9 text-xs" placeholder="e.g. 09:00 - 12:00" /></Field>
          <Field label="No of Adults"><Input type="number" min={0} value={form.noOfAdults} onChange={(e) => patch({ noOfAdults: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="No of Child"><Input type="number" min={0} value={form.noOfChildren} onChange={(e) => patch({ noOfChildren: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Tour Name" hint="Required"><Input value={form.tourName} onChange={(e) => patch({ tourName: e.target.value })} className="h-9 text-sm" placeholder="e.g. Desert Safari with BBQ Dinner" /></Field>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" placeholder="Special requests, dietary requirements, etc." /></Field>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
              <div className="w-32"><Field label="Pricing Mode"><Select value={form.costUnit} onValueChange={(v) => patch({ costUnit: v })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{COST_UNITS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></Field></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label="Adult Rate"><Input type="number" min={0} step="0.01" value={form.adultCostRate} onChange={(e) => patch({ adultCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child Rate"><Input type="number" min={0} step="0.01" value={form.childCostRate} onChange={(e) => patch({ childCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Car Rate"><Input type="number" min={0} step="0.01" value={form.carCostRate} onChange={(e) => patch({ carCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Net Adult"><Input readOnly value={pricing.netAdultRate.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs" /></Field>
              <Field label="Net Child"><Input readOnly value={pricing.netChildRate.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs" /></Field>
              <Field label="Total Cost"><Input readOnly value={pricing.totalCost.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs font-bold" /></Field>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Field label="Adult Rate"><Input type="number" min={0} step="0.01" value={form.adultSellRate} onChange={(e) => patch({ adultSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child Rate"><Input type="number" min={0} step="0.01" value={form.childSellRate} onChange={(e) => patch({ childSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Car Rate"><Input type="number" min={0} step="0.01" value={form.carSellRate} onChange={(e) => patch({ carSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Net Adult"><Input readOnly value={pricing.sellNetAdult.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs" /></Field>
              <Field label="Net Child"><Input readOnly value={pricing.sellNetChild.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs" /></Field>
              <Field label="Total Sell"><Input readOnly value={pricing.totalSell.toFixed(2)} className="h-8 bg-emerald-50 font-mono text-xs font-bold text-emerald-700" /></Field>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.showOnVoucher} onCheckedChange={(v) => patch({ showOnVoucher: v })} />Show on voucher</label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
            <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Tour</>}</SaveBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToursSection({ reservation, suppliers, experiences, onUpdated }: {
  reservation: ReservationT; suppliers: SupplierT[]; experiences: TourCatalogItem[]; onUpdated: (r: ReservationT) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/tours/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success("Tour removed");
      onUpdated(fresh ?? reservation);
    } catch { toast.error("Failed to remove tour"); }
  }
  return (
    <div className="space-y-3">
      <SectionHeader title="Tours" count={reservation.tours.length} addLabel="Add Tour" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <TourForm initial={null} reservation={reservation} suppliers={suppliers} experiences={experiences} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.tours.length === 0 && !showNew && <EmptyState label="No tours yet" hint='Click "Add Tour" to create the first tour record.' />}
      {reservation.tours.map((t) => (
        <RecordCard key={t.id} summary={`${t.tourName} · ${fmtDate(t.tourDate)} · ${t.noOfAdults}A ${t.noOfChildren}C`} status={t.status}
          expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onEdit={() => setExpandedId(expandedId === t.id ? null : t.id)} onRemove={() => doDelete(t.id)}>
          <TourForm initial={t} reservation={reservation} suppliers={suppliers} experiences={experiences} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* TRANSPORT                                                              */
/* ====================================================================== */

interface TransportFormState {
  carType: string; noOfPax: number; transportType: string; pickupDateTime: string;
  pickupLocation: string; dropoffLocation: string; flightNumber: string;
  netRate: number; sellRate: number; supplierId: string; contactNumber: string;
  confirmationNumber: string; status: string; comments: string; showOnVoucher: boolean;
}
function emptyTransport(): TransportFormState {
  return { carType: "SEDAN", noOfPax: 1, transportType: "ARRIVAL", pickupDateTime: toInputDateTime(new Date().toISOString()), pickupLocation: "", dropoffLocation: "", flightNumber: "", netRate: 0, sellRate: 0, supplierId: "", contactNumber: "", confirmationNumber: "", status: "INITIATED", comments: "", showOnVoucher: true };
}
function transportFromBooking(t: TransportBookingT): TransportFormState {
  return { carType: t.carType, noOfPax: t.noOfPax, transportType: t.transportType, pickupDateTime: toInputDateTime(t.pickupDateTime), pickupLocation: t.pickupLocation, dropoffLocation: t.dropoffLocation, flightNumber: t.flightNumber ?? "", netRate: t.netRate, sellRate: t.sellRate, supplierId: t.supplierId ?? "", contactNumber: t.contactNumber ?? "", confirmationNumber: t.confirmationNumber ?? "", status: t.status, comments: t.comments ?? "", showOnVoucher: t.showOnVoucher };
}
function TransportForm({ initial, reservation, suppliers, onSaved, onCancel }: {
  initial: TransportBookingT | null; reservation: ReservationT; suppliers: SupplierT[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<TransportFormState>(initial ? transportFromBooking(initial) : emptyTransport());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? transportFromBooking(initial) : emptyTransport()); }, [initial]);
  const margin = form.sellRate - form.netRate;
  function patch(p: Partial<TransportFormState>) { setForm((f) => ({ ...f, ...p })); }
  async function save() {
    if (!form.pickupLocation.trim()) { toast.error("Pickup location is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, supplierId: form.supplierId || null, pickupDateTime: form.pickupDateTime || new Date().toISOString() };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/transports/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/transports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Transport updated" : "Transport added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save transport"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Transport Details" : "Add Transport"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Vehicle"><Select value={form.carType} onValueChange={(v) => patch({ carType: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{CAR_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="No. of Pax"><Input type="number" min={1} value={form.noOfPax} onChange={(e) => patch({ noOfPax: Math.max(1, num(e.target.value, 1)) })} className="h-9 text-xs" /></Field>
          <Field label="Transport Type"><Select value={form.transportType} onValueChange={(v) => patch({ transportType: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{TRANSPORT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Pickup Date & Time"><Input type="datetime-local" value={form.pickupDateTime} onChange={(e) => patch({ pickupDateTime: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Pickup Location"><Input value={form.pickupLocation} onChange={(e) => patch({ pickupLocation: e.target.value })} className="h-9 text-xs" placeholder="Airport / hotel" /></Field>
          <Field label="Drop-off Location"><Input value={form.dropoffLocation} onChange={(e) => patch({ dropoffLocation: e.target.value })} className="h-9 text-xs" placeholder="Hotel / airport" /></Field>
          <Field label="Flight Number"><Input value={form.flightNumber} onChange={(e) => patch({ flightNumber: e.target.value })} className="h-9 font-mono text-xs" placeholder="EK 123" /></Field>
          <Field label="Net Rate"><Input type="number" min={0} step="0.01" value={form.netRate} onChange={(e) => patch({ netRate: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Selling Rate"><Input type="number" min={0} step="0.01" value={form.sellRate} onChange={(e) => patch({ sellRate: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Margin (calc)"><Input readOnly value={margin.toFixed(2)} className={cn("h-9 font-mono text-xs font-bold", margin > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")} /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Contact Number"><Input value={form.contactNumber} onChange={(e) => patch({ contactNumber: e.target.value })} className="h-9 text-xs" placeholder="+971…" /></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Show on Voucher"><Select value={form.showOnVoucher ? "YES" : "NO"} onValueChange={(v) => patch({ showOnVoucher: v === "YES" })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{YES_NO.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" placeholder="Driver notes, special instructions…" /></Field>
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
          <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Transport</>}</SaveBtn>
        </div>
      </div>
    </div>
  );
}
function TransportSection({ reservation, suppliers, onUpdated }: { reservation: ReservationT; suppliers: SupplierT[]; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/transports/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Transport removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove transport"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Transport" count={reservation.transports.length} addLabel="Add Transport" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <TransportForm initial={null} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.transports.length === 0 && !showNew && <EmptyState label="No transport yet" hint='Click "Add Transport" to create the first transport record.' />}
      {reservation.transports.map((t) => (
        <RecordCard key={t.id} summary={`${CAR_TYPES.find((c) => c.value === t.carType)?.label ?? t.carType} · ${TRANSPORT_TYPES.find((x) => x.value === t.transportType)?.label} · ${t.pickupLocation} → ${t.dropoffLocation}`} status={t.status}
          expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} onEdit={() => setExpandedId(expandedId === t.id ? null : t.id)} onRemove={() => doDelete(t.id)}>
          <TransportForm initial={t} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* HOTELS                                                                 */
/* ====================================================================== */

interface HotelFormState {
  hotelId: string; hotelName: string; roomType: string; mealPlan: string; checkInDate: string;
  checkOutDate: string; nights: number; noOfRooms: number; noOfAdults: number; noOfChildren: number;
  supplierId: string; confirmationNumber: string; status: string; comments: string;
  costPerNight: number; sellPerNight: number; showOnVoucher: boolean;
}
function emptyHotel(): HotelFormState {
  return { hotelId: "", hotelName: "", roomType: "Standard", mealPlan: "BB", checkInDate: toInputDate(new Date().toISOString()), checkOutDate: toInputDate(new Date(Date.now() + 86400000).toISOString()), nights: 1, noOfRooms: 1, noOfAdults: 2, noOfChildren: 0, supplierId: "", confirmationNumber: "", status: "INITIATED", comments: "", costPerNight: 0, sellPerNight: 0, showOnVoucher: true };
}
function hotelFromBooking(h: HotelBookingT): HotelFormState {
  return { hotelId: h.hotelId ?? "", hotelName: h.hotelName, roomType: h.roomType, mealPlan: h.mealPlan, checkInDate: toInputDate(h.checkInDate), checkOutDate: toInputDate(h.checkOutDate), nights: h.nights, noOfRooms: h.noOfRooms, noOfAdults: h.noOfAdults, noOfChildren: h.noOfChildren, supplierId: h.supplierId ?? "", confirmationNumber: h.confirmationNumber ?? "", status: h.status, comments: h.comments ?? "", costPerNight: h.costPerNight, sellPerNight: h.sellPerNight, showOnVoucher: h.showOnVoucher };
}
function HotelForm({ initial, reservation, suppliers, hotels, onSaved, onCancel }: {
  initial: HotelBookingT | null; reservation: ReservationT; suppliers: SupplierT[]; hotels: HotelCatalogItem[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<HotelFormState>(initial ? hotelFromBooking(initial) : emptyHotel());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? hotelFromBooking(initial) : emptyHotel()); }, [initial]);
  const pricing = useMemo(() => calcHotelPricing({ costPerNight: form.costPerNight, sellPerNight: form.sellPerNight, nights: form.nights, noOfRooms: form.noOfRooms }), [form]);
  function patch(p: Partial<HotelFormState>) { setForm((f) => ({ ...f, ...p })); }
  function pickHotel(id: string) { const h = hotels.find((x) => x.id === id); patch({ hotelId: id, hotelName: h?.name ?? form.hotelName, costPerNight: h ? h.pricePerNight : form.costPerNight, sellPerNight: h ? h.pricePerNight : form.sellPerNight }); }
  async function save() {
    if (!form.hotelName.trim()) { toast.error("Hotel name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, hotelId: form.hotelId || null, supplierId: form.supplierId || null, checkInDate: form.checkInDate || new Date().toISOString(), checkOutDate: form.checkOutDate || new Date(Date.now() + 86400000).toISOString() };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/hotels/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/hotels`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Hotel updated" : "Hotel added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save hotel"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Hotel Details" : "Add Hotel"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Hotel"><Select value={form.hotelId || "__none__"} onValueChange={pickHotel}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select hotel" /></SelectTrigger><SelectContent><SelectItem value="__none__">— Custom hotel —</SelectItem>{hotels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Room Type"><Input value={form.roomType} onChange={(e) => patch({ roomType: e.target.value })} className="h-9 text-xs" placeholder="e.g. Deluxe King" /></Field>
          <Field label="Meal Plan"><Select value={form.mealPlan} onValueChange={(v) => patch({ mealPlan: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{MEAL_PLANS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Check-in"><Input type="date" value={form.checkInDate} onChange={(e) => patch({ checkInDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Check-out"><Input type="date" value={form.checkOutDate} onChange={(e) => patch({ checkOutDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Nights"><Input type="number" min={1} value={form.nights} onChange={(e) => patch({ nights: Math.max(1, num(e.target.value, 1)) })} className="h-9 text-xs" /></Field>
          <Field label="Rooms"><Input type="number" min={1} value={form.noOfRooms} onChange={(e) => patch({ noOfRooms: Math.max(1, num(e.target.value, 1)) })} className="h-9 text-xs" /></Field>
          <Field label="Adults"><Input type="number" min={1} value={form.noOfAdults} onChange={(e) => patch({ noOfAdults: Math.max(1, num(e.target.value, 1)) })} className="h-9 text-xs" /></Field>
          <Field label="Children"><Input type="number" min={0} value={form.noOfChildren} onChange={(e) => patch({ noOfChildren: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Hotel Name" hint="Required"><Input value={form.hotelName} onChange={(e) => patch({ hotelName: e.target.value })} className="h-9 text-sm" placeholder="e.g. Burj Al Arab" /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cost / Night"><Input type="number" min={0} step="0.01" value={form.costPerNight} onChange={(e) => patch({ costPerNight: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total Cost"><Input readOnly value={pricing.totalCost.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs font-bold" /></Field>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sell / Night"><Input type="number" min={0} step="0.01" value={form.sellPerNight} onChange={(e) => patch({ sellPerNight: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total Sell"><Input readOnly value={pricing.totalSell.toFixed(2)} className="h-8 bg-emerald-50 font-mono text-xs font-bold text-emerald-700" /></Field>
            </div>
          </div>
        </div>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" placeholder="Late check-in, high floor, etc." /></Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.showOnVoucher} onCheckedChange={(v) => patch({ showOnVoucher: v })} />Show on voucher</label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
            <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Hotel</>}</SaveBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
function HotelsSection({ reservation, suppliers, hotels, onUpdated }: { reservation: ReservationT; suppliers: SupplierT[]; hotels: HotelCatalogItem[]; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/hotels/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Hotel removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove hotel"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Hotels" count={reservation.hotels.length} addLabel="Add Hotel" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <HotelForm initial={null} reservation={reservation} suppliers={suppliers} hotels={hotels} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.hotels.length === 0 && !showNew && <EmptyState label="No hotels yet" hint='Click "Add Hotel" to create the first hotel record.' />}
      {reservation.hotels.map((h) => (
        <RecordCard key={h.id} summary={`${h.hotelName} · ${h.roomType} · ${fmtDate(h.checkInDate)} → ${fmtDate(h.checkOutDate)} · ${h.nights}N`} status={h.status}
          expanded={expandedId === h.id} onToggle={() => setExpandedId(expandedId === h.id ? null : h.id)} onEdit={() => setExpandedId(expandedId === h.id ? null : h.id)} onRemove={() => doDelete(h.id)}>
          <HotelForm initial={h} reservation={reservation} suppliers={suppliers} hotels={hotels} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* FLIGHTS                                                                */
/* ====================================================================== */

interface FlightFormState {
  airline: string; flightNumber: string; flightType: string; cabinClass: string;
  origin: string; destination: string; departDate: string; returnDate: string;
  noOfAdults: number; noOfChildren: number; noOfInfants: number;
  supplierId: string; pnr: string; confirmationNumber: string; status: string; comments: string;
  adultCostRate: number; childCostRate: number; infantCostRate: number;
  adultSellRate: number; childSellRate: number; infantSellRate: number; showOnVoucher: boolean;
}
function emptyFlight(): FlightFormState {
  return { airline: "", flightNumber: "", flightType: "ONE_WAY", cabinClass: "ECONOMY", origin: "", destination: "", departDate: toInputDateTime(new Date().toISOString()), returnDate: "", noOfAdults: 1, noOfChildren: 0, noOfInfants: 0, supplierId: "", pnr: "", confirmationNumber: "", status: "INITIATED", comments: "", adultCostRate: 0, childCostRate: 0, infantCostRate: 0, adultSellRate: 0, childSellRate: 0, infantSellRate: 0, showOnVoucher: true };
}
function flightFromBooking(f: FlightBookingT): FlightFormState {
  return { airline: f.airline, flightNumber: f.flightNumber ?? "", flightType: f.flightType, cabinClass: f.cabinClass, origin: f.origin, destination: f.destination, departDate: toInputDateTime(f.departDate), returnDate: f.returnDate ? toInputDateTime(f.returnDate) : "", noOfAdults: f.noOfAdults, noOfChildren: f.noOfChildren, noOfInfants: f.noOfInfants, supplierId: f.supplierId ?? "", pnr: f.pnr ?? "", confirmationNumber: f.confirmationNumber ?? "", status: f.status, comments: f.comments ?? "", adultCostRate: f.adultCostRate, childCostRate: f.childCostRate, infantCostRate: f.infantCostRate, adultSellRate: f.adultSellRate, childSellRate: f.childSellRate, infantSellRate: f.infantSellRate, showOnVoucher: f.showOnVoucher };
}
function FlightForm({ initial, reservation, suppliers, onSaved, onCancel }: {
  initial: FlightBookingT | null; reservation: ReservationT; suppliers: SupplierT[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FlightFormState>(initial ? flightFromBooking(initial) : emptyFlight());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? flightFromBooking(initial) : emptyFlight()); }, [initial]);
  const pricing = useMemo(() => calcFlightPricing({ adultCostRate: form.adultCostRate, childCostRate: form.childCostRate, infantCostRate: form.infantCostRate, adultSellRate: form.adultSellRate, childSellRate: form.childSellRate, infantSellRate: form.infantSellRate, noOfAdults: form.noOfAdults, noOfChildren: form.noOfChildren, noOfInfants: form.noOfInfants }), [form]);
  function patch(p: Partial<FlightFormState>) { setForm((f) => ({ ...f, ...p })); }
  async function save() {
    if (!form.airline.trim() && !form.flightNumber.trim()) { toast.error("Airline or flight number is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, supplierId: form.supplierId || null, departDate: form.departDate || new Date().toISOString(), returnDate: form.returnDate || null };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/flights/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/flights`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Flight updated" : "Flight added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save flight"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Flight Details" : "Add Flight"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Airline"><Input value={form.airline} onChange={(e) => patch({ airline: e.target.value })} className="h-9 text-xs" placeholder="e.g. Emirates" /></Field>
          <Field label="Flight Number"><Input value={form.flightNumber} onChange={(e) => patch({ flightNumber: e.target.value })} className="h-9 font-mono text-xs" placeholder="EK 123" /></Field>
          <Field label="Flight Type"><Select value={form.flightType} onValueChange={(v) => patch({ flightType: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{FLIGHT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Cabin Class"><Select value={form.cabinClass} onValueChange={(v) => patch({ cabinClass: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{CABIN_CLASSES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Origin"><Input value={form.origin} onChange={(e) => patch({ origin: e.target.value })} className="h-9 text-xs" placeholder="DXB" /></Field>
          <Field label="Destination"><Input value={form.destination} onChange={(e) => patch({ destination: e.target.value })} className="h-9 text-xs" placeholder="LHR" /></Field>
          <Field label="Depart Date"><Input type="datetime-local" value={form.departDate} onChange={(e) => patch({ departDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Return Date"><Input type="datetime-local" value={form.returnDate} onChange={(e) => patch({ returnDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Adults"><Input type="number" min={0} value={form.noOfAdults} onChange={(e) => patch({ noOfAdults: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Children"><Input type="number" min={0} value={form.noOfChildren} onChange={(e) => patch({ noOfChildren: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Infants"><Input type="number" min={0} value={form.noOfInfants} onChange={(e) => patch({ noOfInfants: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="PNR"><Input value={form.pnr} onChange={(e) => patch({ pnr: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" /></Field>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Adult"><Input type="number" min={0} step="0.01" value={form.adultCostRate} onChange={(e) => patch({ adultCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child"><Input type="number" min={0} step="0.01" value={form.childCostRate} onChange={(e) => patch({ childCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Infant"><Input type="number" min={0} step="0.01" value={form.infantCostRate} onChange={(e) => patch({ infantCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total"><Input readOnly value={pricing.totalCost.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs font-bold" /></Field>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Field label="Adult"><Input type="number" min={0} step="0.01" value={form.adultSellRate} onChange={(e) => patch({ adultSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child"><Input type="number" min={0} step="0.01" value={form.childSellRate} onChange={(e) => patch({ childSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Infant"><Input type="number" min={0} step="0.01" value={form.infantSellRate} onChange={(e) => patch({ infantSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total"><Input readOnly value={pricing.totalSell.toFixed(2)} className="h-8 bg-emerald-50 font-mono text-xs font-bold text-emerald-700" /></Field>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.showOnVoucher} onCheckedChange={(v) => patch({ showOnVoucher: v })} />Show on voucher</label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
            <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Flight</>}</SaveBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
function FlightsSection({ reservation, suppliers, onUpdated }: { reservation: ReservationT; suppliers: SupplierT[]; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/flights/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Flight removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove flight"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Flights" count={reservation.flights.length} addLabel="Add Flight" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <FlightForm initial={null} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.flights.length === 0 && !showNew && <EmptyState label="No flights yet" hint='Click "Add Flight" to create the first flight record.' />}
      {reservation.flights.map((f) => (
        <RecordCard key={f.id} summary={`${f.airline} ${f.flightNumber || ""} · ${f.origin} → ${f.destination} · ${fmtDate(f.departDate)}`} status={f.status}
          expanded={expandedId === f.id} onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)} onEdit={() => setExpandedId(expandedId === f.id ? null : f.id)} onRemove={() => doDelete(f.id)}>
          <FlightForm initial={f} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* VISAS                                                                  */
/* ====================================================================== */

interface VisaFormState {
  visaType: string; destinationCountry: string; visaDuration: string; processingType: string;
  applicationDate: string; travelDate: string; noOfAdults: number; noOfChildren: number;
  supplierId: string; applicationNumber: string; confirmationNumber: string; status: string; comments: string;
  adultCostRate: number; childCostRate: number; adultSellRate: number; childSellRate: number; showOnVoucher: boolean;
}
function emptyVisa(): VisaFormState {
  return { visaType: "TOURIST", destinationCountry: "", visaDuration: "", processingType: "NORMAL", applicationDate: toInputDate(new Date().toISOString()), travelDate: "", noOfAdults: 1, noOfChildren: 0, supplierId: "", applicationNumber: "", confirmationNumber: "", status: "INITIATED", comments: "", adultCostRate: 0, childCostRate: 0, adultSellRate: 0, childSellRate: 0, showOnVoucher: true };
}
function visaFromBooking(v: VisaBookingT): VisaFormState {
  return { visaType: v.visaType, destinationCountry: v.destinationCountry, visaDuration: v.visaDuration ?? "", processingType: v.processingType, applicationDate: toInputDate(v.applicationDate), travelDate: v.travelDate ? toInputDate(v.travelDate) : "", noOfAdults: v.noOfAdults, noOfChildren: v.noOfChildren, supplierId: v.supplierId ?? "", applicationNumber: v.applicationNumber ?? "", confirmationNumber: v.confirmationNumber ?? "", status: v.status, comments: v.comments ?? "", adultCostRate: v.adultCostRate, childCostRate: v.childCostRate, adultSellRate: v.adultSellRate, childSellRate: v.childSellRate, showOnVoucher: v.showOnVoucher };
}
function VisaForm({ initial, reservation, suppliers, onSaved, onCancel }: {
  initial: VisaBookingT | null; reservation: ReservationT; suppliers: SupplierT[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<VisaFormState>(initial ? visaFromBooking(initial) : emptyVisa());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? visaFromBooking(initial) : emptyVisa()); }, [initial]);
  const pricing = useMemo(() => calcVisaPricing({ adultCostRate: form.adultCostRate, childCostRate: form.childCostRate, adultSellRate: form.adultSellRate, childSellRate: form.childSellRate, noOfAdults: form.noOfAdults, noOfChildren: form.noOfChildren }), [form]);
  function patch(p: Partial<VisaFormState>) { setForm((f) => ({ ...f, ...p })); }
  async function save() {
    if (!form.destinationCountry.trim()) { toast.error("Destination country is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, supplierId: form.supplierId || null, applicationDate: form.applicationDate || new Date().toISOString(), travelDate: form.travelDate || null };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/visas/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/visas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Visa updated" : "Visa added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save visa"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Visa Details" : "Add Visa"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Visa Type"><Select value={form.visaType} onValueChange={(v) => patch({ visaType: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{VISA_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Destination Country"><Select value={form.destinationCountry || "__none__"} onValueChange={(v) => patch({ destinationCountry: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Visa Duration"><Input value={form.visaDuration} onChange={(e) => patch({ visaDuration: e.target.value })} className="h-9 text-xs" placeholder="e.g. 30 days" /></Field>
          <Field label="Processing Type"><Select value={form.processingType} onValueChange={(v) => patch({ processingType: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PROCESSING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Application Date"><Input type="date" value={form.applicationDate} onChange={(e) => patch({ applicationDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Travel Date"><Input type="date" value={form.travelDate} onChange={(e) => patch({ travelDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Adults"><Input type="number" min={0} value={form.noOfAdults} onChange={(e) => patch({ noOfAdults: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Children"><Input type="number" min={0} value={form.noOfChildren} onChange={(e) => patch({ noOfChildren: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Application Number"><Input value={form.applicationNumber} onChange={(e) => patch({ applicationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Adult"><Input type="number" min={0} step="0.01" value={form.adultCostRate} onChange={(e) => patch({ adultCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child"><Input type="number" min={0} step="0.01" value={form.childCostRate} onChange={(e) => patch({ childCostRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total"><Input readOnly value={pricing.totalCost.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs font-bold" /></Field>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Adult"><Input type="number" min={0} step="0.01" value={form.adultSellRate} onChange={(e) => patch({ adultSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Child"><Input type="number" min={0} step="0.01" value={form.childSellRate} onChange={(e) => patch({ childSellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total"><Input readOnly value={pricing.totalSell.toFixed(2)} className="h-8 bg-emerald-50 font-mono text-xs font-bold text-emerald-700" /></Field>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.showOnVoucher} onCheckedChange={(v) => patch({ showOnVoucher: v })} />Show on voucher</label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
            <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Visa</>}</SaveBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
function VisasSection({ reservation, suppliers, onUpdated }: { reservation: ReservationT; suppliers: SupplierT[]; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/visas/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Visa removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove visa"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Visas" count={reservation.visas.length} addLabel="Add Visa" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <VisaForm initial={null} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.visas.length === 0 && !showNew && <EmptyState label="No visas yet" hint='Click "Add Visa" to create the first visa record.' />}
      {reservation.visas.map((v) => (
        <RecordCard key={v.id} summary={`${v.visaType} — ${v.destinationCountry} · ${fmtDate(v.travelDate)}`} status={v.status}
          expanded={expandedId === v.id} onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)} onEdit={() => setExpandedId(expandedId === v.id ? null : v.id)} onRemove={() => doDelete(v.id)}>
          <VisaForm initial={v} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* EXTRAS                                                                 */
/* ====================================================================== */

interface ExtraFormState {
  extraName: string; extraOption: string; serviceDate: string; quantity: number;
  supplierId: string; confirmationNumber: string; status: string; comments: string;
  costRate: number; sellRate: number; showOnVoucher: boolean;
}
function emptyExtra(): ExtraFormState {
  return { extraName: "", extraOption: "", serviceDate: "", quantity: 1, supplierId: "", confirmationNumber: "", status: "INITIATED", comments: "", costRate: 0, sellRate: 0, showOnVoucher: true };
}
function extraFromBooking(e: ExtraBookingT): ExtraFormState {
  return { extraName: e.extraName, extraOption: e.extraOption ?? "", serviceDate: e.serviceDate ? toInputDate(e.serviceDate) : "", quantity: e.quantity, supplierId: e.supplierId ?? "", confirmationNumber: e.confirmationNumber ?? "", status: e.status, comments: e.comments ?? "", costRate: e.costRate, sellRate: e.sellRate, showOnVoucher: e.showOnVoucher };
}
function ExtraForm({ initial, reservation, suppliers, onSaved, onCancel }: {
  initial: ExtraBookingT | null; reservation: ReservationT; suppliers: SupplierT[];
  onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ExtraFormState>(initial ? extraFromBooking(initial) : emptyExtra());
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? extraFromBooking(initial) : emptyExtra()); }, [initial]);
  const pricing = useMemo(() => calcExtraPricing({ costRate: form.costRate, sellRate: form.sellRate, quantity: form.quantity }), [form]);
  function patch(p: Partial<ExtraFormState>) { setForm((f) => ({ ...f, ...p })); }
  async function save() {
    if (!form.extraName.trim()) { toast.error("Extra name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, supplierId: form.supplierId || null, serviceDate: form.serviceDate || null };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/extras/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/extras`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Extra updated" : "Extra added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save extra"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Extra Details" : "Add Extra"} updatedAt={initial?.updatedAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Extra Name" hint="Required"><Input value={form.extraName} onChange={(e) => patch({ extraName: e.target.value })} className="h-9 text-xs" placeholder="e.g. Travel Insurance" /></Field>
          <Field label="Extra Option"><Input value={form.extraOption} onChange={(e) => patch({ extraOption: e.target.value })} className="h-9 text-xs" placeholder="Variant / package" /></Field>
          <Field label="Service Date"><Input type="date" value={form.serviceDate} onChange={(e) => patch({ serviceDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Quantity"><Input type="number" min={1} value={form.quantity} onChange={(e) => patch({ quantity: Math.max(1, num(e.target.value, 1)) })} className="h-9 text-xs" /></Field>
          <Field label="Supplier"><Select value={form.supplierId || "__none__"} onValueChange={(v) => patch({ supplierId: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Confirmation Number"><Input value={form.confirmationNumber} onChange={(e) => patch({ confirmationNumber: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{SERVICE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
        </div>
        <Field label="Comments"><Textarea rows={2} value={form.comments} onChange={(e) => patch({ comments: e.target.value })} className="text-sm" /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cost Rate"><Input type="number" min={0} step="0.01" value={form.costRate} onChange={(e) => patch({ costRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total Cost"><Input readOnly value={pricing.totalCost.toFixed(2)} className="h-8 bg-muted/40 font-mono text-xs font-bold" /></Field>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Sell Rate"><Input type="number" min={0} step="0.01" value={form.sellRate} onChange={(e) => patch({ sellRate: num(e.target.value, 0) })} className="h-8 text-xs" /></Field>
              <Field label="Total Sell"><Input readOnly value={pricing.totalSell.toFixed(2)} className="h-8 bg-emerald-50 font-mono text-xs font-bold text-emerald-700" /></Field>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.showOnVoucher} onCheckedChange={(v) => patch({ showOnVoucher: v })} />Show on voucher</label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
            <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Extra</>}</SaveBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
function ExtrasSection({ reservation, suppliers, onUpdated }: { reservation: ReservationT; suppliers: SupplierT[]; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/extras/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Extra removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove extra"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Extras" count={reservation.extras.length} addLabel="Add Extra" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <ExtraForm initial={null} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.extras.length === 0 && !showNew && <EmptyState label="No extras yet" hint='Click "Add Extra" to create the first extra record.' />}
      {reservation.extras.map((e) => (
        <RecordCard key={e.id} summary={`${e.extraName} · Qty: ${e.quantity}`} status={e.status}
          expanded={expandedId === e.id} onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)} onEdit={() => setExpandedId(expandedId === e.id ? null : e.id)} onRemove={() => doDelete(e.id)}>
          <ExtraForm initial={e} reservation={reservation} suppliers={suppliers} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* PAYMENTS                                                               */
/* ====================================================================== */

interface PaymentFormState {
  amount: number; currency: string; paymentMethod: string; paymentDate: string;
  reference: string; status: string; notes: string; receivedBy: string;
}
function emptyPayment(cur: string): PaymentFormState {
  return { amount: 0, currency: cur, paymentMethod: "CASH", paymentDate: toInputDate(new Date().toISOString()), reference: "", status: "RECEIVED", notes: "", receivedBy: "" };
}
function paymentFromBooking(p: PaymentT): PaymentFormState {
  return { amount: p.amount, currency: p.currency, paymentMethod: p.paymentMethod, paymentDate: toInputDate(p.paymentDate), reference: p.reference ?? "", status: p.status, notes: p.notes ?? "", receivedBy: p.receivedBy ?? "" };
}
function PaymentForm({ initial, reservation, onSaved, onCancel }: {
  initial: PaymentT | null; reservation: ReservationT; onSaved: (fresh: ReservationT) => void; onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<PaymentFormState>(initial ? paymentFromBooking(initial) : emptyPayment(reservation.currency));
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(initial ? paymentFromBooking(initial) : emptyPayment(reservation.currency)); }, [initial]);
  function patch(p: Partial<PaymentFormState>) { setForm((f) => ({ ...f, ...p })); }
  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, paymentDate: form.paymentDate || new Date().toISOString(), reference: form.reference || null, notes: form.notes || null, receivedBy: form.receivedBy || null };
      let res: Response;
      if (isEdit && initial) { res = await fetch(`/api/agency/reservations/${reservation.id}/payments/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      else { res = await fetch(`/api/agency/reservations/${reservation.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const fresh = await refetchReservation(reservation.id);
      toast.success(isEdit ? "Payment updated" : "Payment added");
      onSaved(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save payment"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title={isEdit ? "Payment Details" : "Add Payment"} updatedAt={initial?.createdAt} onClose={onCancel} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Amount"><Input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => patch({ amount: num(e.target.value, 0) })} className="h-9 text-xs" /></Field>
          <Field label="Currency"><Input value={form.currency} onChange={(e) => patch({ currency: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Payment Method"><Select value={form.paymentMethod} onValueChange={(v) => patch({ paymentMethod: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Payment Date"><Input type="date" value={form.paymentDate} onChange={(e) => patch({ paymentDate: e.target.value })} className="h-9 text-xs" /></Field>
          <Field label="Reference"><Input value={form.reference} onChange={(e) => patch({ reference: e.target.value })} className="h-9 font-mono text-xs" /></Field>
          <Field label="Status"><Select value={form.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Received By"><Input value={form.receivedBy} onChange={(e) => patch({ receivedBy: e.target.value })} className="h-9 text-xs" /></Field>
        </div>
        <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} className="text-sm" /></Field>
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>Cancel</Button>
          <SaveBtn onClick={save} loading={saving} variant={isEdit ? "save" : "add"}>{isEdit ? <><Save className="mr-1 size-3.5" />Save Record</> : <><Plus className="mr-1 size-3.5" />Add Payment</>}</SaveBtn>
        </div>
      </div>
    </div>
  );
}
function PaymentsSection({ reservation, onUpdated }: { reservation: ReservationT; onUpdated: (r: ReservationT) => void; }) {
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  async function doDelete(id: string) { try { const res = await fetch(`/api/agency/reservations/${reservation.id}/payments/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); const fresh = await refetchReservation(reservation.id); toast.success("Payment removed"); onUpdated(fresh ?? reservation); } catch { toast.error("Failed to remove payment"); } }
  return (
    <div className="space-y-3">
      <SectionHeader title="Payments" count={reservation.payments.length} addLabel="Add Payment" onAdd={() => setShowNew(true)} disabled={showNew} />
      {showNew && <PaymentForm initial={null} reservation={reservation} onSaved={(fresh) => { setShowNew(false); onUpdated(fresh); }} onCancel={() => setShowNew(false)} />}
      {reservation.payments.length === 0 && !showNew && <EmptyState label="No payments yet" hint='Click "Add Payment" to record a payment.' />}
      {reservation.payments.map((p) => (
        <RecordCard key={p.id} summary={`${money(p.currency, p.amount)} · ${PAYMENT_METHODS.find((m) => m.value === p.paymentMethod)?.label ?? p.paymentMethod} · ${fmtDate(p.paymentDate)}`} status={p.status}
          expanded={expandedId === p.id} onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} onEdit={() => setExpandedId(expandedId === p.id ? null : p.id)} onRemove={() => doDelete(p.id)}>
          <PaymentForm initial={p} reservation={reservation} onSaved={(fresh) => { setExpandedId(null); onUpdated(fresh); }} onCancel={() => setExpandedId(null)} />
        </RecordCard>
      ))}
    </div>
  );
}

/* ====================================================================== */
/* GUESTS                                                                 */
/* ====================================================================== */

interface GuestRow { tempId: string; id?: string; title: string; fullName: string; email: string; phone: string; passportNumber: string; paxType: string; nationality: string; }
function GuestsSection({ reservation, onUpdated }: { reservation: ReservationT; onUpdated: (r: ReservationT) => void; }) {
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setRows(reservation.guests.map((g) => ({ tempId: g.id, id: g.id, title: g.title, fullName: g.fullName, email: g.email ?? "", phone: g.phone ?? "", passportNumber: g.passportNumber ?? "", paxType: g.paxType, nationality: g.nationality ?? "" })));
  }, [reservation.guests]);
  function addRow() { setRows((rs) => [...rs, { tempId: `new-${Date.now()}`, title: "Mr", fullName: "", email: "", phone: "", passportNumber: "", paxType: "ADULT", nationality: "" }]); }
  function updateRow(tempId: string, patch: Partial<GuestRow>) { setRows((rs) => rs.map((r) => r.tempId === tempId ? { ...r, ...patch } : r)); }
  function removeRow(tempId: string) { setRows((rs) => rs.filter((r) => r.tempId !== tempId)); }
  async function saveAll() {
    const valid = rows.filter((r) => r.fullName.trim());
    if (valid.length === 0) { toast.error("Add at least one guest with a name"); return; }
    setSaving(true);
    try {
      const existing = reservation.guests;
      const keptIds = new Set(valid.filter((r) => r.id).map((r) => r.id!));
      await Promise.all(existing.filter((g) => !keptIds.has(g.id)).map((g) => fetch(`/api/agency/reservations/${reservation.id}/guests/${g.id}`, { method: "DELETE" })));
      for (const r of valid) {
        const payload = { title: r.title, fullName: r.fullName, email: r.email || null, phone: r.phone || null, passportNumber: r.passportNumber || null, paxType: r.paxType, nationality: r.nationality || null };
        if (r.id) { await fetch(`/api/agency/reservations/${reservation.id}/guests/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
        else { await fetch(`/api/agency/reservations/${reservation.id}/guests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
      }
      const fresh = await refetchReservation(reservation.id);
      toast.success("Guests saved");
      onUpdated(fresh ?? reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to save guests"); }
    finally { setSaving(false); }
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <ServiceFormHeader title="Guest(s) details" updatedAt={reservation.updatedAt} />
      <div className="p-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="h-8 w-24 text-xs">Title</TableHead>
              <TableHead className="h-8 min-w-[140px] text-xs">Guest Name</TableHead>
              <TableHead className="h-8 min-w-[160px] text-xs">Email</TableHead>
              <TableHead className="h-8 min-w-[120px] text-xs">Phone</TableHead>
              <TableHead className="h-8 min-w-[120px] text-xs">Passport</TableHead>
              <TableHead className="h-8 w-28 text-xs">Pax Type</TableHead>
              <TableHead className="h-8 min-w-[140px] text-xs">Nationality</TableHead>
              <TableHead className="h-8 w-10 text-xs" />
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-16 text-center text-xs text-muted-foreground">No guests added yet.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.tempId} className="h-10">
                  <TableCell className="p-1"><Select value={r.title} onValueChange={(v) => updateRow(r.tempId, { title: v })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{GUEST_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="p-1"><Input value={r.fullName} onChange={(e) => updateRow(r.tempId, { fullName: e.target.value })} className="h-8 text-xs" placeholder="Full name" /></TableCell>
                  <TableCell className="p-1"><Input type="email" value={r.email} onChange={(e) => updateRow(r.tempId, { email: e.target.value })} className="h-8 text-xs" placeholder="email@example.com" /></TableCell>
                  <TableCell className="p-1"><Input value={r.phone} onChange={(e) => updateRow(r.tempId, { phone: e.target.value })} className="h-8 text-xs" placeholder="+971…" /></TableCell>
                  <TableCell className="p-1"><Input value={r.passportNumber} onChange={(e) => updateRow(r.tempId, { passportNumber: e.target.value })} className="h-8 font-mono text-xs" placeholder="P1234567" /></TableCell>
                  <TableCell className="p-1"><Select value={r.paxType} onValueChange={(v) => updateRow(r.tempId, { paxType: v })}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent>{PAX_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="p-1"><Select value={r.nationality || "__none__"} onValueChange={(v) => updateRow(r.tempId, { nationality: v === "__none__" ? "" : v })}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger><SelectContent><SelectItem value="__none__">—</SelectItem>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></TableCell>
                  <TableCell className="p-1 text-center"><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" onClick={() => removeRow(r.tempId)}><Trash2 className="size-3.5" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" className="h-8 border-primary text-xs text-primary hover:bg-primary/5" onClick={addRow}><UserPlus className="mr-1 size-3.5" />Add New</Button>
          <SaveBtn onClick={saveAll} loading={saving}><Save className="mr-1 size-3.5" />Save Record(s)</SaveBtn>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* HOME TAB — reservation edit form                                       */
/* ====================================================================== */

function HomeTab({ reservation, employees, onUpdated }: { reservation: ReservationT; employees: EmployeeT[]; onUpdated: (r: ReservationT) => void; }) {
  const [form, setForm] = useState({
    customerName: reservation.customerName, customerEmail: reservation.customerEmail, customerPhone: reservation.customerPhone ?? "",
    orderDate: toInputDate(reservation.orderDate), invoiceDate: toInputDate(reservation.invoiceDate),
    bookingStatus: reservation.bookingStatus, supplierPending: reservation.bookingStatus === "SUPPLIER_PENDING" ? "YES" : "NO",
    saleById: reservation.saleById ?? "", invoiceType: reservation.invoiceType, remarks: reservation.remarks ?? "", termsAccepted: reservation.termsAccepted,
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ customerName: reservation.customerName, customerEmail: reservation.customerEmail, customerPhone: reservation.customerPhone ?? "", orderDate: toInputDate(reservation.orderDate), invoiceDate: toInputDate(reservation.invoiceDate), bookingStatus: reservation.bookingStatus, supplierPending: reservation.bookingStatus === "SUPPLIER_PENDING" ? "YES" : "NO", saleById: reservation.saleById ?? "", invoiceType: reservation.invoiceType, remarks: reservation.remarks ?? "", termsAccepted: reservation.termsAccepted }); }, [reservation]);
  function patch(p: any) { setForm((f) => ({ ...f, ...p })); }
  function changeSupplierPending(v: string) { setForm((f) => { let next = f.bookingStatus; if (v === "YES" && f.bookingStatus === "PENDING") next = "SUPPLIER_PENDING"; else if (v === "NO" && f.bookingStatus === "SUPPLIER_PENDING") next = "PENDING"; return { ...f, supplierPending: v, bookingStatus: next }; }); }
  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerName: form.customerName, customerEmail: form.customerEmail, customerPhone: form.customerPhone, orderDate: form.orderDate, invoiceDate: form.invoiceDate, bookingStatus: form.bookingStatus, saleById: form.saleById || null, invoiceType: form.invoiceType, remarks: form.remarks, termsAccepted: form.termsAccepted }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onUpdated(data.reservation);
      toast.success("Reservation saved");
    } catch (e: any) { toast.error(e.message ?? "Failed to save reservation"); }
    finally { setSaving(false); }
  }
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <ServiceFormHeader title="Customer" updatedAt={reservation.updatedAt} />
        <div className="p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Customer" hint="Required"><Input value={form.customerName} onChange={(e) => patch({ customerName: e.target.value })} className="h-9 text-sm" /></Field>
            <Field label="Email" hint="Required"><Input type="email" value={form.customerEmail} onChange={(e) => patch({ customerEmail: e.target.value })} className="h-9 text-sm" /></Field>
            <Field label="Phone"><Input value={form.customerPhone} onChange={(e) => patch({ customerPhone: e.target.value })} className="h-9 text-sm" placeholder="+971…" /></Field>
            <Field label="Invoice #"><Input value={reservation.invoiceNumber} readOnly className="h-9 bg-muted/40 font-mono text-sm" /></Field>
            <Field label="Booking Reference"><Input value={reservation.reference} readOnly className="h-9 bg-muted/40 font-mono text-sm" /></Field>
            <Field label="Order Date"><Input type="date" value={form.orderDate} onChange={(e) => patch({ orderDate: e.target.value })} className="h-9 text-sm" /></Field>
            <Field label="Invoice Date"><Input type="date" value={form.invoiceDate} onChange={(e) => patch({ invoiceDate: e.target.value })} className="h-9 text-sm" /></Field>
            <Field label="Booking Status"><Select value={form.bookingStatus} onValueChange={(v) => patch({ bookingStatus: v })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{BOOKING_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Supplier Confirmation Pending"><Select value={form.supplierPending} onValueChange={changeSupplierPending}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{YES_NO.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Sale By"><Select value={form.saleById || "__none__"} onValueChange={(v) => patch({ saleById: v === "__none__" ? "" : v })}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select agent" /></SelectTrigger><SelectContent><SelectItem value="__none__">— No agent —</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Created By"><Input value={employees.find((e) => e.id === reservation.createdById)?.name ?? "—"} readOnly className="h-9 bg-muted/40 text-sm" /></Field>
            <Field label="Updated By"><Input value={employees.find((e) => e.id === reservation.updatedById)?.name ?? "—"} readOnly className="h-9 bg-muted/40 text-sm" /></Field>
            <Field label="Invoice Type"><Select value={form.invoiceType} onValueChange={(v) => patch({ invoiceType: v })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent>{INVOICE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <div className="mt-3">
            <Field label="Remarks"><Textarea rows={3} value={form.remarks} onChange={(e) => patch({ remarks: e.target.value })} className="text-sm" placeholder="Internal notes visible to agents only…" /></Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground"><Switch checked={form.termsAccepted} onCheckedChange={(v) => patch({ termsAccepted: v })} />Terms &amp; conditions accepted</label>
            <SaveBtn onClick={save} loading={saving}><Save className="mr-1 size-3.5" />Save Record</SaveBtn>
          </div>
        </div>
      </div>
      <GuestsSection reservation={reservation} onUpdated={onUpdated} />
    </div>
  );
}

/* ====================================================================== */
/* RESERVATION DETAIL                                                     */
/* ====================================================================== */

function ReservationDetail({ reservationId, onBack }: { reservationId: string; onBack: () => void; }) {
  const [reservation, setReservation] = useState<ReservationT | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ServiceTabId>("home");
  const [employees, setEmployees] = useState<EmployeeT[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierT[]>([]);
  const [experiences, setExperiences] = useState<TourCatalogItem[]>([]);
  const [hotels, setHotels] = useState<HotelCatalogItem[]>([]);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);

  const sidebarExpanded = sidebarHover || sidebarPinned;

  const loadReservation = useCallback(async () => {
    try {
      const res = await fetch(`/api/agency/reservations/${reservationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setReservation(data.reservation);
    } catch (e: any) { toast.error(e.message ?? "Failed to load reservation"); onBack(); }
    finally { setLoading(false); }
  }, [reservationId, onBack]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const res = await fetch(`/api/agency/reservations/${reservationId}`); const data = await res.json(); if (res.ok) setReservation(data.reservation); }
    catch { /* ignore */ }
    finally { setRefreshing(false); }
  }, [reservationId]);

  useEffect(() => { setLoading(true); loadReservation(); }, [loadReservation]);
  useEffect(() => {
    fetch("/api/agency/employees?active=1").then((r) => r.json()).then((d) => setEmployees(d.employees ?? [])).catch(() => {});
    fetch("/api/agency/suppliers?active=1").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? [])).catch(() => {});
    fetch("/api/experiences?limit=100").then((r) => r.json()).then((d) => setExperiences((d.experiences ?? []).map((e: any) => ({ id: e.id, title: e.title, price: e.price })))).catch(() => {});
    fetch("/api/hotels?limit=100").then((r) => r.json()).then((d) => setHotels((d.hotels ?? []).map((h: any) => ({ id: h.id, name: h.name, pricePerNight: h.pricePerNight })))).catch(() => {});
  }, []);

  function handleUpdated(r: ReservationT) { setReservation(r); }

  const tabCounts = useMemo<Partial<Record<ServiceTabId, number>>>(() => {
    if (!reservation) return {};
    return { hotels: reservation.hotels.length, tours: reservation.tours.length, transport: reservation.transports.length, flights: reservation.flights.length, visas: reservation.visas.length, extras: reservation.extras.length, payments: reservation.payments.length };
  }, [reservation]);

  async function sendEmail(type: "SUPPLIER_CONFIRMATION" | "CUSTOMER_CONFIRMATION") {
    if (!reservation) return;
    setEmailBusy(true);
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.sent) toast.success("Email sent");
      else if (data.logged) toast.success("Email composed & logged (no email provider configured)");
      else toast.message("Email attempt completed");
      if (data.preview) { try { const w = window.open("", "_blank"); if (w) { w.document.write(data.preview); w.document.close(); } } catch { /* popup blocked */ } }
    } catch (e: any) { toast.error(e.message ?? "Failed to send email"); }
    finally { setEmailBusy(false); }
  }

  async function openVoucher(opts?: { serviceType?: string; serviceId?: string }) {
    if (!reservation) return;
    setVoucherOpen(false); setDocBusy(true);
    try {
      const params = new URLSearchParams();
      if (opts?.serviceType) params.set("serviceType", opts.serviceType);
      if (opts?.serviceId) params.set("serviceId", opts.serviceId);
      const qs = params.toString();
      const res = await fetch(`/api/agency/reservations/${reservation.id}/voucher${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.html) { const w = window.open("", "_blank"); if (w) { w.document.write(data.html); w.document.close(); } else toast.error("Pop-up blocked — allow pop-ups to view the voucher"); }
    } catch (e: any) { toast.error(e.message ?? "Failed to generate voucher"); }
    finally { setDocBusy(false); }
  }

  async function openInvoice() {
    if (!reservation) return;
    setDocBusy(true);
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/invoice`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.html) { const w = window.open("", "_blank"); if (w) { w.document.write(data.html); w.document.close(); } else toast.error("Pop-up blocked — allow pop-ups to view the invoice"); }
    } catch (e: any) { toast.error(e.message ?? "Failed to generate invoice"); }
    finally { setDocBusy(false); }
  }

  if (loading || !reservation) {
    return (
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="h-8" onClick={onBack}><ArrowLeft className="mr-1 size-4" /> Back to Bookings</Button></div>
        <Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const voucherServiceOptions = [
    { label: "Tours", count: reservation.tours.length, serviceType: "tour" },
    { label: "Hotels", count: reservation.hotels.length, serviceType: "hotel" },
    { label: "Transport", count: reservation.transports.length, serviceType: "transport" },
    { label: "Flights", count: reservation.flights.length, serviceType: "flight" },
    { label: "Visas", count: reservation.visas.length, serviceType: "visa" },
    { label: "Extras", count: reservation.extras.length, serviceType: "extra" },
  ];

  return (
    <div className="flex gap-3 p-3">
      {/* ============ SIDEBAR (collapsible on hover) ============ */}
      <aside
        className={cn("sticky top-16 hidden h-fit shrink-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 lg:block", sidebarExpanded ? "w-[260px]" : "w-[56px]")}
        onMouseEnter={() => setSidebarHover(true)}
        onMouseLeave={() => setSidebarHover(false)}
      >
        {/* Back + reference */}
        <div className="p-3">
          <button type="button" onClick={onBack} className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-primary" title="Back to Bookings">
            <ArrowLeft className="size-4 shrink-0" />
            {sidebarExpanded && <span>Bookings</span>}
          </button>
          {sidebarExpanded && (
            <>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Booking Reference</p>
              <p className="font-mono text-base font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>{reservation.reference}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={reservation.bookingStatus} />
                {reservation.isFlagged && <Badge variant="outline" className="h-6 border-rose-200 bg-rose-50 px-2 text-[11px] text-rose-700"><ShieldAlert className="mr-1 size-3" />Flagged</Badge>}
              </div>
              <div className="mt-3 space-y-1 border-t border-border pt-2">
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Total</span><span className="font-mono font-semibold text-foreground">{money(reservation.currency, reservation.totalAmount)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Paid</span><span className="font-mono text-emerald-700">{money(reservation.currency, reservation.amountPaid)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Balance</span><span className={cn("font-mono font-semibold", reservation.balanceDue > 0 ? "text-rose-600" : "text-muted-foreground")}>{money(reservation.currency, reservation.balanceDue)}</span></div>
              </div>
            </>
          )}
          {!sidebarExpanded && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <StatusBadge status={reservation.bookingStatus} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-3">
          <p className={cn("mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", !sidebarExpanded && "hidden")}>Actions</p>
          <div className="space-y-1.5">
            <button type="button" disabled={emailBusy || docBusy} onClick={() => sendEmail("SUPPLIER_CONFIRMATION")} title="Send Supplier Confirmation"
              className={cn("flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-2 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50", !sidebarExpanded && "justify-center px-0")}>
              {emailBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5 shrink-0" />}
              {sidebarExpanded && <span>Supplier Confirmation</span>}
            </button>
            <button type="button" disabled={emailBusy || docBusy} onClick={() => sendEmail("CUSTOMER_CONFIRMATION")} title="Send Customer Confirmation"
              className={cn("flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-left text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50", !sidebarExpanded && "justify-center px-0")}>
              {emailBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5 shrink-0" />}
              {sidebarExpanded && <span>Customer Confirmation</span>}
            </button>
            <div className="my-1 border-t border-border" />
            {/* Voucher */}
            <div className="relative">
              <button type="button" disabled={emailBusy || docBusy} onClick={() => { setVoucherOpen((v) => !v); }} title="Voucher"
                className={cn("flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50", !sidebarExpanded && "justify-center px-0")}>
                {docBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Ticket className="size-3.5 shrink-0 text-gold" />}
                {sidebarExpanded && <span>Voucher</span>}
                {sidebarExpanded && <ChevronDown className={cn("ml-auto size-3.5 text-muted-foreground transition-transform", voucherOpen && "rotate-180")} />}
              </button>
              {voucherOpen && sidebarExpanded && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setVoucherOpen(false)} />
                  <div className="absolute left-0 right-0 z-40 mt-1 rounded-md border border-border bg-card py-1 shadow-lg">
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold hover:bg-muted" onClick={() => openVoucher()}><Ticket className="size-3.5 text-primary" />Combined Voucher (all)</button>
                    <div className="my-1 border-t border-border" />
                    {voucherServiceOptions.map((opt) => opt.count > 0 ? (
                      <button key={opt.serviceType} type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                        onClick={() => { let id: string | undefined; if (opt.serviceType === "tour") id = reservation.tours[0]?.id; else if (opt.serviceType === "hotel") id = reservation.hotels[0]?.id; else if (opt.serviceType === "transport") id = reservation.transports[0]?.id; else if (opt.serviceType === "flight") id = reservation.flights[0]?.id; else if (opt.serviceType === "visa") id = reservation.visas[0]?.id; else if (opt.serviceType === "extra") id = reservation.extras[0]?.id; if (id) openVoucher({ serviceType: opt.serviceType, serviceId: id }); }}>
                        <span className="flex items-center gap-2"><Ticket className="size-3.5 text-muted-foreground" />{opt.label}</span>
                        <Badge variant="outline" className="text-[10px]">{opt.count}</Badge>
                      </button>
                    ) : null)}
                  </div>
                </>
              )}
            </div>
            {/* Invoice */}
            <button type="button" disabled={emailBusy || docBusy} onClick={openInvoice} title="Invoice"
              className={cn("flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50", !sidebarExpanded && "justify-center px-0")}>
              {docBusy ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5 shrink-0 text-gold" />}
              {sidebarExpanded && <span>Invoice</span>}
            </button>
            {/* Refresh */}
            <button type="button" onClick={refresh} disabled={refreshing} title="Refresh"
              className={cn("flex w-full items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50", !sidebarExpanded && "justify-center px-0")}>
              {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5 shrink-0" />}
              {sidebarExpanded && <span>Refresh</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Mobile back button (sidebar is desktop-only) */}
        <Button variant="outline" size="sm" className="h-8 w-fit text-xs lg:hidden" onClick={onBack}><ArrowLeft className="mr-1.5 size-4" />Bookings</Button>

        {/* Mobile actions bar */}
        <div className="flex flex-wrap items-center gap-1.5 lg:hidden">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => sendEmail("SUPPLIER_CONFIRMATION")} disabled={emailBusy}><Mail className="mr-1 size-3.5" />Supplier</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => sendEmail("CUSTOMER_CONFIRMATION")} disabled={emailBusy}><Mail className="mr-1 size-3.5" />Customer</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openVoucher()} disabled={docBusy}><Ticket className="mr-1 size-3.5" />Voucher</Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={openInvoice} disabled={docBusy}><FileText className="mr-1 size-3.5" />Invoice</Button>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="px-1 text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>Reservation Booking</h2>
          <ServiceTabBar active={activeTab} counts={tabCounts} onActivate={setActiveTab} />
        </div>

        {activeTab === "home" && <HomeTab reservation={reservation} employees={employees} onUpdated={handleUpdated} />}
        {activeTab === "tours" && <ToursSection reservation={reservation} suppliers={suppliers} experiences={experiences} onUpdated={handleUpdated} />}
        {activeTab === "transport" && <TransportSection reservation={reservation} suppliers={suppliers} onUpdated={handleUpdated} />}
        {activeTab === "hotels" && <HotelsSection reservation={reservation} suppliers={suppliers} hotels={hotels} onUpdated={handleUpdated} />}
        {activeTab === "flights" && <FlightsSection reservation={reservation} suppliers={suppliers} onUpdated={handleUpdated} />}
        {activeTab === "visas" && <VisasSection reservation={reservation} suppliers={suppliers} onUpdated={handleUpdated} />}
        {activeTab === "extras" && <ExtrasSection reservation={reservation} suppliers={suppliers} onUpdated={handleUpdated} />}
        {activeTab === "payments" && <PaymentsSection reservation={reservation} onUpdated={handleUpdated} />}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* MAIN AgencyPage                                                        */
/* ====================================================================== */

export function AgencyPage() {
  const router = useRouter();
  const { adminAuthed, adminAuthChecked, checkAdminAuth, adminLogout } = useStore();
  const [openReservationId, setOpenReservationId] = useState<string | null>(null);
  const [viewDialog, setViewDialog] = useState<ReservationListItemT | null>(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("agency-dark") === "1"; } catch { return false; }
  });

  useEffect(() => { if (!adminAuthChecked) checkAdminAuth(); }, [adminAuthChecked, checkAdminAuth]);
  useEffect(() => { try { localStorage.setItem("agency-dark", dark ? "1" : "0"); } catch {} }, [dark]);

  function goHome() { router.push("/"); }
  async function handleSignOut() { await adminLogout(); router.push("/"); }

  if (!adminAuthChecked) {
    return (
      <div className={cn("grid min-h-screen place-items-center bg-background", dark && "dark")}>
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!adminAuthed) return <AdminLogin onExit={goHome} />;

  return (
    <div className={cn("flex min-h-screen flex-col bg-background", dark && "dark")}>
      <TopBar onSignOut={handleSignOut} onBackToSite={goHome} dark={dark} onToggleDark={() => setDark((v) => !v)} />
      {!openReservationId && (
        <ServiceTabBar active="home" counts={{}} onActivate={() => { /* Home only when no reservation is open */ }} />
      )}
      <main className="flex-1">
        {!openReservationId ? (
          <BookingList onOpen={(id) => setOpenReservationId(id)} onView={(r) => setViewDialog(r)} />
        ) : (
          <ReservationDetail reservationId={openReservationId} onBack={() => setOpenReservationId(null)} />
        )}
      </main>
      <BookingVerificationDialog reservation={viewDialog} onClose={() => setViewDialog(null)} onViewFull={(r) => { setViewDialog(null); setOpenReservationId(r.id); }} />
    </div>
  );
}
