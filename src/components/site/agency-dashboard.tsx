"use client";

/**
 * Wanderlust — Agency Booking System Dashboard
 *
 * B2B travel agency management: reservations (master invoices) with tours,
 * transports, hotels, guests, payments. Plus supplier + employee management.
 *
 * Wired to /api/agency/* routes — all 401-guarded by isAdminAuthed.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  Hotel as HotelIcon,
  Info,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Pencil,
  Phone,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Star,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
  Search,
} from "lucide-react";

import type {
  EmployeeT,
  GuestT,
  HotelBookingT,
  PaymentT,
  ReservationListItemT,
  ReservationT,
  Role,
  SupplierT,
  TourBookingT,
  TransportBookingT,
} from "@/lib/agency-types";
import {
  calcHotelPricing,
  calcTourPricing,
} from "@/lib/agency-types";
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
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const RESERVATION_STATUSES = [
  "PENDING",
  "SUPPLIER_PENDING",
  "CUSTOMER_CONFIRMED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

const SERVICE_STATUSES = [
  "INITIATED",
  "SUPPLIER_CONFIRMED",
  "CUSTOMER_CONFIRMED",
  "CONFIRMED",
  "CANCELLED",
] as const;

const CAR_TYPES = ["SEDAN", "SUV", "MINIVAN", "VAN", "LUXURY", "COACH"] as const;
const TRANSPORT_TYPES = ["ARRIVAL", "DEPARTURE", "INTERCITY", "HOURLY"] as const;
const MEAL_PLANS = [
  { value: "BB", label: "Bed & Breakfast" },
  { value: "HB", label: "Half Board" },
  { value: "FB", label: "Full Board" },
  { value: "AI", label: "All Inclusive" },
];
const TRANSFER_OPTIONS = [
  { value: "WITHOUT_TRANSFER", label: "Without Transfer" },
  { value: "SHARED", label: "Shared" },
  { value: "PRIVATE", label: "Private" },
];
const COST_UNITS = [
  { value: "PER_PERSON", label: "Per Person" },
  { value: "PER_BOOKING", label: "Per Booking" },
];
const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "WHATSAPP", "ONLINE"] as const;
const INVOICE_TYPES = [
  { value: "TAXABLE", label: "Taxable (VAT 5%)" },
  { value: "ZERO_RATED", label: "Zero Rated" },
  { value: "EXEMPT", label: "Exempt" },
];
const ROLES: Role[] = ["ADMIN", "SENIOR_AGENT", "JUNIOR_AGENT", "ACCOUNTS"];
const SUPPLIER_TYPES = ["TOUR", "HOTEL", "TRANSPORT", "VISA", "FLIGHT"];
const PAX_TYPES = ["ADULT", "CHILD", "INFANT"];
const GUEST_TITLES = ["Mr", "Mrs", "Miss", "Master", "Dr"];

const SECTION_DEFS: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "reservations", label: "Reservations", icon: ClipboardList },
  { id: "new", label: "New Reservation", icon: Plus },
  { id: "suppliers", label: "Suppliers", icon: Building2 },
  { id: "employees", label: "Employees", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

type SectionId =
  | "reservations"
  | "new"
  | "detail"
  | "suppliers"
  | "employees"
  | "settings";

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

function money(cur: string, value: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur || "AED",
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${value.toFixed(2)} ${cur}`;
  }
}

function fmtDate(iso?: string | null, fmt = "MMM d, yyyy"): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return "—";
  }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy · HH:mm");
  } catch {
    return "—";
  }
}

/* ------------------------------------------------------------------ */
/* Status helpers                                                      */
/* ------------------------------------------------------------------ */

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500 text-white border-transparent";
    case "SUPPLIER_PENDING":
    case "SUPPLIER_CONFIRMED":
      return "bg-sky-600 text-white border-transparent";
    case "CUSTOMER_CONFIRMED":
      return "bg-teal-600 text-white border-transparent";
    case "CONFIRMED":
      return "bg-emerald-600 text-white border-transparent";
    case "COMPLETED":
      return "bg-primary text-primary-foreground border-transparent";
    case "CANCELLED":
      return "bg-destructive text-white border-transparent";
    case "INITIATED":
      return "bg-slate-500 text-white border-transparent";
    case "REFUNDED":
    case "REFUND":
      return "bg-orange-500 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap",
        statusBadgeClass(status),
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Shared small UI helpers                                            */
/* ------------------------------------------------------------------ */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{message}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Please try again in a moment.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" /> Retry
        </Button>
      )}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function AgencyDashboard({ onExit }: { onExit?: () => void }) {
  const [section, setSection] = useState<SectionId>("reservations");
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  // Simulated logged-in employee role. In production this would come from
  // a session. Junior agents cannot see net (cost) rates.
  const [role, setRole] = useState<Role>("ADMIN");
  const canSeeNet =
    role === "ADMIN" || role === "SENIOR_AGENT" || role === "ACCOUNTS";

  const openReservation = (id: string) => {
    setSelectedReservationId(id);
    setSection("detail");
  };

  const newReservation = () => {
    setSelectedReservationId(null);
    setSection("new");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h2
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Agency Booking System
            </h2>
            <p className="text-sm text-muted-foreground">
              B2B reservations, services, suppliers & employees
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              View as
            </span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="h-7 w-36 border-0 px-1 text-xs font-semibold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">
                    {r.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {onExit && (
            <Button variant="outline" size="sm" onClick={onExit}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile section tabs */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar md:hidden">
        {SECTION_DEFS.map((s) => {
          const active =
            s.id === section ||
            (s.id === "reservations" && section === "detail");
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <s.icon className={cn("size-3.5", active && "text-gold")} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Desktop sidebar layout */}
      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-4 flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/40 p-3">
            {SECTION_DEFS.map((s) => {
              const active =
                s.id === section ||
                (s.id === "reservations" && section === "detail");
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground",
                  )}
                >
                  <s.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-gold"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {s.label}
                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-gold" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {section === "reservations" && (
            <ReservationsSection
              onNew={newReservation}
              onOpen={openReservation}
            />
          )}
          {section === "new" && (
            <NewReservationSection
              canSeeNet={canSeeNet}
              onCreated={(id) => openReservation(id)}
              onCancel={() => setSection("reservations")}
            />
          )}
          {section === "detail" && selectedReservationId && (
            <ReservationDetailSection
              reservationId={selectedReservationId}
              canSeeNet={canSeeNet}
              onBack={() => setSection("reservations")}
            />
          )}
          {section === "suppliers" && <SuppliersSection />}
          {section === "employees" && <EmployeesSection />}
          {section === "settings" && <SettingsSection />}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* RESERVATIONS LIST                                                   */
/* ================================================================== */

function ReservationsSection({
  onNew,
  onOpen,
}: {
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const [items, setItems] = useState<ReservationListItemT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL")
        params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/agency/reservations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load reservations");
      const data = (await res.json()) as { reservations: ReservationListItemT[] };
      setItems(data.reservations);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load reservations", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Reservations"
        subtitle="Master reservations with multi-service bookings."
        icon={ClipboardList}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button size="sm" onClick={onNew} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="size-4" /> New Reservation
            </Button>
          </div>
        }
      />

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference, invoice, customer name, email…"
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {RESERVATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="space-y-2 px-4 sm:px-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <ClipboardList className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                No reservations found
              </p>
              <p className="text-xs text-muted-foreground">
                Try adjusting filters or create a new reservation.
              </p>
              <Button size="sm" onClick={onNew} className="mt-2 bg-gold text-gold-foreground hover:bg-gold/90">
                <Plus className="size-4" /> New Reservation
              </Button>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-[140px]">Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Services</TableHead>
                    <TableHead className="hidden lg:table-cell">Sale By</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow
                      key={r.id}
                      onClick={() => onOpen(r.id)}
                      className="cursor-pointer hover:bg-accent/50"
                    >
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-primary">
                          {r.reference}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {r.customerName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {r.invoiceNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.bookingStatus} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {r.serviceCount}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {r.saleByName || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(r.orderDate)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {money(r.currency, r.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            r.balanceDue > 0
                              ? "text-amber-600"
                              : "text-emerald-600",
                          )}
                        >
                          {money(r.currency, r.balanceDue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="size-4 text-muted-foreground" />
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

// Pull the icon import in here so the linter doesn't flag unused.
/* (Search icon imported above) */

/* ================================================================== */
/* NEW RESERVATION (multi-step)                                       */
/* ================================================================== */

function NewReservationSection({
  canSeeNet,
  onCreated,
  onCancel,
}: {
  canSeeNet: boolean;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — customer + invoice
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [orderDate, setOrderDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [bookingStatus, setBookingStatus] = useState<string>("PENDING");
  const [saleById, setSaleById] = useState<string>("");
  const [invoiceType, setInvoiceType] = useState<string>("TAXABLE");
  const [currency, setCurrency] = useState("AED");
  const [remarks, setRemarks] = useState("");

  // Step 2 — guests
  const [guests, setGuests] = useState<Partial<GuestT>[]>([
    { title: "Mr", paxType: "ADULT" },
  ]);

  // Step 3 — services (held locally until save)
  const [tours, setTours] = useState<Partial<TourBookingT>[]>([]);
  const [transports, setTransports] = useState<Partial<TransportBookingT>[]>([]);
  const [hotels, setHotels] = useState<Partial<HotelBookingT>[]>([]);

  const [employees, setEmployees] = useState<EmployeeT[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/agency/employees?active=1", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { employees: EmployeeT[] };
          setEmployees(data.employees);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const canContinueStep1 =
    customerName.trim().length > 0 && customerEmail.trim().length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // 1. Create reservation
      const resRes = await fetch("/api/agency/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          isGuest,
          orderDate,
          bookingStatus,
          saleById: saleById || undefined,
          invoiceType,
          currency,
          remarks,
          termsAccepted: true,
        }),
      });
      if (!resRes.ok) {
        const err = await resRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create reservation");
      }
      const { reservation } = (await resRes.json()) as { reservation: ReservationT };
      const reservationId = reservation.id;

      // 2. Add guests
      for (const g of guests) {
        if (!g.fullName) continue;
        await fetch(`/api/agency/reservations/${reservationId}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: g.title || "Mr",
            fullName: g.fullName,
            email: g.email || undefined,
            phone: g.phone || undefined,
            passportNumber: g.passportNumber || undefined,
            paxType: g.paxType || "ADULT",
            nationality: g.nationality || undefined,
          }),
        });
      }

      // 3. Add tours
      for (const t of tours) {
        if (!t.tourName) continue;
        await fetch(`/api/agency/reservations/${reservationId}/tours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
      }
      for (const t of transports) {
        if (!t.pickupLocation) continue;
        await fetch(`/api/agency/reservations/${reservationId}/transports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t),
        });
      }
      for (const h of hotels) {
        if (!h.hotelName) continue;
        await fetch(`/api/agency/reservations/${reservationId}/hotels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(h),
        });
      }

      toast.success("Reservation created", {
        description: reservation.reference,
      });
      onCreated(reservationId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Failed to create reservation", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="New Reservation"
        subtitle="Create a master reservation with guests and services."
        icon={Plus}
        action={
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="size-4" /> Cancel
          </Button>
        }
      />

      {/* Stepper */}
      <Card className="rounded-xl">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { n: 1, label: "Customer & Invoice" },
              { n: 2, label: "Guests" },
              { n: 3, label: "Services" },
              { n: 4, label: "Review & Save" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px w-6 sm:w-12",
                      step > s.n - 1 ? "bg-gold" : "bg-border",
                    )}
                  />
                )}
                <button
                  onClick={() => setStep(s.n as 1 | 2 | 3 | 4)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    step === s.n
                      ? "border-transparent bg-primary text-primary-foreground"
                      : step > s.n
                        ? "border-gold/40 bg-gold/10 text-gold-foreground"
                        : "border-border text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px]",
                      step === s.n
                        ? "bg-gold text-gold-foreground"
                        : step > s.n
                          ? "bg-gold text-gold-foreground"
                          : "bg-muted",
                    )}
                  >
                    {step > s.n ? <CheckCircle2 className="size-3" /> : s.n}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Customer & Invoice Details</CardTitle>
            <CardDescription>Primary contact and billing metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Customer Name" required>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Anderson"
                />
              </Field>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                />
              </Field>
              <Field label="Guest Checkout">
                <div className="flex h-9 items-center gap-2">
                  <Switch checked={isGuest} onCheckedChange={setIsGuest} />
                  <span className="text-xs text-muted-foreground">
                    No customer record (walk-in)
                  </span>
                </div>
              </Field>
              <Field label="Order Date" required>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </Field>
              <Field label="Booking Status">
                <Select value={bookingStatus} onValueChange={setBookingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sale By">
                <Select value={saleById} onValueChange={setSaleById}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent…" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.role.replace(/_/g, " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Invoice Type">
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["AED", "USD", "EUR", "GBP", "SAR"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Remarks">
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes about this reservation…"
                rows={3}
              />
            </Field>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/70 p-4">
            <Button onClick={() => setStep(2)} disabled={!canContinueStep1}>
              Next: Guests <ChevronRight className="size-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <GuestsEditor guests={guests} setGuests={setGuests} onContinue={() => setStep(3)} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <ServicesEditor
          canSeeNet={canSeeNet}
          tours={tours}
          setTours={setTours}
          transports={transports}
          setTransports={setTransports}
          hotels={hotels}
          setHotels={setHotels}
          onContinue={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Review & Save</CardTitle>
            <CardDescription>Confirm the reservation details before creating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
                <p className="font-semibold text-foreground">{customerName || "—"}</p>
                <p className="text-xs text-muted-foreground">{customerEmail}</p>
                {customerPhone && <p className="text-xs text-muted-foreground">{customerPhone}</p>}
              </div>
              <div className="space-y-1.5 rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</p>
                <p className="text-sm">
                  Status: <StatusBadge status={bookingStatus} />
                </p>
                <p className="text-xs text-muted-foreground">
                  Order Date: {orderDate}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invoice Type: {invoiceType.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground">Currency: {currency}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Guests</p>
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {guests.filter((g) => g.fullName).length}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Tours</p>
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {tours.filter((t) => t.tourName).length}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Transports</p>
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {transports.filter((t) => t.pickupLocation).length}
                </p>
              </div>
            </div>
            {hotels.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-center">
                <p className="text-xs text-muted-foreground">Hotels: {hotels.filter((h) => h.hotelName).length}</p>
              </div>
            )}
          </CardContent>
          <div className="flex justify-between gap-2 border-t border-border/70 p-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" /> Create Reservation
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ================================================================== */
/* GUESTS EDITOR (used in new reservation flow)                       */
/* ================================================================== */

function GuestsEditor({
  guests,
  setGuests,
  onContinue,
  onBack,
}: {
  guests: Partial<GuestT>[];
  setGuests: (g: Partial<GuestT>[]) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const update = (i: number, key: keyof GuestT, value: string) => {
    const next = [...guests];
    next[i] = { ...next[i], [key]: value };
    setGuests(next);
  };
  const remove = (i: number) => setGuests(guests.filter((_, idx) => idx !== i));
  const add = () =>
    setGuests([
      ...guests,
      { title: "Mr", paxType: "ADULT" },
    ]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Guest List</CardTitle>
            <CardDescription>Add one or more guests for this reservation.</CardDescription>
          </div>
          <Button size="sm" onClick={add} variant="outline">
            <UserPlus className="size-4" /> Add Guest
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {guests.length === 0 && (
          <p className="text-sm text-muted-foreground">No guests added yet.</p>
        )}
        {guests.map((g, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/70 bg-muted/20 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Guest #{i + 1}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => remove(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Title">
                <Select
                  value={(g.title as string) || "Mr"}
                  onValueChange={(v) => update(i, "title", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUEST_TITLES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Full Name" required>
                <Input
                  value={(g.fullName as string) || ""}
                  onChange={(e) => update(i, "fullName", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={(g.email as string) || ""}
                  onChange={(e) => update(i, "email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={(g.phone as string) || ""}
                  onChange={(e) => update(i, "phone", e.target.value)}
                />
              </Field>
              <Field label="Passport #">
                <Input
                  value={(g.passportNumber as string) || ""}
                  onChange={(e) => update(i, "passportNumber", e.target.value)}
                />
              </Field>
              <Field label="Pax Type">
                <Select
                  value={(g.paxType as string) || "ADULT"}
                  onValueChange={(v) => update(i, "paxType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAX_TYPES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nationality">
                <Input
                  value={(g.nationality as string) || ""}
                  onChange={(e) => update(i, "nationality", e.target.value)}
                />
              </Field>
            </div>
          </div>
        ))}
      </CardContent>
      <div className="flex justify-between gap-2 border-t border-border/70 p-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onContinue}>
          Next: Services <ChevronRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ================================================================== */
/* SERVICES EDITOR (used in new reservation flow)                     */
/* ================================================================== */

function ServicesEditor({
  canSeeNet,
  tours,
  setTours,
  transports,
  setTransports,
  hotels,
  setHotels,
  onContinue,
  onBack,
}: {
  canSeeNet: boolean;
  tours: Partial<TourBookingT>[];
  setTours: (t: Partial<TourBookingT>[]) => void;
  transports: Partial<TransportBookingT>[];
  setTransports: (t: Partial<TransportBookingT>[]) => void;
  hotels: Partial<HotelBookingT>[];
  setHotels: (h: Partial<HotelBookingT>[]) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [suppliers, setSuppliers] = useState<SupplierT[]>([]);
  const [activeTab, setActiveTab] = useState("tours");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/agency/suppliers?active=1", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as { suppliers: SupplierT[] };
          setSuppliers(data.suppliers);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">Add Services</CardTitle>
        <CardDescription>
          Add tours, transports and hotels. Net rates {canSeeNet ? "visible" : "hidden (Junior Agent role)"}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tours">
              <CalendarDays className="mr-1.5 size-3.5" /> Tours ({tours.length})
            </TabsTrigger>
            <TabsTrigger value="transports">
              <Plane className="mr-1.5 size-3.5" /> Transport ({transports.length})
            </TabsTrigger>
            <TabsTrigger value="hotels">
              <HotelIcon className="mr-1.5 size-3.5" /> Hotels ({hotels.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tours" className="mt-4 space-y-3">
            {tours.map((t, i) => (
              <TourFormCard
                key={i}
                index={i}
                value={t}
                canSeeNet={canSeeNet}
                suppliers={suppliers}
                onChange={(v) => {
                  const next = [...tours];
                  next[i] = v;
                  setTours(next);
                }}
                onRemove={() => setTours(tours.filter((_, idx) => idx !== i))}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTours([
                  ...tours,
                  {
                    transferOption: "WITHOUT_TRANSFER",
                    costUnit: "PER_PERSON",
                    noOfAdults: 1,
                    noOfChildren: 0,
                    showOnVoucher: true,
                    status: "INITIATED",
                  },
                ])
              }
            >
              <Plus className="size-4" /> Add Tour
            </Button>
          </TabsContent>

          <TabsContent value="transports" className="mt-4 space-y-3">
            {transports.map((t, i) => (
              <TransportFormCard
                key={i}
                index={i}
                value={t}
                canSeeNet={canSeeNet}
                suppliers={suppliers}
                onChange={(v) => {
                  const next = [...transports];
                  next[i] = v;
                  setTransports(next);
                }}
                onRemove={() =>
                  setTransports(transports.filter((_, idx) => idx !== i))
                }
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTransports([
                  ...transports,
                  {
                    carType: "SEDAN",
                    noOfPax: 1,
                    transportType: "ARRIVAL",
                    showOnVoucher: true,
                    status: "INITIATED",
                  },
                ])
              }
            >
              <Plus className="size-4" /> Add Transport
            </Button>
          </TabsContent>

          <TabsContent value="hotels" className="mt-4 space-y-3">
            {hotels.map((h, i) => (
              <HotelFormCard
                key={i}
                index={i}
                value={h}
                canSeeNet={canSeeNet}
                suppliers={suppliers}
                onChange={(v) => {
                  const next = [...hotels];
                  next[i] = v;
                  setHotels(next);
                }}
                onRemove={() => setHotels(hotels.filter((_, idx) => idx !== i))}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setHotels([
                  ...hotels,
                  {
                    mealPlan: "BB",
                    noOfRooms: 1,
                    noOfAdults: 1,
                    noOfChildren: 0,
                    showOnVoucher: true,
                    status: "INITIATED",
                  },
                ])
              }
            >
              <Plus className="size-4" /> Add Hotel
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <div className="flex justify-between gap-2 border-t border-border/70 p-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button onClick={onContinue}>
          Next: Review <ChevronRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ================================================================== */
/* RESERVATION DETAIL                                                  */
/* ================================================================== */

function ReservationDetailSection({
  reservationId,
  canSeeNet,
  onBack,
}: {
  reservationId: string;
  canSeeNet: boolean;
  onBack: () => void;
}) {
  const [reservation, setReservation] = useState<ReservationT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierT[]>([]);
  const [employees, setEmployees] = useState<EmployeeT[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editInvoiceType, setEditInvoiceType] = useState("TAXABLE");
  const [editSaleById, setEditSaleById] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agency/reservations/${reservationId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load reservation");
      const data = (await res.json()) as { reservation: ReservationT };
      setReservation(data.reservation);
      setEditName(data.reservation.customerName);
      setEditEmail(data.reservation.customerEmail);
      setEditPhone(data.reservation.customerPhone ?? "");
      setEditStatus(data.reservation.bookingStatus);
      setEditInvoiceType(data.reservation.invoiceType);
      setEditSaleById(data.reservation.saleById ?? "");
      setEditRemarks(data.reservation.remarks ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load reservation", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const [sRes, eRes] = await Promise.all([
          fetch("/api/agency/suppliers?active=1", { cache: "no-store" }),
          fetch("/api/agency/employees?active=1", { cache: "no-store" }),
        ]);
        if (sRes.ok) {
          const d = (await sRes.json()) as { suppliers: SupplierT[] };
          setSuppliers(d.suppliers);
        }
        if (eRes.ok) {
          const d = (await eRes.json()) as { employees: EmployeeT[] };
          setEmployees(d.employees);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function saveEdit() {
    try {
      const res = await fetch(`/api/agency/reservations/${reservationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: editName,
          customerEmail: editEmail,
          customerPhone: editPhone,
          bookingStatus: editStatus,
          invoiceType: editInvoiceType,
          saleById: editSaleById || undefined,
          remarks: editRemarks,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Reservation updated");
      setEditMode(false);
      void load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Update failed", { description: msg });
    }
  }

  async function deleteReservation() {
    try {
      const res = await fetch(`/api/agency/reservations/${reservationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Reservation deleted");
      onBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <ErrorState message={error ?? "Reservation not found"} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {reservation.reference}
              </h2>
              <StatusBadge status={reservation.bookingStatus} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Invoice {reservation.invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
          {editMode ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditMode(false);
                  // Reset
                  setEditName(reservation.customerName);
                  setEditEmail(reservation.customerEmail);
                  setEditPhone(reservation.customerPhone ?? "");
                  setEditStatus(reservation.bookingStatus);
                  setEditInvoiceType(reservation.invoiceType);
                  setEditSaleById(reservation.saleById ?? "");
                  setEditRemarks(reservation.remarks ?? "");
                }}
              >
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Save className="size-4" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>{reservation.reference}</b> and all
              its tours, transports, hotels, guests and payments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteReservation}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header summary card */}
      <Card className="rounded-xl luxury-shadow">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</p>
            {editMode ? (
              <div className="space-y-1.5">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" />
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" />
              </div>
            ) : (
              <>
                <p className="font-semibold text-foreground">{reservation.customerName}</p>
                <p className="text-xs text-muted-foreground">{reservation.customerEmail}</p>
                {reservation.customerPhone && (
                  <p className="text-xs text-muted-foreground">{reservation.customerPhone}</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Date</p>
            <p className="font-medium text-foreground">{fmtDate(reservation.orderDate)}</p>
            <p className="text-xs text-muted-foreground">Sale By: {reservation.saleBy?.name ?? "—"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking Status</p>
            {editMode ? (
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <StatusBadge status={reservation.bookingStatus} />
            )}
            {editMode ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale By</p>
                <Select value={editSaleById} onValueChange={setEditSaleById}>
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice Type</p>
            {editMode ? (
              <Select value={editInvoiceType} onValueChange={setEditInvoiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium text-foreground">
                {reservation.invoiceType.replace(/_/g, " ")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Currency: {reservation.currency}</p>
          </div>

          {editMode && (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
              <Field label="Remarks">
                <Textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={3}
                />
              </Field>
            </div>
          )}
          {!editMode && reservation.remarks && (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks</p>
              <p className="mt-1 rounded-md bg-muted/40 p-2 text-sm text-foreground">
                {reservation.remarks}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryStat label="Sub-total" value={money(reservation.currency, reservation.subTotal)} />
        <SummaryStat label="VAT (5%)" value={money(reservation.currency, reservation.vatAmount)} />
        <SummaryStat
          label="Total"
          value={money(reservation.currency, reservation.totalAmount)}
          accent="gold"
        />
        <SummaryStat
          label="Paid"
          value={money(reservation.currency, reservation.amountPaid)}
          accent="green"
        />
        <SummaryStat
          label="Balance Due"
          value={money(reservation.currency, reservation.balanceDue)}
          accent={reservation.balanceDue > 0 ? "amber" : "green"}
        />
      </div>

      {/* Tabbed detail: Guests / Tours / Transport / Hotels / Payments */}
      <ReservationTabs
        reservation={reservation}
        canSeeNet={canSeeNet}
        suppliers={suppliers}
        onChanged={load}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "gold" | "green" | "amber";
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-lg font-bold tracking-tight sm:text-xl",
            accent === "gold" && "gold-text",
            accent === "green" && "text-emerald-600",
            accent === "amber" && "text-amber-600",
            accent === "default" && "text-foreground",
          )}
          style={
            accent === "gold"
              ? { fontFamily: "var(--font-display)" }
              : undefined
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/* Reservation Tabs (Guests / Tours / Transport / Hotels / Payments)   */
/* ================================================================== */

function ReservationTabs({
  reservation,
  canSeeNet,
  suppliers,
  onChanged,
}: {
  reservation: ReservationT;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  onChanged: () => void;
}) {
  const [tab, setTab] = useState("tours");

  const toursCount = reservation.tours.length;
  const transportsCount = reservation.transports.length;
  const hotelsCount = reservation.hotels.length;
  const guestsCount = reservation.guests.length;
  const paymentsCount = reservation.payments.length;

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
        <TabsTrigger value="tours">
          <CalendarDays className="mr-1.5 size-3.5" /> Tours ({toursCount})
        </TabsTrigger>
        <TabsTrigger value="transports">
          <Plane className="mr-1.5 size-3.5" /> Transport ({transportsCount})
        </TabsTrigger>
        <TabsTrigger value="hotels">
          <HotelIcon className="mr-1.5 size-3.5" /> Hotels ({hotelsCount})
        </TabsTrigger>
        <TabsTrigger value="guests">
          <Users className="mr-1.5 size-3.5" /> Guests ({guestsCount})
        </TabsTrigger>
        <TabsTrigger value="payments">
          <Banknote className="mr-1.5 size-3.5" /> Payments ({paymentsCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tours" className="mt-4">
        <ToursTab
          reservation={reservation}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          onChanged={onChanged}
        />
      </TabsContent>
      <TabsContent value="transports" className="mt-4">
        <TransportsTab
          reservation={reservation}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          onChanged={onChanged}
        />
      </TabsContent>
      <TabsContent value="hotels" className="mt-4">
        <HotelsTab
          reservation={reservation}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          onChanged={onChanged}
        />
      </TabsContent>
      <TabsContent value="guests" className="mt-4">
        <GuestsTab reservation={reservation} onChanged={onChanged} />
      </TabsContent>
      <TabsContent value="payments" className="mt-4">
        <PaymentsTab reservation={reservation} onChanged={onChanged} />
      </TabsContent>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ */
/* Tours tab                                                          */
/* ------------------------------------------------------------------ */

function ToursTab({
  reservation,
  canSeeNet,
  suppliers,
  onChanged,
}: {
  reservation: ReservationT;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/experiences?limit=0", { cache: "no-store" });
        if (res.ok) {
          const d = (await res.json()) as { experiences: { id: string; title: string }[] };
          setExperiences(d.experiences.map((e) => ({ id: e.id, title: e.title })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const editing = reservation.tours.find((t) => t.id === editingId) ?? null;

  async function handleDelete(id: string) {
    if (!confirm("Delete this tour booking?")) return;
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/tours/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Tour removed");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tour Bookings
        </h3>
        <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="size-4" /> Add Tour
        </Button>
      </div>

      {adding && (
        <TourFormCard
          index={-1}
          value={{
            transferOption: "WITHOUT_TRANSFER",
            costUnit: "PER_PERSON",
            noOfAdults: 1,
            noOfChildren: 0,
            showOnVoucher: true,
            status: "INITIATED",
            tourDate: new Date().toISOString(),
          }}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          experiences={experiences}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/tours`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed");
              }
              toast.success("Tour added");
              setAdding(false);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Add failed", { description: msg });
            }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <TourFormCard
          index={-1}
          value={editing}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          experiences={experiences}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/tours/${editing.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) throw new Error("Failed");
              toast.success("Tour updated");
              setEditingId(null);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Update failed", { description: msg });
            }
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {reservation.tours.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No tours booked yet. Click <b>Add Tour</b> to create one.
        </div>
      )}

      {reservation.tours.map((t) => (
        <Card key={t.id} className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{t.tourName}</h4>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(t.tourDate, "EEE, MMM d yyyy")} · {t.noOfAdults}A {t.noOfChildren}C ·{" "}
                  {t.transferOption.replace(/_/g, " ").toLowerCase()}
                  {t.supplierName ? ` · ${t.supplierName}` : ""}
                  {t.confirmationNumber ? ` · Conf: ${t.confirmationNumber}` : ""}
                </p>
                {t.tourOption && (
                  <p className="text-xs text-muted-foreground">Option: {t.tourOption}</p>
                )}
                {t.comments && (
                  <p className="text-xs italic text-muted-foreground">{t.comments}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Sell Total</p>
                  <p className="font-semibold text-foreground">
                    {money(reservation.currency, t.totalSell)}
                  </p>
                  {canSeeNet && (
                    <p className="text-[10px] text-muted-foreground">
                      Net: {money(reservation.currency, t.totalCost)}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  onClick={() => setEditingId(t.id)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transports tab                                                     */
/* ------------------------------------------------------------------ */

function TransportsTab({
  reservation,
  canSeeNet,
  suppliers,
  onChanged,
}: {
  reservation: ReservationT;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = reservation.transports.find((t) => t.id === editingId) ?? null;

  async function handleDelete(id: string) {
    if (!confirm("Delete this transport booking?")) return;
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/transports/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Transport removed");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Transport Bookings
        </h3>
        <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="size-4" /> Add Transport
        </Button>
      </div>

      {adding && (
        <TransportFormCard
          index={-1}
          value={{
            carType: "SEDAN",
            noOfPax: 1,
            transportType: "ARRIVAL",
            pickupDateTime: new Date().toISOString(),
            showOnVoucher: true,
            status: "INITIATED",
          }}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/transports`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed");
              }
              toast.success("Transport added");
              setAdding(false);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Add failed", { description: msg });
            }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <TransportFormCard
          index={-1}
          value={editing}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/transports/${editing.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) throw new Error("Failed");
              toast.success("Transport updated");
              setEditingId(null);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Update failed", { description: msg });
            }
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {reservation.transports.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No transport booked yet.
        </div>
      )}

      {reservation.transports.map((t) => (
        <Card key={t.id} className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">
                    {t.carType} · {t.transportType}
                  </h4>
                  <StatusBadge status={t.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(t.pickupDateTime)} · {t.noOfPax} pax
                </p>
                <p className="text-xs text-muted-foreground">
                  <MapPin className="mr-1 inline size-3" />
                  {t.pickupLocation} → {t.dropoffLocation}
                </p>
                {t.flightNumber && (
                  <p className="text-xs text-muted-foreground">Flight: {t.flightNumber}</p>
                )}
                {t.supplierName && (
                  <p className="text-xs text-muted-foreground">Supplier: {t.supplierName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Sell</p>
                  <p className="font-semibold text-foreground">
                    {money(reservation.currency, t.sellRate)}
                  </p>
                  {canSeeNet && (
                    <p className="text-[10px] text-muted-foreground">
                      Net: {money(reservation.currency, t.netRate)} · M:{" "}
                      {money(reservation.currency, t.margin)}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  onClick={() => setEditingId(t.id)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hotels tab                                                         */
/* ------------------------------------------------------------------ */

function HotelsTab({
  reservation,
  canSeeNet,
  suppliers,
  onChanged,
}: {
  reservation: ReservationT;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const editing = reservation.hotels.find((t) => t.id === editingId) ?? null;

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/hotels?limit=0", { cache: "no-store" });
        if (res.ok) {
          const d = (await res.json()) as { hotels: { id: string; name: string }[] };
          setHotels(d.hotels.map((h) => ({ id: h.id, name: h.name })));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel booking?")) return;
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/hotels/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Hotel removed");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hotel Bookings
        </h3>
        <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="size-4" /> Add Hotel
        </Button>
      </div>

      {adding && (
        <HotelFormCard
          index={-1}
          value={{
            mealPlan: "BB",
            noOfRooms: 1,
            noOfAdults: 1,
            noOfChildren: 0,
            showOnVoucher: true,
            status: "INITIATED",
            checkInDate: new Date().toISOString(),
            checkOutDate: new Date(Date.now() + 86400000).toISOString(),
          }}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          catalogHotels={hotels}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/hotels`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed");
              }
              toast.success("Hotel added");
              setAdding(false);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Add failed", { description: msg });
            }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editing && (
        <HotelFormCard
          index={-1}
          value={editing}
          canSeeNet={canSeeNet}
          suppliers={suppliers}
          catalogHotels={hotels}
          onSave={async (v) => {
            try {
              const res = await fetch(
                `/api/agency/reservations/${reservation.id}/hotels/${editing.id}`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(v),
                },
              );
              if (!res.ok) throw new Error("Failed");
              toast.success("Hotel updated");
              setEditingId(null);
              onChanged();
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Unknown error";
              toast.error("Update failed", { description: msg });
            }
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {reservation.hotels.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No hotels booked yet.
        </div>
      )}

      {reservation.hotels.map((h) => (
        <Card key={h.id} className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{h.hotelName}</h4>
                  <StatusBadge status={h.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(h.checkInDate)} → {fmtDate(h.checkOutDate)} · {h.nights} nights ·{" "}
                  {h.noOfRooms}R {h.noOfAdults}A {h.noOfChildren}C
                </p>
                <p className="text-xs text-muted-foreground">
                  {h.roomType} · {h.mealPlan}
                  {h.supplierName ? ` · ${h.supplierName}` : ""}
                  {h.confirmationNumber ? ` · Conf: ${h.confirmationNumber}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Sell Total</p>
                  <p className="font-semibold text-foreground">
                    {money(reservation.currency, h.totalSell)}
                  </p>
                  {canSeeNet && (
                    <p className="text-[10px] text-muted-foreground">
                      Net: {money(reservation.currency, h.totalCost)}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-muted-foreground"
                  onClick={() => setEditingId(h.id)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(h.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Guests tab                                                         */
/* ------------------------------------------------------------------ */

function GuestsTab({
  reservation,
  onChanged,
}: {
  reservation: ReservationT;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<GuestT>>({});

  const editing = reservation.guests.find((g) => g.id === editId) ?? null;

  function openAdd() {
    setDraft({ title: "Mr", paxType: "ADULT" });
    setAdding(true);
    setEditId(null);
  }

  function openEdit(g: GuestT) {
    setDraft(g);
    setEditId(g.id);
    setAdding(false);
  }

  function close() {
    setAdding(false);
    setEditId(null);
    setDraft({});
  }

  async function save() {
    try {
      if (!draft.fullName) {
        toast.error("Full name required");
        return;
      }
      const url = editing
        ? `/api/agency/reservations/${reservation.id}/guests/${editing.id}`
        : `/api/agency/reservations/${reservation.id}/guests`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Guest updated" : "Guest added");
      close();
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this guest?")) return;
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/guests/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed");
      toast.success("Guest removed");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Guest Manifest
        </h3>
        <Button size="sm" onClick={openAdd} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <UserPlus className="size-4" /> Add Guest
        </Button>
      </div>

      {(adding || editing) && (
        <Card className="rounded-xl border-gold/30 bg-gold/5">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Field label="Title">
                <Select
                  value={(draft.title as string) || "Mr"}
                  onValueChange={(v) => setDraft({ ...draft, title: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GUEST_TITLES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Full Name" required>
                <Input
                  value={(draft.fullName as string) || ""}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={(draft.email as string) || ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={(draft.phone as string) || ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </Field>
              <Field label="Passport #">
                <Input
                  value={(draft.passportNumber as string) || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, passportNumber: e.target.value })
                  }
                />
              </Field>
              <Field label="Pax Type">
                <Select
                  value={(draft.paxType as string) || "ADULT"}
                  onValueChange={(v) => setDraft({ ...draft, paxType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAX_TYPES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nationality">
                <Input
                  value={(draft.nationality as string) || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, nationality: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Save className="size-4" /> Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reservation.guests.length === 0 && !adding && !editing && (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No guests added yet.
        </div>
      )}

      {reservation.guests.length > 0 && (
        <Card className="rounded-xl">
          <CardContent className="p-0 sm:p-0">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">Passport</TableHead>
                    <TableHead>Pax</TableHead>
                    <TableHead className="hidden lg:table-cell">Nationality</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservation.guests.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs">{g.title}</TableCell>
                      <TableCell className="font-medium">{g.fullName}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {g.email || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {g.phone || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {g.passportNumber || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {g.paxType}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {g.nationality || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground"
                            onClick={() => openEdit(g)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => remove(g.id)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Payments tab                                                       */
/* ------------------------------------------------------------------ */

function PaymentsTab({
  reservation,
  onChanged,
}: {
  reservation: ReservationT;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("CASH");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    const amt = Number(amount);
    if (!(amt > 0)) {
      toast.error("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amt,
            paymentMethod: method,
            reference,
            paymentDate: date,
            notes,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success("Payment recorded");
      setAdding(false);
      setAmount("");
      setReference("");
      setNotes("");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this payment?")) return;
    try {
      const res = await fetch(
        `/api/agency/reservations/${reservation.id}/payments/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed");
      toast.success("Payment deleted");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Payments
        </h3>
        <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Plus className="size-4" /> Add Payment
        </Button>
      </div>

      {adding && (
        <Card className="rounded-xl border-gold/30 bg-gold/5">
          <CardContent className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Field label="Amount" required>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Method">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Reference">
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="TXN-XXXX"
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Notes">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}{" "}
                Save Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reservation.payments.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          No payments recorded yet.
        </div>
      )}

      {reservation.payments.length > 0 && (
        <Card className="rounded-xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(p.paymentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {p.paymentMethod.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {p.reference || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {p.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">
                      +{money(reservation.currency, p.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ================================================================== */
/* TOUR FORM CARD                                                     */
/* ================================================================== */

interface TourFormProps {
  index: number;
  value: Partial<TourBookingT>;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  experiences?: { id: string; title: string }[];
  onSave?: (v: Partial<TourBookingT>) => void;
  onChange?: (v: Partial<TourBookingT>) => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

function TourFormCard({
  index,
  value,
  canSeeNet,
  suppliers,
  experiences,
  onSave,
  onChange,
  onCancel,
  onRemove,
}: TourFormProps) {
  const isEditing = Boolean(onSave);

  function update<K extends keyof TourBookingT>(key: K, v: TourBookingT[K]) {
    onChange?.({ ...value, [key]: v });
  }

  // Live pricing preview
  const pricing = useMemo(() => {
    return calcTourPricing({
      costUnit: (value.costUnit as string) || "PER_PERSON",
      adultCostRate: Number(value.adultCostRate ?? 0),
      childCostRate: Number(value.childCostRate ?? 0),
      carCostRate: Number(value.carCostRate ?? 0),
      adultSellRate: Number(value.adultSellRate ?? 0),
      childSellRate: Number(value.childSellRate ?? 0),
      carSellRate: Number(value.carSellRate ?? 0),
      noOfAdults: Number(value.noOfAdults ?? 0),
      noOfChildren: Number(value.noOfChildren ?? 0),
    });
  }, [value]);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {isEditing
            ? index === -1
              ? "New Tour Booking"
              : `Edit Tour`
            : `Tour #${index + 1}`}
        </h4>
        <div className="flex items-center gap-1">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="size-3.5" /> Cancel
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={() => onSave?.(value)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Save className="size-3.5" /> Save
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Tour" required>
          {experiences && experiences.length > 0 ? (
            <Select
              value={(value.tourId as string) || ""}
              onValueChange={(v) => {
                const exp = experiences.find((e) => e.id === v);
                update("tourId", v);
                if (exp) update("tourName", exp.title);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select from catalog…" /></SelectTrigger>
              <SelectContent>
                {experiences.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            className={experiences && experiences.length > 0 ? "mt-2" : ""}
            value={(value.tourName as string) || ""}
            onChange={(e) => update("tourName", e.target.value)}
            placeholder="Or enter tour name"
          />
        </Field>
        <Field label="Tour Option">
          <Input
            value={(value.tourOption as string) || ""}
            onChange={(e) => update("tourOption", e.target.value)}
            placeholder="e.g. 1 Day 2 Park Pass"
          />
        </Field>
        <Field label="Transfer Option">
          <Select
            value={(value.transferOption as string) || "WITHOUT_TRANSFER"}
            onValueChange={(v) => update("transferOption", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSFER_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Pickup Location">
          <Input
            value={(value.pickupLocation as string) || ""}
            onChange={(e) => update("pickupLocation", e.target.value)}
            placeholder="Hotel lobby, address…"
          />
        </Field>
        <Field label="Tour Date" required>
          <Input
            type="date"
            value={
              value.tourDate
                ? format(parseISO(value.tourDate), "yyyy-MM-dd")
                : format(new Date(), "yyyy-MM-dd")
            }
            onChange={(e) =>
              update("tourDate", new Date(e.target.value).toISOString())
            }
          />
        </Field>
        <Field label="Pickup Time">
          <Input
            type="time"
            value={(value.pickupTime as string) || ""}
            onChange={(e) => update("pickupTime", e.target.value)}
          />
        </Field>
        <Field label="Time Slot">
          <Input
            value={(value.timeSlot as string) || ""}
            onChange={(e) => update("timeSlot", e.target.value)}
            placeholder="Morning / Evening"
          />
        </Field>
        <Field label="No of Adults">
          <Input
            type="number"
            min={0}
            value={Number(value.noOfAdults ?? 0)}
            onChange={(e) => update("noOfAdults", Math.max(0, Number(e.target.value)))}
          />
        </Field>
        <Field label="No of Children">
          <Input
            type="number"
            min={0}
            value={Number(value.noOfChildren ?? 0)}
            onChange={(e) => update("noOfChildren", Math.max(0, Number(e.target.value)))}
          />
        </Field>
        <Field label="Supplier">
          <Select
            value={(value.supplierId as string) || ""}
            onValueChange={(v) => update("supplierId", v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {suppliers
                .filter((s) => s.type === "TOUR" || s.type === "TRANSPORT")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Confirmation #">
          <Input
            value={(value.confirmationNumber as string) || ""}
            onChange={(e) => update("confirmationNumber", e.target.value)}
            placeholder="AA-XXXX"
          />
        </Field>
        <Field label="Status">
          <Select
            value={(value.status as string) || "INITIATED"}
            onValueChange={(v) => update("status", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Pricing */}
      <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-[11px] text-muted-foreground">Show on Voucher</Label>
            <Switch
              checked={value.showOnVoucher ?? true}
              onCheckedChange={(v) => update("showOnVoucher", v)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Cost Unit">
            <Select
              value={(value.costUnit as string) || "PER_PERSON"}
              onValueChange={(v) => update("costUnit", v)}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COST_UNITS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {canSeeNet && (
            <>
              <Field label="Adult Cost Rate">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={Number(value.adultCostRate ?? 0)}
                  onChange={(e) => update("adultCostRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Child Cost Rate">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={Number(value.childCostRate ?? 0)}
                  onChange={(e) => update("childCostRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Car Cost Rate">
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={Number(value.carCostRate ?? 0)}
                  onChange={(e) => update("carCostRate", Number(e.target.value))}
                />
              </Field>
            </>
          )}
          <Field label="Adult Sell Rate">
            <Input
              type="number"
              className="h-8 text-xs"
              value={Number(value.adultSellRate ?? 0)}
              onChange={(e) => update("adultSellRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Child Sell Rate">
            <Input
              type="number"
              className="h-8 text-xs"
              value={Number(value.childSellRate ?? 0)}
              onChange={(e) => update("childSellRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Car Sell Rate">
            <Input
              type="number"
              className="h-8 text-xs"
              value={Number(value.carSellRate ?? 0)}
              onChange={(e) => update("carSellRate", Number(e.target.value))}
            />
          </Field>
        </div>

        {/* Calculated totals */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {canSeeNet && (
            <div className="rounded-md bg-card p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Net Total
              </p>
              <p className="text-sm font-semibold text-foreground">
                {pricing.totalCost.toFixed(2)}
              </p>
            </div>
          )}
          <div className="rounded-md bg-gold/10 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gold-foreground/70">
              Sell Total
            </p>
            <p className="text-sm font-bold text-gold-foreground">
              {pricing.totalSell.toFixed(2)}
            </p>
          </div>
          {canSeeNet && (
            <div className="rounded-md bg-card p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Margin
              </p>
              <p className="text-sm font-semibold text-emerald-600">
                {(pricing.totalSell - pricing.totalCost).toFixed(2)}
              </p>
            </div>
          )}
          <div className="rounded-md bg-card p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pax
            </p>
            <p className="text-sm font-semibold text-foreground">
              {Number(value.noOfAdults ?? 0) + Number(value.noOfChildren ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <Field label="Comments">
        <Textarea
          value={(value.comments as string) || ""}
          onChange={(e) => update("comments", e.target.value)}
          rows={2}
          className="mt-2"
          placeholder="Optional supplier notes…"
        />
      </Field>
    </div>
  );
}

/* ================================================================== */
/* TRANSPORT FORM CARD                                                */
/* ================================================================== */

interface TransportFormProps {
  index: number;
  value: Partial<TransportBookingT>;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  onSave?: (v: Partial<TransportBookingT>) => void;
  onChange?: (v: Partial<TransportBookingT>) => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

function TransportFormCard({
  index,
  value,
  canSeeNet,
  suppliers,
  onSave,
  onChange,
  onCancel,
  onRemove,
}: TransportFormProps) {
  const isEditing = Boolean(onSave);

  function update<K extends keyof TransportBookingT>(key: K, v: TransportBookingT[K]) {
    onChange?.({ ...value, [key]: v });
  }

  const netRate = Number(value.netRate ?? 0);
  const sellRate = Number(value.sellRate ?? 0);
  const margin = sellRate - netRate;

  const pickupDate = value.pickupDateTime
    ? format(parseISO(value.pickupDateTime), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const pickupTime = value.pickupDateTime
    ? format(parseISO(value.pickupDateTime), "HH:mm")
    : "12:00";

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {isEditing
            ? index === -1
              ? "New Transport Booking"
              : "Edit Transport"
            : `Transport #${index + 1}`}
        </h4>
        <div className="flex items-center gap-1">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="size-3.5" /> Cancel
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={() => onSave?.(value)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Save className="size-3.5" /> Save
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Car Type">
          <Select
            value={(value.carType as string) || "SEDAN"}
            onValueChange={(v) => update("carType", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CAR_TYPES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="No of Pax">
          <Input
            type="number"
            min={1}
            value={Number(value.noOfPax ?? 1)}
            onChange={(e) => update("noOfPax", Math.max(1, Number(e.target.value)))}
          />
        </Field>
        <Field label="Transport Type">
          <Select
            value={(value.transportType as string) || "ARRIVAL"}
            onValueChange={(v) => update("transportType", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRANSPORT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Pickup Date">
          <Input
            type="date"
            value={pickupDate}
            onChange={(e) => {
              const dt = new Date(`${e.target.value}T${pickupTime}`);
              update("pickupDateTime", dt.toISOString());
            }}
          />
        </Field>
        <Field label="Pickup Time">
          <Input
            type="time"
            value={pickupTime}
            onChange={(e) => {
              const dt = new Date(`${pickupDate}T${e.target.value}`);
              update("pickupDateTime", dt.toISOString());
            }}
          />
        </Field>
        <Field label="Flight Number">
          <Input
            value={(value.flightNumber as string) || ""}
            onChange={(e) => update("flightNumber", e.target.value)}
            placeholder="EK 123"
          />
        </Field>
        <Field label="Pickup Location" required>
          <Input
            value={(value.pickupLocation as string) || ""}
            onChange={(e) => update("pickupLocation", e.target.value)}
            placeholder="Airport / Hotel / Address"
          />
        </Field>
        <Field label="Drop-off Location">
          <Input
            value={(value.dropoffLocation as string) || ""}
            onChange={(e) => update("dropoffLocation", e.target.value)}
          />
        </Field>
        <Field label="Supplier">
          <Select
            value={(value.supplierId as string) || ""}
            onValueChange={(v) => update("supplierId", v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {suppliers
                .filter((s) => s.type === "TRANSPORT")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Contact Number">
          <Input
            value={(value.contactNumber as string) || ""}
            onChange={(e) => update("contactNumber", e.target.value)}
            placeholder="+971 50 …"
          />
        </Field>
        <Field label="Confirmation #">
          <Input
            value={(value.confirmationNumber as string) || ""}
            onChange={(e) => update("confirmationNumber", e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={(value.status as string) || "INITIATED"}
            onValueChange={(v) => update("status", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-[11px] text-muted-foreground">Show on Voucher</Label>
            <Switch
              checked={value.showOnVoucher ?? true}
              onCheckedChange={(v) => update("showOnVoucher", v)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {canSeeNet && (
            <Field label="Net Rate">
              <Input
                type="number"
                value={netRate}
                onChange={(e) => update("netRate", Number(e.target.value))}
              />
            </Field>
          )}
          <Field label="Sell Rate">
            <Input
              type="number"
              value={sellRate}
              onChange={(e) => update("sellRate", Number(e.target.value))}
            />
          </Field>
          {canSeeNet && (
            <div className="flex items-end">
              <div className="w-full rounded-md bg-card p-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Margin (auto)
                </p>
                <p className="text-sm font-bold text-emerald-600">
                  {margin.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Field label="Comments">
        <Textarea
          value={(value.comments as string) || ""}
          onChange={(e) => update("comments", e.target.value)}
          rows={2}
          className="mt-2"
        />
      </Field>
    </div>
  );
}

/* ================================================================== */
/* HOTEL FORM CARD                                                    */
/* ================================================================== */

interface HotelFormProps {
  index: number;
  value: Partial<HotelBookingT>;
  canSeeNet: boolean;
  suppliers: SupplierT[];
  catalogHotels?: { id: string; name: string }[];
  onSave?: (v: Partial<HotelBookingT>) => void;
  onChange?: (v: Partial<HotelBookingT>) => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

function HotelFormCard({
  index,
  value,
  canSeeNet,
  suppliers,
  catalogHotels,
  onSave,
  onChange,
  onCancel,
  onRemove,
}: HotelFormProps) {
  const isEditing = Boolean(onSave);

  function update<K extends keyof HotelBookingT>(key: K, v: HotelBookingT[K]) {
    onChange?.({ ...value, [key]: v });
  }

  const checkIn = value.checkInDate
    ? format(parseISO(value.checkInDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const checkOut = value.checkOutDate
    ? format(parseISO(value.checkOutDate), "yyyy-MM-dd")
    : format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  const nights = useMemo(() => {
    try {
      return Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));
    } catch {
      return 1;
    }
  }, [checkIn, checkOut]);

  const pricing = useMemo(() => {
    return calcHotelPricing({
      costPerNight: Number(value.costPerNight ?? 0),
      sellPerNight: Number(value.sellPerNight ?? 0),
      nights,
      noOfRooms: Number(value.noOfRooms ?? 1),
    });
  }, [value.costPerNight, value.sellPerNight, nights, value.noOfRooms]);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {isEditing
            ? index === -1
              ? "New Hotel Booking"
              : "Edit Hotel"
            : `Hotel #${index + 1}`}
        </h4>
        <div className="flex items-center gap-1">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="size-3.5" /> Cancel
            </Button>
          )}
          {onRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={() => onSave?.({ ...value, nights })} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Save className="size-3.5" /> Save
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Hotel" required>
          {catalogHotels && catalogHotels.length > 0 ? (
            <Select
              value={(value.hotelId as string) || ""}
              onValueChange={(v) => {
                const h = catalogHotels.find((e) => e.id === v);
                update("hotelId", v);
                if (h) update("hotelName", h.name);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select from catalog…" /></SelectTrigger>
              <SelectContent>
                {catalogHotels.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            className={catalogHotels && catalogHotels.length > 0 ? "mt-2" : ""}
            value={(value.hotelName as string) || ""}
            onChange={(e) => update("hotelName", e.target.value)}
            placeholder="Or enter hotel name"
          />
        </Field>
        <Field label="Room Type">
          <Input
            value={(value.roomType as string) || ""}
            onChange={(e) => update("roomType", e.target.value)}
            placeholder="Sky Pool Suite"
          />
        </Field>
        <Field label="Meal Plan">
          <Select
            value={(value.mealPlan as string) || "BB"}
            onValueChange={(v) => update("mealPlan", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEAL_PLANS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label} ({m.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Check-in Date" required>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => update("checkInDate", new Date(`${e.target.value}T12:00`).toISOString())}
          />
        </Field>
        <Field label="Check-out Date" required>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => update("checkOutDate", new Date(`${e.target.value}T12:00`).toISOString())}
          />
        </Field>
        <Field label="Nights (auto)">
          <Input value={nights} disabled className="bg-muted/30" />
        </Field>
        <Field label="No of Rooms">
          <Input
            type="number"
            min={1}
            value={Number(value.noOfRooms ?? 1)}
            onChange={(e) => update("noOfRooms", Math.max(1, Number(e.target.value)))}
          />
        </Field>
        <Field label="No of Adults">
          <Input
            type="number"
            min={1}
            value={Number(value.noOfAdults ?? 1)}
            onChange={(e) => update("noOfAdults", Math.max(1, Number(e.target.value)))}
          />
        </Field>
        <Field label="No of Children">
          <Input
            type="number"
            min={0}
            value={Number(value.noOfChildren ?? 0)}
            onChange={(e) => update("noOfChildren", Math.max(0, Number(e.target.value)))}
          />
        </Field>
        <Field label="Supplier">
          <Select
            value={(value.supplierId as string) || ""}
            onValueChange={(v) => update("supplierId", v)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {suppliers
                .filter((s) => s.type === "HOTEL")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Confirmation #">
          <Input
            value={(value.confirmationNumber as string) || ""}
            onChange={(e) => update("confirmationNumber", e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={(value.status as string) || "INITIATED"}
            onValueChange={(v) => update("status", v)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SERVICE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pricing
          </p>
          <div className="flex items-center gap-2">
            <Label className="text-[11px] text-muted-foreground">Show on Voucher</Label>
            <Switch
              checked={value.showOnVoucher ?? true}
              onCheckedChange={(v) => update("showOnVoucher", v)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {canSeeNet && (
            <Field label="Cost / Night">
              <Input
                type="number"
                value={Number(value.costPerNight ?? 0)}
                onChange={(e) => update("costPerNight", Number(e.target.value))}
              />
            </Field>
          )}
          <Field label="Sell / Night">
            <Input
              type="number"
              value={Number(value.sellPerNight ?? 0)}
              onChange={(e) => update("sellPerNight", Number(e.target.value))}
            />
          </Field>
          {canSeeNet && (
            <div className="flex items-end">
              <div className="w-full rounded-md bg-card p-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Net Total (auto)
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {pricing.totalCost.toFixed(2)}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-end">
            <div className="w-full rounded-md bg-gold/10 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gold-foreground/70">
                Sell Total (auto)
              </p>
              <p className="text-sm font-bold text-gold-foreground">
                {pricing.totalSell.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Field label="Comments">
        <Textarea
          value={(value.comments as string) || ""}
          onChange={(e) => update("comments", e.target.value)}
          rows={2}
          className="mt-2"
        />
      </Field>
    </div>
  );
}

/* ================================================================== */
/* SUPPLIERS SECTION                                                  */
/* ================================================================== */

function SuppliersSection() {
  const [items, setItems] = useState<SupplierT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SupplierT | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierT | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/suppliers", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = (await res.json()) as { suppliers: SupplierT[] };
      setItems(data.suppliers);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load suppliers", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/agency/suppliers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Supplier deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Suppliers"
        subtitle="Tour operators, hotels, transport providers and more."
        icon={Building2}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="size-4" /> Add Supplier
            </Button>
          </div>
        }
      />

      <Card className="rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Building2 className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">No suppliers yet</p>
              <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Plus className="size-4" /> Add Supplier
              </Button>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact</TableHead>
                    <TableHead className="hidden xl:table-cell">City</TableHead>
                    <TableHead className="hidden lg:table-cell">Markup</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{s.name}</div>
                        {s.email && (
                          <div className="text-[11px] text-muted-foreground">
                            {s.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {s.contactPerson || "—"}
                        {s.phone && (
                          <div className="text-[10px]">{s.phone}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {s.city || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">
                        {s.markupType === "PERCENT"
                          ? `${s.markupValue}%`
                          : `${s.markupValue} ${s.currency}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "size-3",
                                i < s.rating
                                  ? "fill-gold text-gold"
                                  : "text-muted-foreground/30",
                              )}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            s.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-muted text-muted-foreground",
                          )}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground"
                            onClick={() => setEditing(s)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(s)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <SupplierDialog
        open={adding || editing !== null}
        supplier={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>{deleteTarget?.name}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SupplierDialog({
  open,
  supplier,
  onClose,
  onSaved,
}: {
  open: boolean;
  supplier: SupplierT | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("TOUR");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [markupType, setMarkupType] = useState("PERCENT");
  const [markupValue, setMarkupValue] = useState("20");
  const [rating, setRating] = useState("5");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setType(supplier.type);
      setContactPerson(supplier.contactPerson ?? "");
      setEmail(supplier.email ?? "");
      setPhone(supplier.phone ?? "");
      setWhatsapp(supplier.whatsapp ?? "");
      setAddress(supplier.address ?? "");
      setCity(supplier.city ?? "");
      setCountry(supplier.country ?? "");
      setCurrency(supplier.currency);
      setPaymentTerms(supplier.paymentTerms ?? "");
      setMarkupType(supplier.markupType);
      setMarkupValue(String(supplier.markupValue));
      setRating(String(supplier.rating));
      setActive(supplier.active);
    } else if (open) {
      setName("");
      setType("TOUR");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setAddress("");
      setCity("");
      setCountry("");
      setCurrency("AED");
      setPaymentTerms("");
      setMarkupType("PERCENT");
      setMarkupValue("20");
      setRating("5");
      setActive(true);
    }
  }, [supplier, open]);

  async function save() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name,
        type,
        contactPerson,
        email,
        phone,
        whatsapp,
        address,
        city,
        country,
        currency,
        paymentTerms,
        markupType,
        markupValue: Number(markupValue),
        rating: Number(rating),
        active,
      };
      const url = supplier
        ? `/api/agency/suppliers/${supplier.id}`
        : "/api/agency/suppliers";
      const method = supplier ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success(supplier ? "Supplier updated" : "Supplier created");
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {supplier ? "Edit Supplier" : "New Supplier"}
          </DialogTitle>
          <DialogDescription>
            Tour operator, hotel chain, transport provider or other vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPLIER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contact Person">
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Country">
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </Field>
          <Field label="Currency">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["AED", "USD", "EUR", "GBP", "SAR"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Payment Terms">
            <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. 30 days credit" />
          </Field>
          <Field label="Markup Type">
            <Select value={markupType} onValueChange={setMarkupType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percent</SelectItem>
                <SelectItem value="FIXED">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Markup Value">
            <Input
              type="number"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
            />
          </Field>
          <Field label="Rating (1-5)">
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((r) => (
                  <SelectItem key={r} value={String(r)}>{r} star{r > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Switch checked={active} onCheckedChange={setActive} />
          <Label className="text-sm">Active</Label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}{" "}
            {supplier ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* EMPLOYEES SECTION                                                  */
/* ================================================================== */

function EmployeesSection() {
  const [items, setItems] = useState<EmployeeT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EmployeeT | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeT | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/employees", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load employees");
      const data = (await res.json()) as { employees: EmployeeT[] };
      setItems(data.employees);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load employees", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/agency/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Employee deleted");
      setDeleteTarget(null);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    }
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Employees"
        subtitle="Agency staff with role-based access."
        icon={Users}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="size-4" /> Add Employee
            </Button>
          </div>
        }
      />

      <Card className="rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Users className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">No employees yet</p>
              <Button size="sm" onClick={() => setAdding(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Plus className="size-4" /> Add Employee
              </Button>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-foreground">
                        {e.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {e.email}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {e.phone || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {e.role.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            e.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-muted text-muted-foreground",
                          )}
                        >
                          {e.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {fmtDate(e.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-muted-foreground"
                            onClick={() => setEditing(e)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(e)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeDialog
        open={adding || editing !== null}
        employee={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSaved={() => {
          setAdding(false);
          setEditing(null);
          load();
        }}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>{deleteTarget?.name}</b>.
              Reservations they created will remain but the sale-by reference will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmployeeDialog({
  open,
  employee,
  onClose,
  onSaved,
}: {
  open: boolean;
  employee: EmployeeT | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("JUNIOR_AGENT");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setPassword("");
      setRole(employee.role);
      setPhone(employee.phone ?? "");
      setActive(employee.active);
    } else if (open) {
      setName("");
      setEmail("");
      setPassword("");
      setRole("JUNIOR_AGENT");
      setPhone("");
      setActive(true);
    }
  }, [employee, open]);

  async function save() {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email required");
      return;
    }
    if (!employee && (!password || password.length < 6)) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const body: any = { name, email, role, phone, active };
      if (password) body.password = password;
      const url = employee
        ? `/api/agency/employees/${employee.id}`
        : "/api/agency/employees";
      const method = employee ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success(employee ? "Employee updated" : "Employee created");
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
            {employee ? "Edit Employee" : "New Employee"}
          </DialogTitle>
          <DialogDescription>
            Staff access is gated by role. Password is hashed with bcrypt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Full Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field
            label={employee ? "New Password (leave blank to keep)" : "Password"}
            required={!employee}
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label className="text-sm">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}{" "}
            {employee ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/* SETTINGS SECTION                                                   */
/* ================================================================== */

function SettingsSection() {
  return (
    <div className="space-y-4">
      <SectionTitle
        title="Agency Settings"
        subtitle="Quick links to other admin features."
        icon={Settings}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            icon: ClipboardList,
            title: "Catalog Manager",
            description: "Add, edit and remove experiences, hotels and destinations.",
            hint: "Go to Catalog tab",
          },
          {
            icon: Info,
            title: "AI Knowledge",
            description: "Customise the AI concierge persona, prompt and business info.",
            hint: "Go to AI Insights tab",
          },
          {
            icon: CreditCard,
            title: "Chat Logs",
            description: "Review customer conversations with the AI concierge.",
            hint: "Go to AI Chats tab",
          },
          {
            icon: Banknote,
            title: "Notifications",
            description: "Outgoing booking confirmation and review request emails.",
            hint: "Go to Notifications tab",
          },
        ].map((card) => (
          <Card key={card.title} className="rounded-xl transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon className="size-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{card.title}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.description}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gold">
                  {card.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border-gold/30 bg-gold/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="size-5 text-gold" />
          <div>
            <h4 className="font-semibold text-foreground">Role-based visibility</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use the <b>View as</b> selector at the top to switch between Admin,
              Senior Agent, Junior Agent and Accounts. Junior Agents do not see
              supplier net (cost) rates — only sell rates and totals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
