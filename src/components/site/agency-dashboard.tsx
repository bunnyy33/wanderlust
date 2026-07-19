"use client";

/**
 * Wanderlust — Agency Booking System Dashboard (Rayna Tours / JTR Holidays style)
 *
 * B2B travel agency management UI. The screen has exactly two views:
 *
 *   View 1 — Booking List: a dense table of reservations with search +
 *             status filter + "New Booking" CTA. Each row has an eye (View)
 *             and an "Open" CTA that both open the reservation detail.
 *
 *   View 2 — Reservation Detail: ONE scrollable page (not a wizard, not
 *             multi-step tabs that switch pages) with three inline sections:
 *               A. Reservation Details (grid of fields + Save Record)
 *               B. Guests Table (inline editable rows + Save Record(s))
 *               C. Service Tabs (horizontal tab bar with inline forms)
 *
 * Tours / Transport / Hotels / Payments tabs all render their form inline
 * (no dialogs, no page switches). Visas / Flights / Extras show a styled
 * "Coming soon" placeholder.
 *
 * All API calls go through /api/agency/* (isAdminAuthed-guarded) and
 * /api/experiences (public catalog) + /api/agency/employees + /api/agency/suppliers.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Eye,
  Home as HomeIcon,
  Hotel as HotelIcon,
  Info,
  Loader2,
  MapPin,
  Minus,
  Pencil,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sticker,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import type {
  EmployeeT,
  GuestT,
  HotelBookingT,
  PaymentT,
  ReservationListItemT,
  ReservationT,
  SupplierT,
  TourBookingT,
  TransportBookingT,
} from "@/lib/agency-types";
import { calcHotelPricing, calcTourPricing } from "@/lib/agency-types";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

/* ================================================================== */
/* Constants                                                          */
/* ================================================================== */

const BOOKING_STATUSES: { value: string; label: string; badgeClass: string }[] = [
  { value: "PENDING", label: "In Process", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "SUPPLIER_PENDING", label: "Supplier Confirmation Pending", badgeClass: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "SUPPLIER_CONFIRMED", label: "Supplier Confirmed", badgeClass: "bg-sky-100 text-sky-800 border-sky-200" },
  { value: "CUSTOMER_CONFIRMED", label: "Customer Confirmed", badgeClass: "bg-teal-100 text-teal-800 border-teal-200" },
  { value: "COMPLETED", label: "Completed", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "CANCELLED", label: "Cancelled", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
];

const SERVICE_STATUSES = [
  { value: "INITIATED", label: "Initiated" },
  { value: "SUPPLIER_CONFIRMED", label: "Supplier Confirmed" },
  { value: "CUSTOMER_CONFIRMED", label: "Customer Confirmed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const CAR_TYPES = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "MINIVAN", label: "Minivan" },
  { value: "VAN", label: "Van" },
  { value: "LUXURY", label: "Luxury" },
  { value: "COACH", label: "Coach" },
];

const TRANSPORT_TYPES = [
  { value: "ARRIVAL", label: "Arrival" },
  { value: "DEPARTURE", label: "Departure" },
  { value: "INTERCITY", label: "Intercity" },
  { value: "HOURLY", label: "Hourly" },
];

const TRANSFER_OPTIONS = [
  { value: "WITHOUT_TRANSFER", label: "Without Transfer" },
  { value: "SHARED", label: "Shared Transfer" },
  { value: "PRIVATE", label: "Private Transfer" },
];

const MEAL_PLANS = [
  { value: "BB", label: "Bed & Breakfast (BB)" },
  { value: "HB", label: "Half Board (HB)" },
  { value: "FB", label: "Full Board (FB)" },
  { value: "AI", label: "All Inclusive (AI)" },
];

const COST_UNITS = [
  { value: "PER_PERSON", label: "Per Person" },
  { value: "PER_BOOKING", label: "Per Booking" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "ONLINE", label: "Online" },
];

const PAYMENT_STATUSES = [
  { value: "RECEIVED", label: "Received" },
  { value: "PENDING", label: "Pending" },
  { value: "REFUNDED", label: "Refunded" },
];

const INVOICE_TYPES = [
  { value: "TAXABLE", label: "Taxable Invoice 5%" },
  { value: "ZERO_RATED", label: "Zero Rated" },
  { value: "EXEMPT", label: "Exempt" },
];

const GUEST_TITLES = ["Mr", "Mrs", "Miss", "Master", "Dr"];
const PAX_TYPES = [
  { value: "ADULT", label: "Adult" },
  { value: "CHILD", label: "Child" },
  { value: "INFANT", label: "Infant" },
];

const SUPPLIER_TYPES = [
  { value: "TOUR", label: "Tour" },
  { value: "HOTEL", label: "Hotel" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "VISA", label: "Visa" },
  { value: "FLIGHT", label: "Flight" },
];

const YES_NO = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
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

const SERVICE_TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "hotels", label: "Hotels", icon: HotelIcon },
  { id: "tours", label: "Tours", icon: MapPin },
  { id: "visas", label: "Visas", icon: Sticker },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "transport", label: "Transport", icon: CreditCard },
  { id: "extras", label: "Extras", icon: Sparkles },
  { id: "payments", label: "Payments", icon: Banknote },
] as const;

type ServiceTabId = (typeof SERVICE_TABS)[number]["id"];

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

function statusLabel(status: string): string {
  return BOOKING_STATUSES.find((s) => s.value === status)?.label ?? status;
}
function statusBadgeClass(status: string): string {
  return (
    BOOKING_STATUSES.find((s) => s.value === status)?.badgeClass ??
    "bg-muted text-muted-foreground border-border"
  );
}
function money(cur: string, value: number): string {
  const c = cur || "AED";
  const v = Number.isFinite(value) ? value : 0;
  return `${c} ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso?: string | null, fmtStr = "MMM d, yyyy"): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), fmtStr);
  } catch {
    return "—";
  }
}
function fmtDateTime(iso?: string | null): string {
  return fmtDate(iso, "MMM d, yyyy · h:mm a");
}
function toInputDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return "";
  }
}
function toInputDateTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}
function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}
function statusMetaFromList<T extends { value: string; label: string }>(
  list: T[],
  value: string,
): T | undefined {
  return list.find((s) => s.value === value);
}

/* ================================================================== */
/* Small UI atoms                                                    */
/* ================================================================== */

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", statusBadgeClass(status))}
    >
      {statusLabel(status)}
    </Badge>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
      <AlertCircle className="size-8 text-rose-500" />
      <p className="text-sm font-medium text-rose-700">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-1.5 size-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}

function SectionTitle({
  step,
  title,
  subtitle,
  right,
}: {
  step?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
      <div className="flex items-start gap-3">
        {step && (
          <span className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {step}
          </span>
        )}
        <div>
          <h3
            className="text-lg font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/* ================================================================== */
/* Reusable API hooks                                                */
/* ================================================================== */

function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeT[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/employees?active=1");
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();
      setEmployees(data.employees ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { employees, loading, reload: load };
}

function useSuppliers(type?: string) {
  const [suppliers, setSuppliers] = useState<SupplierT[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      params.set("active", "1");
      const res = await fetch(`/api/agency/suppliers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [type]);
  useEffect(() => {
    load();
  }, [load]);
  return { suppliers, loading, reload: load };
}

interface ExperienceOption {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
}

function useExperiences() {
  const [experiences, setExperiences] = useState<ExperienceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experiences?limit=200");
      if (!res.ok) throw new Error("Failed to load experiences");
      const data = await res.json();
      setExperiences(
        (data.experiences ?? []).map((e: any) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          price: e.price,
          currency: e.currency,
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { experiences, loading, reload: load };
}

interface HotelOption {
  id: string;
  name: string;
  pricePerNight: number;
  currency: string;
}

function useHotelsCatalog() {
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hotels?limit=200");
      if (!res.ok) throw new Error("Failed to load hotels");
      const data = await res.json();
      setHotels(
        (data.hotels ?? []).map((h: any) => ({
          id: h.id,
          name: h.name,
          pricePerNight: h.pricePerNight,
          currency: h.currency,
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { hotels, loading, reload: load };
}

/* ================================================================== */
/* Add-supplier inline dialog (used by Tours/Transport/Hotels forms) */
/* ================================================================== */

function SupplierAddDialog({
  open,
  onClose,
  onCreated,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (s: SupplierT) => void;
  defaultType: string;
}) {
  const [form, setForm] = useState({
    name: "",
    type: defaultType,
    contactPerson: "",
    email: "",
    phone: "",
    whatsapp: "",
    city: "",
    country: "",
    paymentTerms: "",
    markupValue: "20",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, type: defaultType, name: "", contactPerson: "", email: "", phone: "", whatsapp: "", city: "", country: "", paymentTerms: "", markupValue: "20" }));
    }
  }, [open, defaultType]);

  async function submit() {
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/agency/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Supplier added");
      onCreated(data.supplier);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add supplier");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            Add New Supplier
          </DialogTitle>
          <DialogDescription>
            Create a supplier record. They will appear in the supplier dropdown once saved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Supplier Name" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Arabian Adventures"
            />
          </Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contact Person">
            <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Country">
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Payment Terms">
            <Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="e.g. 30 days credit" />
          </Field>
          <Field label="Default Markup %">
            <Input type="number" value={form.markupValue} onChange={(e) => setForm({ ...form, markupValue: e.target.value })} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Plus className="mr-1.5 size-4" />}
            Add Supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* Field-level "+" button that opens the SupplierAddDialog */
function AddSupplierButton({
  defaultType,
  onCreated,
}: {
  defaultType: string;
  onCreated: (s: SupplierT) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-9 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => setOpen(true)}
        title="Add new supplier"
      >
        <Plus className="size-4" />
      </Button>
      <SupplierAddDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
        defaultType={defaultType}
      />
    </>
  );
}

/* ================================================================== */
/* Main export                                                        */
/* ================================================================== */

export function AgencyDashboard({ onExit }: { onExit?: () => void }) {
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

  const handleOpen = (id: string) => setActiveReservationId(id);
  const handleBack = () => {
    setActiveReservationId(null);
    setListKey((k) => k + 1); // refresh list after edits
  };

  if (activeReservationId) {
    return (
      <ReservationDetail
        reservationId={activeReservationId}
        onBack={handleBack}
        onExit={onExit}
      />
    );
  }
  const handleView = (id: string) => {
    // Eye button: opens the detail page in view-only mode (no status change)
    setActiveReservationId(id);
  };

  if (activeReservationId) {
    return (
      <ReservationDetail
        reservationId={activeReservationId}
        onBack={handleBack}
        onExit={onExit}
      />
    );
  }
  return <BookingList onOpen={handleOpen} onView={handleView} onExit={onExit} refreshKey={listKey} />;
}

/* ================================================================== */
/* View 1 — Booking List                                             */
/* ================================================================== */

function BookingList({
  onOpen,
  onExit,
  onView,
  refreshKey,
}: {
  onOpen: (id: string) => void;
  onView: (id: string) => void;
  onExit?: () => void;
  refreshKey: number;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [items, setItems] = useState<ReservationListItemT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status && status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/agency/reservations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load reservations");
      const data = await res.json();
      setItems(data.reservations ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  async function handleNewBooking() {
    try {
      const res = await fetch("/api/agency/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: "New Customer",
          customerEmail: `customer-${Date.now()}@wanderlust.travel`,
          bookingStatus: "PENDING",
          invoiceType: "TAXABLE",
          termsAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("New reservation created");
      onOpen(data.reservation.id);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create reservation");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Briefcase className="size-3.5 text-gold" />
            Agency Console
          </div>
          <h2
            className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reservations
          </h2>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading reservations…"
              : `${items.length} reservation${items.length === 1 ? "" : "s"} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Refresh
          </Button>
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft className="mr-1.5 size-3.5" />
              Exit
            </Button>
          )}
          <Button onClick={handleNewBooking} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 size-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="luxury-shadow">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by reference, customer name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="luxury-shadow">
        <CardContent className="p-0">
          {error ? (
            <div className="p-4"><ErrorState message={error} onRetry={load} /></div>
          ) : loading ? (
            <div className="p-4"><LoadingBlock rows={6} /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No reservations found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or status filter, or create a new booking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="min-w-[160px]">Booking Number</TableHead>
                    <TableHead className="min-w-[160px]">Customer Name</TableHead>
                    <TableHead className="min-w-[200px]">Email Address</TableHead>
                    <TableHead className="min-w-[140px]">Phone Number</TableHead>
                    <TableHead className="min-w-[220px]">Activity Name</TableHead>
                    <TableHead className="w-[80px] text-center">View</TableHead>
                    <TableHead className="w-[120px] text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {r.reference}
                          </span>
                          <StatusBadge status={r.bookingStatus} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{r.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{r.customerEmail}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {r.customerPhone ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {r.firstServiceName ?? (
                            <span className="text-muted-foreground italic">No services added</span>
                          )}
                        </span>
                        {r.serviceCount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({r.serviceCount} service{r.serviceCount === 1 ? "" : "s"})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-primary hover:bg-primary/10"
                          onClick={() => onView(r.id)}
                          title="View fraud & booking details"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => onOpen(r.id)}
                        >
                          Open
                          <ChevronRight className="ml-1 size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/* View 2 — Reservation Detail (single scrollable page)             */
/* ================================================================== */

function ReservationDetail({
  reservationId,
  onBack,
  onExit,
}: {
  reservationId: string;
  onBack: () => void;
  onExit?: () => void;
}) {
  const [reservation, setReservation] = useState<ReservationT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceTabId>("home");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agency/reservations/${reservationId}`);
      if (!res.ok) throw new Error("Failed to load reservation");
      const data = await res.json();
      setReservation(data.reservation);
    } catch (e: any) {
      setError(e.message ?? "Failed to load reservation");
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-5">
      {/* Top action bar */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1.5 size-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="hidden h-8 sm:block" />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {reservation?.reference ?? "—"}
              </span>
              {reservation && <StatusBadge status={reservation.bookingStatus} />}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoice {reservation?.invoiceNumber ?? "—"} ·{" "}
              {reservation ? money(reservation.currency, reservation.totalAmount) : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Reload
          </Button>
          {onExit && (
            <Button variant="ghost" size="sm" onClick={onExit}>
              Exit
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading || !reservation ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          {/* Section A — Reservation Details */}
          <ReservationDetailsSection
            reservation={reservation}
            onUpdated={(r) => setReservation(r)}
          />

          {/* Section B — Guests Table */}
          <GuestsSection
            reservation={reservation}
            onUpdated={(r) => setReservation(r)}
          />

          {/* Section C — Service Tabs */}
          <Card className="luxury-shadow">
            <CardHeader className="border-b border-border bg-muted/30 p-0">
              <div className="flex flex-wrap items-center gap-1 p-2">
                {SERVICE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  const count =
                    tab.id === "tours"
                      ? reservation.tours.length
                      : tab.id === "hotels"
                        ? reservation.hotels.length
                        : tab.id === "transport"
                          ? reservation.transports.length
                          : tab.id === "payments"
                            ? reservation.payments.length
                            : 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeTab === "home" && <HomeTab reservation={reservation} />}
              {activeTab === "tours" && (
                <ToursTab reservation={reservation} onUpdated={(r) => setReservation(r)} />
              )}
              {activeTab === "hotels" && (
                <HotelsTab reservation={reservation} onUpdated={(r) => setReservation(r)} />
              )}
              {activeTab === "transport" && (
                <TransportTab reservation={reservation} onUpdated={(r) => setReservation(r)} />
              )}
              {activeTab === "payments" && (
                <PaymentsTab reservation={reservation} onUpdated={(r) => setReservation(r)} />
              )}
              {activeTab === "visas" && <ComingSoonTab title="Visas" icon={Sticker} />}
              {activeTab === "flights" && <ComingSoonTab title="Flights" icon={Plane} />}
              {activeTab === "extras" && <ComingSoonTab title="Extras" icon={Sparkles} />}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* Coming Soon placeholder                                           */
/* ================================================================== */

function ComingSoonTab({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium text-foreground">{title} — Coming soon</p>
      <p className="max-w-md text-xs text-muted-foreground">
        This module is not yet implemented in the current build. Existing data for
        Tours, Hotels, Transport and Payments is fully manageable via the
        corresponding tabs.
      </p>
    </div>
  );
}

/* ================================================================== */
/* Section A — Reservation Details                                   */
/* ================================================================== */

function ReservationDetailsSection({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const { employees } = useEmployees();
  const [form, setForm] = useState({
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    customerPhone: reservation.customerPhone ?? "",
    isGuest: reservation.isGuest,
    orderDate: toInputDate(reservation.orderDate),
    invoiceDate: toInputDate(reservation.invoiceDate),
    bookingStatus: reservation.bookingStatus,
    saleById: reservation.saleById ?? "",
    invoiceType: reservation.invoiceType,
    remarks: reservation.remarks ?? "",
    termsAccepted: reservation.termsAccepted,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone ?? "",
      isGuest: reservation.isGuest,
      orderDate: toInputDate(reservation.orderDate),
      invoiceDate: toInputDate(reservation.invoiceDate),
      bookingStatus: reservation.bookingStatus,
      saleById: reservation.saleById ?? "",
      invoiceType: reservation.invoiceType,
      remarks: reservation.remarks ?? "",
      termsAccepted: reservation.termsAccepted,
    });
  }, [reservation]);

  async function save() {
    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      toast.error("Customer name and email are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Reservation saved");
      onUpdated(data.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save reservation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="luxury-shadow">
      <CardHeader className="gap-0 pb-3">
        <SectionTitle
          step="A"
          title="Reservation Details"
          subtitle="Master invoice & customer information"
          right={
            <Button
              onClick={save}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
              Save Record
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Field label="Customer" required className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <div className="flex items-center gap-2">
              <Input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder="Customer name"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="size-9 shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                title="Add new customer"
                onClick={() => toast.info("Customer directory — coming soon")}
              >
                <UserPlus className="size-4" />
              </Button>
            </div>
            <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={form.isGuest}
                onCheckedChange={(v) => setForm({ ...form, isGuest: v })}
              />
              Guest checkout (no customer record)
            </label>
          </Field>

          <Field label="Invoice #">
            <Input value={reservation.invoiceNumber} readOnly className="bg-muted/50 font-mono" />
          </Field>

          <Field label="Reference #">
            <Input value={reservation.reference} readOnly className="bg-muted/50 font-mono" />
          </Field>

          <Field label="Order Date">
            <Input
              type="date"
              value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
            />
          </Field>

          <Field label="Invoice Date">
            <Input
              type="date"
              value={form.invoiceDate}
              onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
            />
          </Field>

          <Field label="Booking Status">
            <Select value={form.bookingStatus} onValueChange={(v) => setForm({ ...form, bookingStatus: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sale By">
            <Select value={form.saleById} onValueChange={(v) => setForm({ ...form, saleById: v })}>
              <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Created By">
            <Input
              value={reservation.saleBy?.name ?? "System"}
              readOnly
              className="bg-muted/50"
            />
          </Field>

          <Field label="Updated By">
            <Input value={reservation.saleBy?.name ?? "System"} readOnly className="bg-muted/50" />
          </Field>

          <Field label="Invoice Type">
            <Select value={form.invoiceType} onValueChange={(v) => setForm({ ...form, invoiceType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVOICE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Currency">
            <Input value={reservation.currency} readOnly className="bg-muted/50" />
          </Field>

          <Field label="Customer Email" required>
            <Input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
            />
          </Field>

          <Field label="Customer Phone">
            <Input
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
            />
          </Field>

          <Field label="Remarks" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Internal remarks visible to agents only…"
            />
          </Field>

          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Switch
              checked={form.termsAccepted}
              onCheckedChange={(v) => setForm({ ...form, termsAccepted: v })}
            />
            <span className="text-sm font-medium text-foreground">
              Terms and Conditions accepted
            </span>
          </div>
        </div>

        {/* Financial summary */}
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <SummaryStat label="Subtotal" value={money(reservation.currency, reservation.subTotal)} />
          <SummaryStat label="VAT (5%)" value={money(reservation.currency, reservation.vatAmount)} />
          <SummaryStat label="Total" value={money(reservation.currency, reservation.totalAmount)} emphasized />
          <SummaryStat label="Paid" value={money(reservation.currency, reservation.amountPaid)} positive />
          <SummaryStat
            label="Balance Due"
            value={money(reservation.currency, reservation.balanceDue)}
            warning={reservation.balanceDue > 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  emphasized,
  positive,
  warning,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        emphasized
          ? "border-primary/30 bg-primary/5"
          : warning
            ? "border-amber-200 bg-amber-50"
            : positive
              ? "border-emerald-200 bg-emerald-50"
              : "border-border bg-muted/30",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-bold",
          emphasized ? "text-primary" : warning ? "text-amber-700" : positive ? "text-emerald-700" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================================== */
/* Section B — Guests Table                                          */
/* ================================================================== */

interface GuestRow {
  tempId: string;
  id?: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  passportNumber: string;
  paxType: string;
  nationality: string;
}

function GuestsSection({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const [rows, setRows] = useState<GuestRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(
      reservation.guests.map((g) => ({
        tempId: g.id,
        id: g.id,
        title: g.title,
        fullName: g.fullName,
        email: g.email ?? "",
        phone: g.phone ?? "",
        passportNumber: g.passportNumber ?? "",
        paxType: g.paxType,
        nationality: g.nationality ?? "",
      })),
    );
  }, [reservation.guests]);

  function addRow() {
    setRows((rs) => [
      ...rs,
      {
        tempId: `new-${Date.now()}`,
        title: "Mr",
        fullName: "",
        email: "",
        phone: "",
        passportNumber: "",
        paxType: "ADULT",
        nationality: "",
      },
    ]);
  }

  function updateRow(tempId: string, patch: Partial<GuestRow>) {
    setRows((rs) => rs.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)));
  }

  function removeRow(tempId: string) {
    setRows((rs) => rs.filter((r) => r.tempId !== tempId));
  }

  async function saveAll() {
    const valid = rows.filter((r) => r.fullName.trim());
    if (valid.length === 0) {
      toast.error("Add at least one guest with a name");
      return;
    }
    setSaving(true);
    try {
      // For simplicity: delete existing guests, then re-create all.
      // This matches the "Save Record(s)" semantic in the screenshot.
      await fetch(`/api/agency/reservations/${reservation.id}/guests`, {
        method: "GET",
      }); // ensure we have latest list (used in diff below)

      const existing = reservation.guests;
      const keptIds = new Set(valid.filter((r) => r.id).map((r) => r.id!));

      // Delete removed
      await Promise.all(
        existing
          .filter((g) => !keptIds.has(g.id))
          .map((g) =>
            fetch(`/api/agency/reservations/${reservation.id}/guests/${g.id}`, {
              method: "DELETE",
            }),
          ),
      );

      // Update existing + create new
      for (const r of valid) {
        const payload = {
          title: r.title,
          fullName: r.fullName,
          email: r.email || null,
          phone: r.phone || null,
          passportNumber: r.passportNumber || null,
          paxType: r.paxType,
          nationality: r.nationality || null,
        };
        if (r.id) {
          await fetch(`/api/agency/reservations/${reservation.id}/guests/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(`/api/agency/reservations/${reservation.id}/guests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }

      toast.success(`Saved ${valid.length} guest${valid.length === 1 ? "" : "s"}`);

      // Reload reservation
      const res = await fetch(`/api/agency/reservations/${reservation.id}`);
      const data = await res.json();
      if (res.ok) onUpdated(data.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save guests");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="luxury-shadow">
      <CardHeader className="gap-0 pb-3">
        <SectionTitle
          step="B"
          title="Guest(s) Details"
          subtitle="Travellers associated with this reservation"
          right={
            <div className="flex items-center gap-2">
              <Button
                onClick={addRow}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <Plus className="mr-1.5 size-4" />
                Add New
              </Button>
              <Button
                onClick={saveAll}
                disabled={saving}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
                Save Record(s)
              </Button>
            </div>
          }
        />
      </CardHeader>
      <CardContent className="pt-4">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
            <Users className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No guests added yet</p>
            <p className="text-xs text-muted-foreground">Click "Add New" to add the first guest.</p>
            <Button size="sm" onClick={addRow} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1.5 size-4" />
              Add First Guest
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="min-w-[110px]">Title</TableHead>
                  <TableHead className="min-w-[180px]">Guest Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[150px]">Phone</TableHead>
                  <TableHead className="min-w-[160px]">Passport</TableHead>
                  <TableHead className="min-w-[120px]">Pax Type</TableHead>
                  <TableHead className="min-w-[180px]">Nationality</TableHead>
                  <TableHead className="w-[60px] text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.tempId}>
                    <TableCell>
                      <Select value={row.title} onValueChange={(v) => updateRow(row.tempId, { title: v })}>
                        <SelectTrigger className="h-9 w-full min-w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {GUEST_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-9"
                        value={row.fullName}
                        onChange={(e) => updateRow(row.tempId, { fullName: e.target.value })}
                        placeholder="Full name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-9"
                        type="email"
                        value={row.email}
                        onChange={(e) => updateRow(row.tempId, { email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-9"
                        value={row.phone}
                        onChange={(e) => updateRow(row.tempId, { phone: e.target.value })}
                        placeholder="+971…"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-9"
                        value={row.passportNumber}
                        onChange={(e) => updateRow(row.tempId, { passportNumber: e.target.value })}
                        placeholder=" Passport #"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={row.paxType} onValueChange={(v) => updateRow(row.tempId, { paxType: v })}>
                        <SelectTrigger className="h-9 w-full min-w-[110px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAX_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={row.nationality} onValueChange={(v) => updateRow(row.tempId, { nationality: v })}>
                        <SelectTrigger className="h-9 w-full min-w-[160px]"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-rose-500 hover:bg-rose-50"
                        onClick={() => removeRow(row.tempId)}
                        title="Remove guest"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/* Home Tab — reservation summary                                    */
/* ================================================================== */

function HomeTab({ reservation }: { reservation: ReservationT }) {
  return (
    <div className="p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Customer
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem label="Name" value={reservation.customerName} icon={User} />
              <DetailItem label="Email" value={reservation.customerEmail} icon={Info} />
              <DetailItem label="Phone" value={reservation.customerPhone ?? "—"} icon={Phone} />
              <DetailItem label="Guest checkout" value={reservation.isGuest ? "Yes" : "No"} icon={Users} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Services
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ServiceCount label="Tours" count={reservation.tours.length} icon={MapPin} />
              <ServiceCount label="Hotels" count={reservation.hotels.length} icon={HotelIcon} />
              <ServiceCount label="Transport" count={reservation.transports.length} icon={CreditCard} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Invoice Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-semibold text-foreground">{reservation.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice #</span>
                <span className="font-mono font-semibold text-foreground">{reservation.invoiceNumber}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">{money(reservation.currency, reservation.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-mono text-foreground">{money(reservation.currency, reservation.vatAmount)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-foreground">Total</span>
                <span className="font-mono text-primary">{money(reservation.currency, reservation.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Paid</span>
                <span className="font-mono">{money(reservation.currency, reservation.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Balance</span>
                <span className="font-mono">{money(reservation.currency, reservation.balanceDue)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Timeline
            </h4>
            <div className="space-y-2 text-xs">
              <DetailItem label="Order Date" value={fmtDate(reservation.orderDate)} icon={CalendarDays} />
              <DetailItem label="Invoice Date" value={fmtDate(reservation.invoiceDate)} icon={CalendarDays} />
              <DetailItem label="Created" value={fmtDateTime(reservation.createdAt)} icon={CalendarDays} />
              <DetailItem label="Updated" value={fmtDateTime(reservation.updatedAt)} icon={CalendarDays} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ServiceCount({ label, count, icon: Icon }: { label: string; count: number; icon: any }) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-center">
      <Icon className="mx-auto size-5 text-primary" />
      <p className="mt-1 text-2xl font-bold text-foreground">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ================================================================== */
/* Service Tab Header bar                                            */
/* ================================================================== */

function ServiceFormHeader({
  title,
  updatedAt,
  updatedBy,
  onClose,
}: {
  title: string;
  updatedAt?: string;
  updatedBy?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-primary px-4 py-2.5 text-primary-foreground">
      <h4
        className="text-base font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h4>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-primary-foreground/80 sm:inline">
          Updated at: {updatedAt ? fmtDateTime(updatedAt) : "—"}
          {updatedBy && <span> By: {updatedBy}</span>}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onClose}
          title="Close form"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ServiceListHeader({
  title,
  subtitle,
  onAdd,
  addLabel,
}: {
  title: string;
  subtitle?: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
      <div>
        <h4
          className="text-base font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h4>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <Button
        onClick={onAdd}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1.5 size-4" />
        {addLabel}
      </Button>
    </div>
  );
}

/* ================================================================== */
/* Tours Tab                                                          */
/* ================================================================== */

interface TourFormState {
  id?: string;
  tourId: string;
  tourName: string;
  tourOption: string;
  transferOption: string;
  pickupLocation: string;
  tourDate: string;
  pickupTime: string;
  timeSlot: string;
  noOfAdults: string;
  noOfChildren: string;
  supplierId: string;
  confirmationNumber: string;
  status: string;
  comments: string;
  costUnit: string;
  adultCostRate: string;
  childCostRate: string;
  carCostRate: string;
  adultSellRate: string;
  childSellRate: string;
  carSellRate: string;
  showOnVoucher: boolean;
}

function emptyTourForm(): TourFormState {
  return {
    tourId: "",
    tourName: "",
    tourOption: "",
    transferOption: "WITHOUT_TRANSFER",
    pickupLocation: "",
    tourDate: toInputDate(new Date().toISOString()),
    pickupTime: "",
    timeSlot: "",
    noOfAdults: "1",
    noOfChildren: "0",
    supplierId: "",
    confirmationNumber: "",
    status: "INITIATED",
    comments: "",
    costUnit: "PER_PERSON",
    adultCostRate: "0",
    childCostRate: "0",
    carCostRate: "0",
    adultSellRate: "0",
    childSellRate: "0",
    carSellRate: "0",
    showOnVoucher: true,
  };
}

function tourFromBooking(t: TourBookingT): TourFormState {
  return {
    id: t.id,
    tourId: t.tourId ?? "",
    tourName: t.tourName,
    tourOption: t.tourOption ?? "",
    transferOption: t.transferOption,
    pickupLocation: t.pickupLocation ?? "",
    tourDate: toInputDate(t.tourDate),
    pickupTime: t.pickupTime ?? "",
    timeSlot: t.timeSlot ?? "",
    noOfAdults: String(t.noOfAdults),
    noOfChildren: String(t.noOfChildren),
    supplierId: t.supplierId ?? "",
    confirmationNumber: t.confirmationNumber ?? "",
    status: t.status,
    comments: t.comments ?? "",
    costUnit: t.costUnit,
    adultCostRate: String(t.adultCostRate),
    childCostRate: String(t.childCostRate),
    carCostRate: String(t.carCostRate),
    adultSellRate: String(t.adultSellRate),
    childSellRate: String(t.childSellRate),
    carSellRate: String(t.carSellRate),
    showOnVoucher: t.showOnVoucher,
  };
}

function ToursTab({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const { experiences } = useExperiences();
  const { suppliers, reload: reloadSuppliers } = useSuppliers("TOUR");
  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<TourFormState>(emptyTourForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TourBookingT | null>(null);

  function openAdd() {
    setForm(emptyTourForm());
    setMode("form");
  }
  function openEdit(t: TourBookingT) {
    setForm(tourFromBooking(t));
    setMode("form");
  }

  function selectTour(id: string) {
    const exp = experiences.find((e) => e.id === id);
    if (exp) {
      setForm((f) => ({
        ...f,
        tourId: id,
        tourName: exp.title,
      }));
    } else {
      setForm((f) => ({ ...f, tourId: "" }));
    }
  }

  async function save() {
    if (!form.tourName.trim()) {
      toast.error("Tour is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        noOfAdults: num(form.noOfAdults),
        noOfChildren: num(form.noOfChildren),
        adultCostRate: num(form.adultCostRate),
        childCostRate: num(form.childCostRate),
        carCostRate: num(form.carCostRate),
        adultSellRate: num(form.adultSellRate),
        childSellRate: num(form.childSellRate),
        carSellRate: num(form.carSellRate),
        tourDate: form.tourDate ? new Date(form.tourDate).toISOString() : null,
      };
      const url = form.id
        ? `/api/agency/reservations/${reservation.id}/tours/${form.id}`
        : `/api/agency/reservations/${reservation.id}/tours`;
      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success(form.id ? "Tour updated" : "Tour added");
      // reload reservation
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
      setMode("list");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save tour");
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: TourBookingT) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/tours/${t.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Tour deleted");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete tour");
    } finally {
      setConfirmDelete(null);
    }
  }

  if (mode === "form") {
    return (
      <TourFormCard
        form={form}
        setForm={setForm}
        experiences={experiences}
        suppliers={suppliers}
        onSupplierAdded={reloadSuppliers}
        onSelectTour={selectTour}
        onSave={save}
        onCancel={() => setMode("list")}
        saving={saving}
        isEdit={!!form.id}
        updatedAt={form.id ? reservation.tours.find((t) => t.id === form.id)?.updatedAt : undefined}
      />
    );
  }

  return (
    <div>
      <ServiceListHeader
        title="Tour Bookings"
        subtitle={`${reservation.tours.length} tour(s) on this reservation`}
        onAdd={openAdd}
        addLabel="Add Tour"
      />
      <div className="p-4">
        {reservation.tours.length === 0 ? (
          <EmptyServiceState
            icon={MapPin}
            message="No tours added yet"
            hint="Click 'Add Tour' to create the first tour booking for this reservation."
            cta={{ label: "Add Tour", onClick: openAdd }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="min-w-[220px]">Tour</TableHead>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[80px] text-center">Adults</TableHead>
                  <TableHead className="min-w-[80px] text-center">Children</TableHead>
                  <TableHead className="min-w-[120px]">Supplier</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[110px] text-right">Sell Total</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.tours.map((t) => {
                  const statusMeta = statusMetaFromList(SERVICE_STATUSES, t.status);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">{t.tourName}</span>
                          {t.tourOption && (
                            <span className="text-xs text-muted-foreground">{t.tourOption}</span>
                          )}
                          {t.transferOption !== "WITHOUT_TRANSFER" && (
                            <span className="text-xs text-muted-foreground">
                              {TRANSFER_OPTIONS.find((o) => o.value === t.transferOption)?.label ?? t.transferOption}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{fmtDate(t.tourDate)}</span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{t.noOfAdults}</TableCell>
                      <TableCell className="text-center text-sm">{t.noOfChildren}</TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{t.supplierName ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {statusMeta?.label ?? t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                        {money(reservation.currency, t.totalSell)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-primary hover:bg-primary/10"
                            onClick={() => openEdit(t)}
                            title="Edit tour"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-rose-500 hover:bg-rose-50"
                            onClick={() => setConfirmDelete(t)}
                            title="Delete tour"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tour booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{confirmDelete?.tourName}” from this reservation.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => confirmDelete && remove(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TourFormCard({
  form,
  setForm,
  experiences,
  suppliers,
  onSupplierAdded,
  onSelectTour,
  onSave,
  onCancel,
  saving,
  isEdit,
  updatedAt,
}: {
  form: TourFormState;
  setForm: React.Dispatch<React.SetStateAction<TourFormState>>;
  experiences: ExperienceOption[];
  suppliers: SupplierT[];
  onSupplierAdded: () => void;
  onSelectTour: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
  updatedAt?: string;
}) {
  // Auto-calc net rates in real-time
  const pricing = useMemo(
    () =>
      calcTourPricing({
        costUnit: form.costUnit,
        adultCostRate: num(form.adultCostRate),
        childCostRate: num(form.childCostRate),
        carCostRate: num(form.carCostRate),
        adultSellRate: num(form.adultSellRate),
        childSellRate: num(form.childSellRate),
        carSellRate: num(form.carSellRate),
        noOfAdults: num(form.noOfAdults),
        noOfChildren: num(form.noOfChildren),
      }),
    [form],
  );

  return (
    <div>
      <ServiceFormHeader
        title={isEdit ? "Edit Tour Booking" : "Add Tour Booking"}
        updatedAt={updatedAt}
        updatedBy={isEdit ? "Agent" : undefined}
        onClose={onCancel}
      />

      <div className="max-h-[60vh] overflow-y-auto p-4">
        {/* Tour Details */}
        <div className="mb-4">
          <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tour Details
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Field label="Tour" required className="lg:col-span-2 xl:col-span-2">
              <Select value={form.tourId} onValueChange={onSelectTour}>
                <SelectTrigger><SelectValue placeholder="Select a tour" /></SelectTrigger>
                <SelectContent>
                  {experiences.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({e.currency} {e.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tour Option">
              <Input
                value={form.tourOption}
                onChange={(e) => setForm((f) => ({ ...f, tourOption: e.target.value }))}
                placeholder="e.g. 2 Park Pass"
              />
            </Field>

            <Field label="Transfer Option">
              <Select value={form.transferOption} onValueChange={(v) => setForm((f) => ({ ...f, transferOption: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSFER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Pickup Location">
              <Input
                value={form.pickupLocation}
                onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
                placeholder="Hotel / address"
              />
            </Field>

            <Field label="Tour Date">
              <Input
                type="date"
                value={form.tourDate}
                onChange={(e) => setForm((f) => ({ ...f, tourDate: e.target.value }))}
              />
            </Field>

            <Field label="Pickup Time">
              <Input
                value={form.pickupTime}
                onChange={(e) => setForm((f) => ({ ...f, pickupTime: e.target.value }))}
                placeholder="e.g. 08:30 AM"
              />
            </Field>

            <Field label="Time Slot">
              <Input
                value={form.timeSlot}
                onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                placeholder="e.g. Morning"
              />
            </Field>

            <Field label="No of Adults">
              <Input
                type="number"
                min="0"
                value={form.noOfAdults}
                onChange={(e) => setForm((f) => ({ ...f, noOfAdults: e.target.value }))}
              />
            </Field>

            <Field label="No of Children">
              <Input
                type="number"
                min="0"
                value={form.noOfChildren}
                onChange={(e) => setForm((f) => ({ ...f, noOfChildren: e.target.value }))}
              />
            </Field>

            <Field label="Supplier">
              <div className="flex items-center gap-2">
                <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AddSupplierButton defaultType="TOUR" onCreated={onSupplierAdded} />
              </div>
            </Field>

            <Field label="Confirmation Number">
              <Input
                value={form.confirmationNumber}
                onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
                placeholder="Supplier ref"
              />
            </Field>

            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Comments" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Textarea
                rows={2}
                value={form.comments}
                onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
                placeholder="Internal comments…"
              />
            </Field>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Pricing */}
        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pricing
            </h5>
            <Field label="Cost Unit" className="w-48">
              <Select value={form.costUnit} onValueChange={(v) => setForm((f) => ({ ...f, costUnit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Cost */}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cost Price (Net)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Adult Rate">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.adultCostRate}
                    onChange={(e) => setForm((f) => ({ ...f, adultCostRate: e.target.value }))}
                  />
                </Field>
                <Field label="Child Rate">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.childCostRate}
                    onChange={(e) => setForm((f) => ({ ...f, childCostRate: e.target.value }))}
                  />
                </Field>
                <Field label="Car Rate (transfer)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.carCostRate}
                    onChange={(e) => setForm((f) => ({ ...f, carCostRate: e.target.value }))}
                  />
                </Field>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <Field label="Net Adult Rate">
                    <Input value={pricing.netAdultRate.toFixed(2)} readOnly className="bg-muted/50 font-mono text-sm" />
                  </Field>
                  <Field label="Net Child Rate">
                    <Input value={pricing.netChildRate.toFixed(2)} readOnly className="bg-muted/50 font-mono text-sm" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between rounded-md border border-border bg-card p-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Total Cost</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {pricing.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sell */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
                Selling Price (to customer)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Adult Rate">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.adultSellRate}
                    onChange={(e) => setForm((f) => ({ ...f, adultSellRate: e.target.value }))}
                  />
                </Field>
                <Field label="Child Rate">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.childSellRate}
                    onChange={(e) => setForm((f) => ({ ...f, childSellRate: e.target.value }))}
                  />
                </Field>
                <Field label="Car Rate (transfer)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.carSellRate}
                    onChange={(e) => setForm((f) => ({ ...f, carSellRate: e.target.value }))}
                  />
                </Field>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <Field label="Net Adult Rate">
                    <Input value={pricing.sellNetAdult.toFixed(2)} readOnly className="bg-card font-mono text-sm" />
                  </Field>
                  <Field label="Net Child Rate">
                    <Input value={pricing.sellNetChild.toFixed(2)} readOnly className="bg-card font-mono text-sm" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between rounded-md border border-primary/20 bg-card p-2">
                    <span className="text-xs font-semibold uppercase text-primary">Total Sell</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {pricing.totalSell.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Switch
              checked={form.showOnVoucher}
              onCheckedChange={(v) => setForm((f) => ({ ...f, showOnVoucher: v }))}
            />
            <span className="text-sm font-medium text-foreground">Show on voucher</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
          {isEdit ? "Save Changes" : "Add Tour"}
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Transport Tab                                                     */
/* ================================================================== */

interface TransportFormState {
  id?: string;
  carType: string;
  noOfPax: string;
  transportType: string;
  pickupDateTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  flightNumber: string;
  netRate: string;
  sellRate: string;
  supplierId: string;
  contactNumber: string;
  status: string;
  confirmationNumber: string;
  comments: string;
  showOnVoucher: boolean;
}

function emptyTransportForm(): TransportFormState {
  return {
    carType: "SEDAN",
    noOfPax: "1",
    transportType: "ARRIVAL",
    pickupDateTime: toInputDateTime(new Date().toISOString()),
    pickupLocation: "",
    dropoffLocation: "",
    flightNumber: "",
    netRate: "0",
    sellRate: "0",
    supplierId: "",
    contactNumber: "",
    status: "INITIATED",
    confirmationNumber: "",
    comments: "",
    showOnVoucher: true,
  };
}

function transportFromBooking(t: TransportBookingT): TransportFormState {
  return {
    id: t.id,
    carType: t.carType,
    noOfPax: String(t.noOfPax),
    transportType: t.transportType,
    pickupDateTime: toInputDateTime(t.pickupDateTime),
    pickupLocation: t.pickupLocation,
    dropoffLocation: t.dropoffLocation,
    flightNumber: t.flightNumber ?? "",
    netRate: String(t.netRate),
    sellRate: String(t.sellRate),
    supplierId: t.supplierId ?? "",
    contactNumber: t.contactNumber ?? "",
    status: t.status,
    confirmationNumber: t.confirmationNumber ?? "",
    comments: t.comments ?? "",
    showOnVoucher: t.showOnVoucher,
  };
}

function TransportTab({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const { suppliers, reload: reloadSuppliers } = useSuppliers("TRANSPORT");
  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<TransportFormState>(emptyTransportForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TransportBookingT | null>(null);

  function openAdd() {
    setForm(emptyTransportForm());
    setMode("form");
  }
  function openEdit(t: TransportBookingT) {
    setForm(transportFromBooking(t));
    setMode("form");
  }

  async function save() {
    if (!form.pickupLocation.trim()) {
      toast.error("Pick-up location is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        noOfPax: num(form.noOfPax),
        netRate: num(form.netRate),
        sellRate: num(form.sellRate),
        pickupDateTime: form.pickupDateTime ? new Date(form.pickupDateTime).toISOString() : null,
      };
      const url = form.id
        ? `/api/agency/reservations/${reservation.id}/transports/${form.id}`
        : `/api/agency/reservations/${reservation.id}/transports`;
      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success(form.id ? "Transport updated" : "Transport added");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
      setMode("list");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save transport");
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: TransportBookingT) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/transports/${t.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Transport deleted");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete transport");
    } finally {
      setConfirmDelete(null);
    }
  }

  if (mode === "form") {
    return (
      <TransportFormCard
        form={form}
        setForm={setForm}
        suppliers={suppliers}
        onSupplierAdded={reloadSuppliers}
        onSave={save}
        onCancel={() => setMode("list")}
        saving={saving}
        isEdit={!!form.id}
        updatedAt={form.id ? reservation.transports.find((t) => t.id === form.id)?.updatedAt : undefined}
      />
    );
  }

  return (
    <div>
      <ServiceListHeader
        title="Transport Bookings"
        subtitle={`${reservation.transports.length} transport(s) on this reservation`}
        onAdd={openAdd}
        addLabel="Add Transport"
      />
      <div className="p-4">
        {reservation.transports.length === 0 ? (
          <EmptyServiceState
            icon={CreditCard}
            message="No transports added yet"
            hint="Click 'Add Transport' to add airport transfer, intercity or hourly transport."
            cta={{ label: "Add Transport", onClick: openAdd }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="min-w-[180px]">Pickup → Dropoff</TableHead>
                  <TableHead className="min-w-[120px]">Car</TableHead>
                  <TableHead className="min-w-[100px] text-center">Pax</TableHead>
                  <TableHead className="min-w-[120px]">Type</TableHead>
                  <TableHead className="min-w-[150px]">Date / Time</TableHead>
                  <TableHead className="min-w-[120px]">Supplier</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[110px] text-right">Sell</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.transports.map((t) => {
                  const statusMeta = statusMetaFromList(SERVICE_STATUSES, t.status);
                  const carMeta = CAR_TYPES.find((c) => c.value === t.carType);
                  const ttMeta = TRANSPORT_TYPES.find((x) => x.value === t.transportType);
                  return (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-sm">
                          <span className="font-medium text-foreground">{t.pickupLocation}</span>
                          <span className="text-xs text-muted-foreground">→ {t.dropoffLocation || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{carMeta?.label ?? t.carType}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{t.noOfPax}</TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{ttMeta?.label ?? t.transportType}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{fmtDateTime(t.pickupDateTime)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{t.supplierName ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {statusMeta?.label ?? t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                        {money(reservation.currency, t.sellRate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-primary hover:bg-primary/10"
                            onClick={() => openEdit(t)}
                            title="Edit transport"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-rose-500 hover:bg-rose-50"
                            onClick={() => setConfirmDelete(t)}
                            title="Delete transport"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transport booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this transport from the reservation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => confirmDelete && remove(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransportFormCard({
  form,
  setForm,
  suppliers,
  onSupplierAdded,
  onSave,
  onCancel,
  saving,
  isEdit,
  updatedAt,
}: {
  form: TransportFormState;
  setForm: React.Dispatch<React.SetStateAction<TransportFormState>>;
  suppliers: SupplierT[];
  onSupplierAdded: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
  updatedAt?: string;
}) {
  const margin = num(form.sellRate) - num(form.netRate);
  return (
    <div>
      <ServiceFormHeader
        title={isEdit ? "Edit Transport Booking" : "Add Transport Booking"}
        updatedAt={updatedAt}
        updatedBy={isEdit ? "Agent" : undefined}
        onClose={onCancel}
      />

      <div className="max-h-[60vh] overflow-y-auto p-4">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transport Details
        </h5>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Field label="Car">
            <Select value={form.carType} onValueChange={(v) => setForm((f) => ({ ...f, carType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAR_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="No. of Pax">
            <Input
              type="number"
              min="1"
              value={form.noOfPax}
              onChange={(e) => setForm((f) => ({ ...f, noOfPax: e.target.value }))}
            />
          </Field>
          <Field label="Transport Type">
            <Select value={form.transportType} onValueChange={(v) => setForm((f) => ({ ...f, transportType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pick Up Date Time">
            <Input
              type="datetime-local"
              value={form.pickupDateTime}
              onChange={(e) => setForm((f) => ({ ...f, pickupDateTime: e.target.value }))}
            />
          </Field>
          <Field label="Pick-up Location" required>
            <Input
              value={form.pickupLocation}
              onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))}
              placeholder="Airport / hotel / address"
            />
          </Field>
          <Field label="Drop off Location">
            <Input
              value={form.dropoffLocation}
              onChange={(e) => setForm((f) => ({ ...f, dropoffLocation: e.target.value }))}
              placeholder="Airport / hotel / address"
            />
          </Field>
          <Field label="Flight Number">
            <Input
              value={form.flightNumber}
              onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
              placeholder="e.g. EK 123"
            />
          </Field>
          <Field label="Net Rate (cost)">
            <Input
              type="number"
              step="0.01"
              value={form.netRate}
              onChange={(e) => setForm((f) => ({ ...f, netRate: e.target.value }))}
            />
          </Field>
          <Field label="Sell Rate">
            <Input
              type="number"
              step="0.01"
              value={form.sellRate}
              onChange={(e) => setForm((f) => ({ ...f, sellRate: e.target.value }))}
            />
          </Field>
          <Field label="Margin">
            <Input value={margin.toFixed(2)} readOnly className="bg-muted/50 font-mono text-sm" />
          </Field>
          <Field label="Supplier">
            <div className="flex items-center gap-2">
              <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AddSupplierButton defaultType="TRANSPORT" onCreated={onSupplierAdded} />
            </div>
          </Field>
          <Field label="Contact Number">
            <Input
              value={form.contactNumber}
              onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
              placeholder="Driver / supplier contact"
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Confirmation Number">
            <Input
              value={form.confirmationNumber}
              onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
            />
          </Field>
          <Field label="Show on Voucher">
            <Select
              value={form.showOnVoucher ? "YES" : "NO"}
              onValueChange={(v) => setForm((f) => ({ ...f, showOnVoucher: v === "YES" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {YES_NO.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Comments" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Textarea
              rows={2}
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
              placeholder="Internal comments…"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
          {isEdit ? "Save Changes" : "Add Transport"}
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Hotels Tab                                                        */
/* ================================================================== */

interface HotelFormState {
  id?: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  mealPlan: string;
  checkInDate: string;
  checkOutDate: string;
  nights: string;
  noOfRooms: string;
  noOfAdults: string;
  noOfChildren: string;
  supplierId: string;
  confirmationNumber: string;
  status: string;
  comments: string;
  costPerNight: string;
  sellPerNight: string;
  showOnVoucher: boolean;
}

function emptyHotelForm(): HotelFormState {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  return {
    hotelId: "",
    hotelName: "",
    roomType: "Standard",
    mealPlan: "BB",
    checkInDate: toInputDate(today.toISOString()),
    checkOutDate: toInputDate(tomorrow.toISOString()),
    nights: "1",
    noOfRooms: "1",
    noOfAdults: "1",
    noOfChildren: "0",
    supplierId: "",
    confirmationNumber: "",
    status: "INITIATED",
    comments: "",
    costPerNight: "0",
    sellPerNight: "0",
    showOnVoucher: true,
  };
}

function hotelFromBooking(h: HotelBookingT): HotelFormState {
  return {
    id: h.id,
    hotelId: h.hotelId ?? "",
    hotelName: h.hotelName,
    roomType: h.roomType,
    mealPlan: h.mealPlan,
    checkInDate: toInputDate(h.checkInDate),
    checkOutDate: toInputDate(h.checkOutDate),
    nights: String(h.nights),
    noOfRooms: String(h.noOfRooms),
    noOfAdults: String(h.noOfAdults),
    noOfChildren: String(h.noOfChildren),
    supplierId: h.supplierId ?? "",
    confirmationNumber: h.confirmationNumber ?? "",
    status: h.status,
    comments: h.comments ?? "",
    costPerNight: String(h.costPerNight),
    sellPerNight: String(h.sellPerNight),
    showOnVoucher: h.showOnVoucher,
  };
}

function HotelsTab({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const { hotels } = useHotelsCatalog();
  const { suppliers, reload: reloadSuppliers } = useSuppliers("HOTEL");
  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<HotelFormState>(emptyHotelForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HotelBookingT | null>(null);

  function openAdd() {
    setForm(emptyHotelForm());
    setMode("form");
  }
  function openEdit(h: HotelBookingT) {
    setForm(hotelFromBooking(h));
    setMode("form");
  }

  function selectHotel(id: string) {
    const h = hotels.find((x) => x.id === id);
    if (h) {
      setForm((f) => ({ ...f, hotelId: id, hotelName: h.name }));
    } else {
      setForm((f) => ({ ...f, hotelId: "" }));
    }
  }

  async function save() {
    if (!form.hotelName.trim()) {
      toast.error("Hotel name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        nights: num(form.nights),
        noOfRooms: num(form.noOfRooms),
        noOfAdults: num(form.noOfAdults),
        noOfChildren: num(form.noOfChildren),
        costPerNight: num(form.costPerNight),
        sellPerNight: num(form.sellPerNight),
        checkInDate: form.checkInDate ? new Date(form.checkInDate).toISOString() : null,
        checkOutDate: form.checkOutDate ? new Date(form.checkOutDate).toISOString() : null,
      };
      const url = form.id
        ? `/api/agency/reservations/${reservation.id}/hotels/${form.id}`
        : `/api/agency/reservations/${reservation.id}/hotels`;
      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success(form.id ? "Hotel updated" : "Hotel added");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
      setMode("list");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save hotel");
    } finally {
      setSaving(false);
    }
  }

  async function remove(h: HotelBookingT) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/hotels/${h.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Hotel deleted");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete hotel");
    } finally {
      setConfirmDelete(null);
    }
  }

  if (mode === "form") {
    return (
      <HotelFormCard
        form={form}
        setForm={setForm}
        hotels={hotels}
        suppliers={suppliers}
        onSupplierAdded={reloadSuppliers}
        onSelectHotel={selectHotel}
        onSave={save}
        onCancel={() => setMode("list")}
        saving={saving}
        isEdit={!!form.id}
        updatedAt={form.id ? reservation.hotels.find((h) => h.id === form.id)?.updatedAt : undefined}
      />
    );
  }

  return (
    <div>
      <ServiceListHeader
        title="Hotel Bookings"
        subtitle={`${reservation.hotels.length} hotel(s) on this reservation`}
        onAdd={openAdd}
        addLabel="Add Hotel"
      />
      <div className="p-4">
        {reservation.hotels.length === 0 ? (
          <EmptyServiceState
            icon={HotelIcon}
            message="No hotels added yet"
            hint="Click 'Add Hotel' to add a hotel booking for this reservation."
            cta={{ label: "Add Hotel", onClick: openAdd }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className="min-w-[200px]">Hotel</TableHead>
                  <TableHead className="min-w-[140px]">Room Type</TableHead>
                  <TableHead className="min-w-[100px]">Meal</TableHead>
                  <TableHead className="min-w-[120px]">Check-in</TableHead>
                  <TableHead className="min-w-[120px]">Check-out</TableHead>
                  <TableHead className="min-w-[70px] text-center">Nights</TableHead>
                  <TableHead className="min-w-[70px] text-center">Rooms</TableHead>
                  <TableHead className="min-w-[120px]">Supplier</TableHead>
                  <TableHead className="min-w-[110px]">Status</TableHead>
                  <TableHead className="min-w-[110px] text-right">Sell Total</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.hotels.map((h) => {
                  const statusMeta = statusMetaFromList(SERVICE_STATUSES, h.status);
                  const mealMeta = MEAL_PLANS.find((m) => m.value === h.mealPlan);
                  return (
                    <TableRow key={h.id} className="hover:bg-muted/40">
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{h.hotelName}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{h.roomType}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mealMeta?.label ?? h.mealPlan}</Badge>
                      </TableCell>
                      <TableCell><span className="text-sm">{fmtDate(h.checkInDate)}</span></TableCell>
                      <TableCell><span className="text-sm">{fmtDate(h.checkOutDate)}</span></TableCell>
                      <TableCell className="text-center text-sm">{h.nights}</TableCell>
                      <TableCell className="text-center text-sm">{h.noOfRooms}</TableCell>
                      <TableCell>
                        <span className="text-sm">{h.supplierName ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {statusMeta?.label ?? h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                        {money(reservation.currency, h.totalSell)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-primary hover:bg-primary/10"
                            onClick={() => openEdit(h)}
                            title="Edit hotel"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-rose-500 hover:bg-rose-50"
                            onClick={() => setConfirmDelete(h)}
                            title="Delete hotel"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hotel booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{confirmDelete?.hotelName}” from this reservation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => confirmDelete && remove(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HotelFormCard({
  form,
  setForm,
  hotels,
  suppliers,
  onSupplierAdded,
  onSelectHotel,
  onSave,
  onCancel,
  saving,
  isEdit,
  updatedAt,
}: {
  form: HotelFormState;
  setForm: React.Dispatch<React.SetStateAction<HotelFormState>>;
  hotels: HotelOption[];
  suppliers: SupplierT[];
  onSupplierAdded: () => void;
  onSelectHotel: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
  updatedAt?: string;
}) {
  const pricing = useMemo(
    () =>
      calcHotelPricing({
        costPerNight: num(form.costPerNight),
        sellPerNight: num(form.sellPerNight),
        nights: num(form.nights),
        noOfRooms: num(form.noOfRooms),
      }),
    [form.costPerNight, form.sellPerNight, form.nights, form.noOfRooms],
  );

  return (
    <div>
      <ServiceFormHeader
        title={isEdit ? "Edit Hotel Booking" : "Add Hotel Booking"}
        updatedAt={updatedAt}
        updatedBy={isEdit ? "Agent" : undefined}
        onClose={onCancel}
      />

      <div className="max-h-[60vh] overflow-y-auto p-4">
        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hotel Details
        </h5>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Field label="Hotel" required className="lg:col-span-2 xl:col-span-2">
            <Select value={form.hotelId} onValueChange={onSelectHotel}>
              <SelectTrigger><SelectValue placeholder="Select a hotel" /></SelectTrigger>
              <SelectContent>
                {hotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name} ({h.currency} {h.pricePerNight}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Room Type">
            <Input
              value={form.roomType}
              onChange={(e) => setForm((f) => ({ ...f, roomType: e.target.value }))}
              placeholder="e.g. Deluxe King"
            />
          </Field>
          <Field label="Meal Plan">
            <Select value={form.mealPlan} onValueChange={(v) => setForm((f) => ({ ...f, mealPlan: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_PLANS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Check-in Date">
            <Input
              type="date"
              value={form.checkInDate}
              onChange={(e) => setForm((f) => ({ ...f, checkInDate: e.target.value }))}
            />
          </Field>
          <Field label="Check-out Date">
            <Input
              type="date"
              value={form.checkOutDate}
              onChange={(e) => setForm((f) => ({ ...f, checkOutDate: e.target.value }))}
            />
          </Field>
          <Field label="Nights">
            <Input
              type="number"
              min="1"
              value={form.nights}
              onChange={(e) => setForm((f) => ({ ...f, nights: e.target.value }))}
            />
          </Field>
          <Field label="No of Rooms">
            <Input
              type="number"
              min="1"
              value={form.noOfRooms}
              onChange={(e) => setForm((f) => ({ ...f, noOfRooms: e.target.value }))}
            />
          </Field>
          <Field label="No of Adults">
            <Input
              type="number"
              min="1"
              value={form.noOfAdults}
              onChange={(e) => setForm((f) => ({ ...f, noOfAdults: e.target.value }))}
            />
          </Field>
          <Field label="No of Children">
            <Input
              type="number"
              min="0"
              value={form.noOfChildren}
              onChange={(e) => setForm((f) => ({ ...f, noOfChildren: e.target.value }))}
            />
          </Field>
          <Field label="Supplier">
            <div className="flex items-center gap-2">
              <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AddSupplierButton defaultType="HOTEL" onCreated={onSupplierAdded} />
            </div>
          </Field>
          <Field label="Confirmation Number">
            <Input
              value={form.confirmationNumber}
              onChange={(e) => setForm((f) => ({ ...f, confirmationNumber: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Show on Voucher">
            <Select
              value={form.showOnVoucher ? "YES" : "NO"}
              onValueChange={(v) => setForm((f) => ({ ...f, showOnVoucher: v === "YES" }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {YES_NO.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Comments" className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Textarea
              rows={2}
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
              placeholder="Internal comments…"
            />
          </Field>
        </div>

        <Separator className="my-4" />

        <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing
        </h5>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cost Price (Net)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cost / Night">
                <Input
                  type="number"
                  step="0.01"
                  value={form.costPerNight}
                  onChange={(e) => setForm((f) => ({ ...f, costPerNight: e.target.value }))}
                />
              </Field>
              <Field label="Total Cost">
                <Input value={pricing.totalCost.toFixed(2)} readOnly className="bg-muted/50 font-mono text-sm" />
              </Field>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
              Selling Price (to customer)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sell / Night">
                <Input
                  type="number"
                  step="0.01"
                  value={form.sellPerNight}
                  onChange={(e) => setForm((f) => ({ ...f, sellPerNight: e.target.value }))}
                />
              </Field>
              <Field label="Total Sell">
                <Input value={pricing.totalSell.toFixed(2)} readOnly className="bg-card font-mono text-sm" />
              </Field>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
          {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
          {isEdit ? "Save Changes" : "Add Hotel"}
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Payments Tab                                                      */
/* ================================================================== */

interface PaymentFormState {
  id?: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  reference: string;
  status: string;
  notes: string;
}

function emptyPaymentForm(currency: string): PaymentFormState {
  void currency;
  return {
    amount: "0",
    paymentMethod: "CASH",
    paymentDate: toInputDate(new Date().toISOString()),
    reference: "",
    status: "RECEIVED",
    notes: "",
  };
}

function PaymentsTab({
  reservation,
  onUpdated,
}: {
  reservation: ReservationT;
  onUpdated: (r: ReservationT) => void;
}) {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<PaymentFormState>(emptyPaymentForm(reservation.currency));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PaymentT | null>(null);

  function openAdd() {
    setForm(emptyPaymentForm(reservation.currency));
    setMode("form");
  }

  async function save() {
    if (!(num(form.amount) > 0)) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: num(form.amount),
        currency: reservation.currency,
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : null,
      };
      const res = await fetch(`/api/agency/reservations/${reservation.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Payment recorded");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
      setMode("list");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save payment");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: PaymentT) {
    try {
      const res = await fetch(`/api/agency/reservations/${reservation.id}/payments/${p.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Payment removed");
      const r = await fetch(`/api/agency/reservations/${reservation.id}`);
      const d = await r.json();
      if (r.ok) onUpdated(d.reservation);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete payment");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      {mode === "form" ? (
        <div>
          <ServiceFormHeader
            title="Add Payment"
            updatedAt={new Date().toISOString()}
            updatedBy="Agent"
            onClose={() => setMode("list")}
          />
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Amount" required>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <Field label="Payment Method">
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Payment Date">
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </Field>
              <Field label="Reference" className="sm:col-span-2">
                <Input
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="Bank transfer ref / gateway ref"
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-4 py-3">
            <Button variant="outline" onClick={() => setMode("list")}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
              Save Payment
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <ServiceListHeader
            title="Payments"
            subtitle={`Paid ${money(reservation.currency, reservation.amountPaid)} of ${money(reservation.currency, reservation.totalAmount)}`}
            onAdd={openAdd}
            addLabel="Add Payment"
          />
          <div className="p-4">
            {reservation.payments.length === 0 ? (
              <EmptyServiceState
                icon={Banknote}
                message="No payments recorded"
                hint="Click 'Add Payment' to record the first payment for this reservation."
                cta={{ label: "Add Payment", onClick: openAdd }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="min-w-[150px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Method</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[180px]">Reference</TableHead>
                      <TableHead className="min-w-[130px] text-right">Amount</TableHead>
                      <TableHead className="w-[80px] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservation.payments.map((p) => {
                      const methodMeta = PAYMENT_METHODS.find((m) => m.value === p.paymentMethod);
                      const statusMeta = PAYMENT_STATUSES.find((s) => s.value === p.status);
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/40">
                          <TableCell><span className="text-sm">{fmtDate(p.paymentDate)}</span></TableCell>
                          <TableCell>
                            <Badge variant="outline">{methodMeta?.label ?? p.paymentMethod}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                p.status === "RECEIVED" && "bg-emerald-100 text-emerald-800 border-emerald-200",
                                p.status === "PENDING" && "bg-amber-100 text-amber-800 border-amber-200",
                                p.status === "REFUNDED" && "bg-rose-100 text-rose-800 border-rose-200",
                              )}
                            >
                              {statusMeta?.label ?? p.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-muted-foreground">{p.reference ?? "—"}</span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold text-emerald-700">
                            {money(p.currency, p.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-rose-500 hover:bg-rose-50"
                              onClick={() => setConfirmDelete(p)}
                              title="Remove payment"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the payment of {confirmDelete && money(confirmDelete.currency, confirmDelete.amount)}.
              The reservation balance will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => confirmDelete && remove(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================================================================== */
/* Empty state shared component                                      */
/* ================================================================== */

function EmptyServiceState({
  icon: Icon,
  message,
  hint,
  cta,
}: {
  icon: any;
  message: string;
  hint: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="max-w-md text-xs text-muted-foreground">{hint}</p>
      {cta && (
        <Button size="sm" onClick={cta.onClick} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1.5 size-4" />
          {cta.label}
        </Button>
      )}
    </div>
  );
}
