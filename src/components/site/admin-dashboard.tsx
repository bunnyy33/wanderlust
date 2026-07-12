"use client";

/**
 * Wanderlust — Admin Dashboard
 * A premium, luxury-styled admin console for the Wanderlust tourism platform.
 * Sections: Overview, Bookings, Catalog, Analytics, AI Insights.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  Eye,
  Hotel as HotelIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Plane,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import type { BookingT, ExperienceT, HotelT } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogManager } from "@/components/site/catalog-manager";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface KPIs {
  revenue: number;
  refunded: number;
  totalBookings: number;
  totalExperiences: number;
  totalHotels: number;
  totalDestinations: number;
  totalReviews: number;
  totalUsers: number;
  avgOrderValue: number;
}

interface RevenueTrendPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface RecentBooking {
  id: string;
  reference: string;
  type: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  title: string;
}

interface AdminStats {
  kpis: KPIs;
  revenueByType: { EXPERIENCE: number; HOTEL: number };
  statusBreakdown: {
    PENDING: number;
    SUPPLIER_CONFIRMED: number;
    CUSTOMER_CONFIRMED: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  revenueTrend: RevenueTrendPoint[];
  recentBookings: RecentBooking[];
}

type SectionId = "overview" | "bookings" | "catalog" | "analytics" | "ai" | "notifications" | "chats";

/* ------------------------------------------------------------------ */
/* Formatters                                                         */
/* ------------------------------------------------------------------ */

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyDetailed = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function fmtShortDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d");
  } catch {
    return iso;
  }
}

/* ------------------------------------------------------------------ */
/* Status helpers                                                     */
/* ------------------------------------------------------------------ */

function statusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-500 text-white border-transparent";
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
    case "REFUNDED":
      return "bg-orange-500 text-white border-transparent";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
        statusBadgeClass(status),
      )}
    >
      {status}
    </span>
  );
}

function paymentBadgeClass(paymentStatus: string): string {
  switch (paymentStatus) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900";
    case "REFUNDED":
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900";
    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function PaymentBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        paymentBadgeClass(status),
      )}
    >
      {status}
    </span>
  );
}

function bookingItemTitle(b: BookingT): string {
  return b.experience?.title || b.hotel?.name || "—";
}

function bookingDestination(b: BookingT): string {
  return (
    b.experience?.destination?.name ||
    b.hotel?.destination?.name ||
    "—"
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                         */
/* ------------------------------------------------------------------ */

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "catalog", label: "Catalog", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ai", label: "AI Insights", icon: Sparkles },
  { id: "chats", label: "AI Chats", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Mail },
];

/* ------------------------------------------------------------------ */
/* Shared small UI helpers                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Charts (custom div-based)                                          */
/* ------------------------------------------------------------------ */

function RevenueBarChart({
  data,
  height = 220,
}: {
  data: RevenueTrendPoint[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="w-full">
      <div
        className="flex items-end gap-2 sm:gap-3"
        style={{ height }}
      >
        {data.map((d) => {
          const h = Math.max(4, Math.round((d.revenue / max) * 100));
          return (
            <div
              key={d.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
            >
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
                <div className="font-semibold text-foreground">
                  {fmtShortDate(d.date)}
                </div>
                <div className="text-gold font-semibold">
                  {money.format(d.revenue)}
                </div>
                <div className="text-muted-foreground">
                  {d.bookings} booking{d.bookings === 1 ? "" : "s"}
                </div>
              </div>
              {/* track */}
              <div className="relative flex w-full max-w-[44px] flex-1 items-end overflow-hidden rounded-lg bg-primary/8">
                <div
                  className="gold-gradient w-full rounded-lg transition-all duration-500 ease-out"
                  style={{ height: `${h}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 sm:gap-3">
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {fmtShortDate(d.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusStackedBar({
  breakdown,
}: {
  breakdown: AdminStats["statusBreakdown"];
}) {
  const total =
    breakdown.PENDING +
    breakdown.SUPPLIER_CONFIRMED +
    breakdown.CUSTOMER_CONFIRMED +
    breakdown.CONFIRMED +
    breakdown.COMPLETED +
    breakdown.CANCELLED +
    breakdown.REFUNDED;
  const segments = [
    { label: "Pending", value: breakdown.PENDING, color: "bg-amber-500" },
    { label: "Supplier", value: breakdown.SUPPLIER_CONFIRMED, color: "bg-sky-600" },
    { label: "Customer", value: breakdown.CUSTOMER_CONFIRMED, color: "bg-teal-600" },
    { label: "Confirmed", value: breakdown.CONFIRMED, color: "bg-emerald-600" },
    { label: "Completed", value: breakdown.COMPLETED, color: "bg-primary" },
    { label: "Cancelled", value: breakdown.CANCELLED, color: "bg-destructive" },
    { label: "Refunded", value: breakdown.REFUNDED, color: "bg-orange-500" },
  ];
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map(
          (s) =>
            s.value > 0 && (
              <div
                key={s.label}
                className={cn("h-full transition-all", s.color)}
                style={{ width: `${(s.value / Math.max(1, total)) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ),
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", s.color)} />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-sm font-semibold text-foreground">
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevenueDonut({
  experience,
  hotel,
}: {
  experience: number;
  hotel: number;
}) {
  const total = Math.max(1, experience + hotel);
  const expPct = (experience / total) * 100;
  const hotelPct = 100 - expPct;
  // conic-gradient: gold then teal
  const gradient = `conic-gradient(var(--gold) 0% ${expPct}%, var(--primary) ${expPct}% 100%)`;
  return (
    <div className="flex items-center gap-6">
      <div
        className="relative size-32 shrink-0 rounded-full"
        style={{ background: gradient }}
      >
        <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-card shadow-inner">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <span className="text-sm font-bold text-foreground">
            {compactMoney.format(total)}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="size-2.5 rounded-full bg-gold" /> Experiences
            </span>
            <span className="text-gold font-semibold">
              {expPct.toFixed(0)}%
            </span>
          </div>
          <Progress value={expPct} className="h-2 bg-muted [&>[data-slot=progress-indicator]]:bg-gold" />
          <div className="mt-1 text-xs text-muted-foreground">
            {money.format(experience)}
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <span className="size-2.5 rounded-full bg-primary" /> Hotels
            </span>
            <span className="text-primary font-semibold">
              {hotelPct.toFixed(0)}%
            </span>
          </div>
          <Progress value={hotelPct} className="h-2 bg-muted" />
          <div className="mt-1 text-xs text-muted-foreground">
            {money.format(hotel)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "gold";
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            {label}
          </CardDescription>
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              accent === "gold"
                ? "bg-gold/15 text-gold"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-3xl",
            accent === "gold" && "gold-text",
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function AdminDashboard({
  onExit,
  onLogout,
}: {
  onExit?: () => void;
  onLogout?: () => void;
}) {
  const [section, setSection] = useState<SectionId>("overview");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onExit={onExit} onLogout={onLogout} />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <Sidebar section={section} setSection={setSection} onLogout={onLogout} />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {/* Mobile tab bar */}
          <MobileTabBar section={section} setSection={setSection} />

          {section === "overview" && <OverviewSection />}
          {section === "bookings" && <BookingsSection />}
          {section === "catalog" && <CatalogSection />}
          {section === "analytics" && <AnalyticsSection />}
          {section === "ai" && <AIInsightsSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "chats" && <ChatLogsSection />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function Header({
  onExit,
  onLogout,
}: {
  onExit?: () => void;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Plane className="size-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Wanderlust
            </span>
            <Badge className="border-gold/30 bg-gold/15 text-gold-foreground">
              <Crown className="size-3" />
              Admin Console
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">
              Live data
            </span>
          </div>
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              AD
            </AvatarFallback>
          </Avatar>
          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout} title="Sign out">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          )}
          {onExit && (
            <Button variant="outline" size="sm" onClick={onExit}>
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to Site</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar (desktop)                                                  */
/* ------------------------------------------------------------------ */

function Sidebar({
  section,
  setSection,
  onLogout,
}: {
  section: SectionId;
  setSection: (s: SectionId) => void;
  onLogout?: () => void;
}) {
  return (
    <nav className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col gap-2 border-r border-border/70 bg-card/40 p-4">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
      </p>
      {SECTIONS.map((s) => {
        const active = s.id === section;
        return (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/80 hover:bg-accent hover:text-foreground",
            )}
          >
            <s.icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                active ? "text-gold" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {s.label}
            {active && <span className="ml-auto size-1.5 rounded-full bg-gold" />}
          </button>
        );
      })}

      <Separator className="my-2" />

      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-gold" />
          <p className="text-sm font-semibold text-foreground">AI Concierge</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate insights and price predictions from your live booking data.
        </p>
        <Button
          size="sm"
          className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setSection("ai")}
        >
          Open AI Insights
        </Button>
      </div>

      {onLogout && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile tab bar                                                     */
/* ------------------------------------------------------------------ */

function MobileTabBar({
  section,
  setSection,
}: {
  section: SectionId;
  setSection: (s: SectionId) => void;
}) {
  return (
    <div className="md:hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {SECTIONS.map((s) => {
          const active = s.id === section;
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview Section                                                   */
/* ------------------------------------------------------------------ */

function OverviewSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = (await res.json()) as AdminStats;
      setStats(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load dashboard stats", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Overview"
          subtitle="Performance snapshot across the Wanderlust platform."
          icon={LayoutDashboard}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Overview"
          subtitle="Performance snapshot across the Wanderlust platform."
          icon={LayoutDashboard}
        />
        <ErrorState
          message={error ?? "No data available"}
          onRetry={load}
        />
      </div>
    );
  }

  const { kpis, revenueByType, statusBreakdown, revenueTrend, recentBookings } =
    stats;
  const totalRev =
    revenueByType.EXPERIENCE + revenueByType.HOTEL || kpis.revenue;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Overview"
        subtitle="Performance snapshot across the Wanderlust platform."
        icon={LayoutDashboard}
        action={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={money.format(kpis.revenue)}
          subtitle={`${money.format(kpis.refunded)} refunded`}
          icon={DollarSign}
          accent="gold"
        />
        <KpiCard
          label="Total Bookings"
          value={compactNumber.format(kpis.totalBookings)}
          subtitle={`${kpis.totalExperiences} experiences · ${kpis.totalHotels} hotels`}
          icon={CalendarCheck}
        />
        <KpiCard
          label="Avg Order Value"
          value={money.format(kpis.avgOrderValue)}
          subtitle={`${kpis.totalDestinations} destinations live`}
          icon={Wallet}
        />
        <KpiCard
          label="Active Users"
          value={compactNumber.format(kpis.totalUsers)}
          subtitle={`${kpis.totalReviews} reviews collected`}
          icon={Users}
        />
      </div>

      {/* Revenue Trend + Revenue by type */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-gold/30 text-gold-foreground"
              >
                <TrendingUp className="size-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={revenueTrend} />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Type</CardTitle>
            <CardDescription>Experiences vs Hotels</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueDonut
              experience={revenueByType.EXPERIENCE}
              hotel={revenueByType.HOTEL}
            />
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total net revenue</span>
              <span
                className="font-bold text-gold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {money.format(totalRev)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown + Recent bookings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Booking Status</CardTitle>
            <CardDescription>Breakdown of all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusStackedBar breakdown={statusBreakdown} />
          </CardContent>
        </Card>

        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Bookings</CardTitle>
                <CardDescription>Latest guest reservations</CardDescription>
              </div>
              <Badge variant="secondary">
                {recentBookings.length} recent
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-0">Reference</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Item
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-right pr-4 sm:pr-0">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="pl-4 sm:pl-0 font-mono text-xs font-medium text-primary">
                        {b.reference}
                      </TableCell>
                      <TableCell className="font-medium">
                        {b.customerName}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                        {b.title}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {money.format(b.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right pr-4 sm:pr-0 text-xs text-muted-foreground">
                        {fmtDate(b.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bookings Section                                                   */
/* ------------------------------------------------------------------ */

const STATUSES = [
  "ALL",
  "PENDING",
  "SUPPLIER_CONFIRMED",
  "CUSTOMER_CONFIRMED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;
const TYPES = ["ALL", "EXPERIENCE", "HOTEL"] as const;

/* ------------------------------------------------------------------ */
/* Fraud detail dialog                                                */
/* ------------------------------------------------------------------ */

function fraudScoreColor(score: number): string {
  if (score >= 50) return "bg-red-500 text-white";
  if (score >= 25) return "bg-amber-500 text-white";
  return "bg-emerald-500 text-white";
}

function fraudRiskLabel(score: number): { label: string; tone: string } {
  if (score >= 50) return { label: "High risk", tone: "text-red-600 dark:text-red-400" };
  if (score >= 25) return { label: "Medium risk", tone: "text-amber-600 dark:text-amber-400" };
  return { label: "Low risk", tone: "text-emerald-600 dark:text-emerald-400" };
}

function reviewBadgeClass(review: string): string {
  switch (review) {
    case "REAL":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "SPAM":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
    default:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  }
}

function FraudDetailDialog({
  booking,
  open,
  onOpenChange,
  onReview,
  loading,
}: {
  booking: BookingT | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onReview: (manualReview: "REAL" | "SPAM" | "PENDING") => void;
  loading: boolean;
}) {
  if (!booking) return null;
  const risk = fraudRiskLabel(booking.fraudScore);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                booking.isFlagged
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle style={{ fontFamily: "var(--font-display)" }}>
                Booking verification
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {booking.reference}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Item
            </p>
            <p className="text-sm font-semibold text-foreground">
              {bookingItemTitle(booking)}
            </p>
          </div>

          {/* Score badge */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                fraudScoreColor(booking.fraudScore),
              )}
            >
              {booking.fraudScore}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fraud score · 0-100
              </p>
              <p className={cn("text-sm font-bold", risk.tone)}>{risk.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {booking.isFlagged
                  ? "Flagged for manual review based on automated signals."
                  : "No critical fraud signals detected."}
              </p>
            </div>
          </div>

          {/* Customer info */}
          <div className="rounded-xl border border-border/60 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Customer
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium text-foreground">{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{booking.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium text-foreground">
                  {booking.customerPhone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* IP + UA */}
          <div className="space-y-2 rounded-xl border border-border/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Request metadata
            </p>
            <div>
              <p className="text-xs text-muted-foreground">IP address</p>
              <p className="font-mono text-xs text-foreground">
                {booking.ipAddress || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">User-agent</p>
              <p className="break-all font-mono text-[11px] leading-snug text-foreground">
                {booking.userAgent || "—"}
              </p>
            </div>
          </div>

          {/* Risk signals */}
          <div className="rounded-xl border border-border/60 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Risk signals ({booking.fraudSignals.length})
            </p>
            {booking.fraudSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fraud signals detected — looks clean.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {booking.fraudSignals.map((sig, i) => (
                  <li
                    key={`${sig}-${i}`}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    <span>{sig}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Manual review */}
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Manual review
              </p>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                  reviewBadgeClass(booking.manualReview),
                )}
              >
                {booking.manualReview}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || booking.manualReview === "REAL"}
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                onClick={() => onReview("REAL")}
              >
                <ShieldCheck className="size-3.5" /> Real
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || booking.manualReview === "SPAM"}
                className="border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                onClick={() => onReview("SPAM")}
              >
                <ShieldAlert className="size-3.5" /> Spam
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || booking.manualReview === "PENDING"}
                onClick={() => onReview("PENDING")}
              >
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            </div>
            {loading && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Updating…
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BookingsSection() {
  const [bookings, setBookings] = useState<BookingT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");

  const [fraudBooking, setFraudBooking] = useState<BookingT | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    booking: BookingT;
    action: "cancel" | "refund";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (type !== "ALL") params.set("type", type);
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "100");
      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = (await res.json()) as { bookings: BookingT[] };
      setBookings(data.bookings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load bookings", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [q, status, type]);

  // Filter changes trigger an immediate fetch (search uses a separate
  // debounced effect below). `load` is referenced intentionally without
  // being listed in deps to avoid double-fetching on every keystroke.
  useEffect(() => {
    void load();
  }, [status, type]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const patchBooking = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Action failed");
      }
      const data = (await res.json()) as { booking: BookingT };
      return data.booking;
    },
    [],
  );

  const handleProgress = useCallback(
    async (b: BookingT, action: string, label: string) => {
      try {
        setActionLoading(true);
        await patchBooking(b.id, { action });
        toast.success(`${label} — booking updated.`);
        await load();
      } catch (e) {
        toast.error(`Failed to update booking`, {
          description: e instanceof Error ? e.message : "",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [patchBooking, load],
  );

  const handleReview = useCallback(
    async (manualReview: "REAL" | "SPAM" | "PENDING") => {
      if (!fraudBooking) return;
      try {
        setActionLoading(true);
        const updated = await patchBooking(fraudBooking.id, {
          action: "review",
          manualReview,
        });
        setFraudBooking(updated);
        toast.success(`Marked as ${manualReview}.`);
        await load();
      } catch (e) {
        toast.error("Failed to update review", {
          description: e instanceof Error ? e.message : "",
        });
      } finally {
        setActionLoading(false);
      }
    },
    [fraudBooking, patchBooking, load],
  );

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction) return;
    const { booking, action } = pendingAction;
    try {
      setActionLoading(true);
      await patchBooking(booking.id, { action });
      toast.success(
        `${action === "cancel" ? "Cancelled" : "Refunded"} — booking updated.`,
      );
      await load();
    } catch (e) {
      toast.error(`Failed to ${action} booking`, {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }, [pendingAction, patchBooking, load]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Bookings"
        subtitle="Search, filter and review every reservation on the platform."
        icon={CalendarCheck}
        action={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Refine by status, type or search by reference, name or email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reference, name, email…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "ALL" ? "All types" : t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Bookings</CardTitle>
              <CardDescription>
                {loading
                  ? "Loading…"
                  : `${bookings.length} booking${bookings.length === 1 ? "" : "s"} found`}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {bookings.length} results
            </Badge>
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
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CalendarCheck className="size-8 text-muted-foreground" />
              <p className="font-medium text-foreground">No bookings found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6">Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="min-w-[180px]">Item</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Guests / Nights</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right pr-4 sm:pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => {
                    const cancellable =
                      b.status === "PENDING" ||
                      b.status === "SUPPLIER_CONFIRMED" ||
                      b.status === "CUSTOMER_CONFIRMED" ||
                      b.status === "CONFIRMED" ||
                      b.status === "COMPLETED";
                    const refundable =
                      b.status === "CONFIRMED" || b.status === "COMPLETED";
                    const isTerminal =
                      b.status === "CANCELLED" || b.status === "REFUNDED";
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="pl-4 sm:pl-6 font-mono text-xs font-semibold text-primary">
                          {b.reference}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {b.customerName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {b.customerEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              b.type === "EXPERIENCE"
                                ? "border-gold/30 text-gold-foreground"
                                : "border-primary/30 text-primary"
                            }
                          >
                            {b.type === "EXPERIENCE" ? (
                              <Plane className="size-3" />
                            ) : (
                              <HotelIcon className="size-3" />
                            )}
                            {b.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="flex flex-col">
                            <span className="max-w-[200px] truncate font-medium text-foreground">
                              {bookingItemTitle(b)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {bookingDestination(b)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {fmtDate(b.checkInDate)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="text-foreground">{b.guests}</span>
                          <span className="text-muted-foreground"> guests</span>
                          {b.nights > 0 && (
                            <>
                              <span className="text-muted-foreground"> · </span>
                              <span className="text-foreground">{b.nights}</span>
                              <span className="text-muted-foreground"> nights</span>
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {moneyDetailed.format(b.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={b.status} />
                        </TableCell>
                        <TableCell>
                          <PaymentBadge status={b.paymentStatus} />
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="relative h-8 w-8 p-0"
                              title="Inspect fraud details"
                              onClick={() => setFraudBooking(b)}
                            >
                              <Eye className="size-4" />
                              {b.isFlagged && (
                                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-destructive" />
                              )}
                            </Button>

                            {b.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={actionLoading}
                                className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={() =>
                                  handleProgress(
                                    b,
                                    "confirm-supplier",
                                    "Supplier confirmed",
                                  )
                                }
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span className="hidden lg:inline">Confirm Supplier</span>
                                <span className="lg:hidden">Supplier</span>
                              </Button>
                            )}
                            {b.status === "SUPPLIER_CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={actionLoading}
                                className="h-8 bg-sky-600 text-white hover:bg-sky-700"
                                onClick={() =>
                                  handleProgress(
                                    b,
                                    "confirm-customer",
                                    "Customer confirmed",
                                  )
                                }
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span className="hidden lg:inline">Confirm Customer</span>
                                <span className="lg:hidden">Customer</span>
                              </Button>
                            )}
                            {b.status === "CUSTOMER_CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="default"
                                disabled={actionLoading}
                                className="h-8 bg-amber-500 text-white hover:bg-amber-600"
                                onClick={() =>
                                  handleProgress(b, "confirm", "Booking confirmed")
                                }
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span className="hidden lg:inline">Confirm Booking</span>
                                <span className="lg:hidden">Confirm</span>
                              </Button>
                            )}

                            {cancellable && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading}
                                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                                title="Cancel booking"
                                onClick={() =>
                                  setPendingAction({ booking: b, action: "cancel" })
                                }
                              >
                                <XCircle className="size-3.5" />
                                <span className="hidden xl:inline">Cancel</span>
                              </Button>
                            )}
                            {refundable && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoading}
                                className="h-8 border-orange-500/30 text-orange-600 hover:bg-orange-500/10 dark:text-orange-400"
                                title="Refund booking"
                                onClick={() =>
                                  setPendingAction({ booking: b, action: "refund" })
                                }
                              >
                                <RotateCcw className="size-3.5" />
                                <span className="hidden xl:inline">Refund</span>
                              </Button>
                            )}
                            {isTerminal && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FraudDetailDialog
        booking={fraudBooking}
        open={!!fraudBooking}
        onOpenChange={(o) => !o && setFraudBooking(null)}
        onReview={handleReview}
        loading={actionLoading}
      />

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(o) => !o && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === "cancel"
                ? "Cancel this booking?"
                : "Refund this booking?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "cancel"
                ? `Booking ${pendingAction?.booking.reference} for ${pendingAction?.booking.customerName} will be cancelled. Availability will be restored. This action cannot be undone.`
                : `Booking ${pendingAction?.booking.reference} for ${pendingAction?.booking.customerName} will be marked as refunded. Availability will be restored. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmAction();
              }}
              className={cn(
                pendingAction?.action === "cancel"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-orange-500 text-white hover:bg-orange-600",
              )}
            >
              {actionLoading && <Loader2 className="size-4 animate-spin" />}
              {pendingAction?.action === "cancel"
                ? "Yes, cancel"
                : "Yes, refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Catalog Section                                                    */
/* ------------------------------------------------------------------ */

function CatalogSection() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Catalog"
        subtitle="Add, edit and remove experiences, hotels and destinations — no code required."
        icon={BookOpen}
      />
      <CatalogManager />
    </div>
  );
}

function ExperiencesTable() {
  const [items, setItems] = useState<ExperienceT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experiences?limit=0", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load experiences");
      const data = (await res.json()) as { experiences: ExperienceT[] };
      setItems(data.experiences);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load experiences", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Experiences</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${items.length} experiences live`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
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
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Experience</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right">Booked</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">Avail.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <div className="flex flex-col">
                        <span className="max-w-[260px] truncate font-medium text-foreground">
                          {e.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {e.duration} · {e.vendorName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        {e.destination?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gold/30 text-gold-foreground">
                        {e.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {money.format(e.price)}
                      </span>
                      {e.originalPrice && e.originalPrice > e.price && (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {money.format(e.originalPrice)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Star className="size-3.5 fill-gold text-gold" />
                        {e.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {compactNumber.format(e.reviewCount)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      {compactNumber.format(e.bookedCount)}
                    </TableCell>
                    <TableCell className="text-right pr-4 sm:pr-6 text-sm text-muted-foreground">
                      {e.availability}
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

function HotelsTable() {
  const [items, setItems] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hotels?limit=0", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load hotels");
      const data = (await res.json()) as { hotels: HotelT[] };
      setItems(data.hotels);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load hotels", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Hotels</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${items.length} hotels live`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
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
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Hotel</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Stars</TableHead>
                  <TableHead className="text-right">Price / night</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">Rooms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <div className="flex flex-col">
                        <span className="max-w-[260px] truncate font-medium text-foreground">
                          {h.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {h.roomTypes.length} room type
                          {h.roomTypes.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        {h.destination?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-0.5 text-gold">
                        {Array.from({ length: h.starRating }).map((_, i) => (
                          <Star key={i} className="size-3 fill-current" />
                        ))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {money.format(h.pricePerNight)}
                      </span>
                      {h.originalPrice && h.originalPrice > h.pricePerNight && (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          {money.format(h.originalPrice)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm font-medium">
                        <Star className="size-3.5 fill-gold text-gold" />
                        {h.rating.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {compactNumber.format(h.reviewCount)}
                    </TableCell>
                    <TableCell className="text-right pr-4 sm:pr-6 text-sm text-muted-foreground">
                      {h.roomTypes.length}
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

/* ------------------------------------------------------------------ */
/* Analytics Section                                                  */
/* ------------------------------------------------------------------ */

function AnalyticsSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<BookingT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/bookings?limit=100", { cache: "no-store" }),
      ]);
      if (!statsRes.ok || !bookingsRes.ok) throw new Error("Failed to load analytics");
      const statsData = (await statsRes.json()) as AdminStats;
      const bookingsData = (await bookingsRes.json()) as { bookings: BookingT[] };
      setStats(statsData);
      setBookings(bookingsData.bookings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load analytics", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Top destinations derived from bookings
  const topDestinations = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const b of bookings) {
      const dest = bookingDestination(b);
      if (!dest || dest === "—") continue;
      const cur = map.get(dest) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += b.status !== "CANCELLED" ? b.totalAmount : 0;
      map.set(dest, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [bookings]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Analytics"
          subtitle="Deep dive into revenue, status and destination performance."
          icon={BarChart3}
        />
        <Skeleton className="h-96 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <SectionTitle
          title="Analytics"
          subtitle="Deep dive into revenue, status and destination performance."
          icon={BarChart3}
        />
        <ErrorState message={error ?? "No data available"} onRetry={load} />
      </div>
    );
  }

  const totalRev = stats.revenueByType.EXPERIENCE + stats.revenueByType.HOTEL || stats.kpis.revenue;
  const maxDestRevenue = Math.max(1, ...topDestinations.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Analytics"
        subtitle="Deep dive into revenue, status and destination performance."
        icon={BarChart3}
        action={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat
          label="Net Revenue"
          value={money.format(stats.kpis.revenue)}
          icon={DollarSign}
          accent="gold"
        />
        <MiniStat
          label="Bookings"
          value={compactNumber.format(stats.kpis.totalBookings)}
          icon={CalendarCheck}
        />
        <MiniStat
          label="Avg Order"
          value={money.format(stats.kpis.avgOrderValue)}
          icon={Wallet}
        />
        <MiniStat
          label="Refunded"
          value={money.format(stats.kpis.refunded)}
          icon={RotateCcw}
          tone="muted"
        />
      </div>

      {/* Bigger revenue trend */}
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue — Last 7 Days</CardTitle>
              <CardDescription>
                Daily revenue across all confirmed and completed bookings
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-gold/30 text-gold-foreground">
              <Activity className="size-3" /> Trending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueBarChart data={stats.revenueTrend} height={280} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue by type donut */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Type</CardTitle>
            <CardDescription>Experiences vs Hotels share</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueDonut
              experience={stats.revenueByType.EXPERIENCE}
              hotel={stats.revenueByType.HOTEL}
            />
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Combined total</span>
              <span
                className="font-bold gold-text"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {money.format(totalRev)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of all {stats.kpis.totalBookings} bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusStackedBar breakdown={stats.statusBreakdown} />
            <Separator />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatusMini
                icon={Clock}
                label="Pending"
                value={stats.statusBreakdown.PENDING}
                tone="amber"
              />
              <StatusMini
                icon={CheckCircle2}
                label="Supplier"
                value={stats.statusBreakdown.SUPPLIER_CONFIRMED}
                tone="primary"
              />
              <StatusMini
                icon={CheckCircle2}
                label="Customer"
                value={stats.statusBreakdown.CUSTOMER_CONFIRMED}
                tone="emerald"
              />
              <StatusMini
                icon={CheckCircle2}
                label="Confirmed"
                value={stats.statusBreakdown.CONFIRMED}
                tone="emerald"
              />
              <StatusMini
                icon={CheckCircle2}
                label="Completed"
                value={stats.statusBreakdown.COMPLETED}
                tone="primary"
              />
              <StatusMini
                icon={XCircle}
                label="Cancelled"
                value={stats.statusBreakdown.CANCELLED}
                tone="destructive"
              />
              <StatusMini
                icon={RotateCcw}
                label="Refunded"
                value={stats.statusBreakdown.REFUNDED}
                tone="amber"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top destinations */}
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Top Destinations</CardTitle>
              <CardDescription>
                By revenue · derived from latest 100 bookings
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {topDestinations.length} destinations
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topDestinations.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No destination data available yet.
            </p>
          ) : (
            topDestinations.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    i === 0
                      ? "bg-gold text-gold-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      {d.name}
                    </span>
                    <span className="font-semibold text-foreground">
                      {money.format(d.revenue)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="gold-gradient h-full rounded-full transition-all"
                      style={{
                        width: `${(d.revenue / maxDestRevenue) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {d.count} booking{d.count === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = "default",
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "gold";
  tone?: "default" | "muted";
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent === "gold"
              ? "bg-gold/15 text-gold"
              : tone === "muted"
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div
            className={cn(
              "truncate text-lg font-bold tracking-tight sm:text-xl",
              accent === "gold" && "gold-text",
            )}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusMini({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "primary" | "emerald" | "destructive" | "amber" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    destructive: "bg-destructive/10 text-destructive",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          toneClass,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-sm font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Insights Section                                                */
/* ------------------------------------------------------------------ */

const STATIC_PRICE_PREDICTIONS = [
  {
    title: "Dubai Hot Air Balloon",
    destination: "Dubai, UAE",
    signal: "Demand rising",
    detail:
      "Bookings up 38% week-over-week. Consider raising price by 8–12% over the next 14 days.",
    trend: "up" as const,
    confidence: 87,
  },
  {
    title: "Maldives Overwater Villa",
    destination: "Maldives",
    signal: "Stable — high margin",
    detail:
      "Consistent luxury demand. Maintain current pricing; bundle with a sunset cruise to lift AOV.",
    trend: "flat" as const,
    confidence: 74,
  },
  {
    title: "Santorini Caldera Cruise",
    destination: "Santorini, Greece",
    signal: "Cooling slightly",
    detail:
      "3 cancellations this week. Offer a 10% early-bird discount for bookings 30+ days out.",
    trend: "down" as const,
    confidence: 62,
  },
];

function AIInsightsSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = (await res.json()) as AdminStats;
      setStats(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error("Could not load KPIs for AI context", { description: msg });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const generateInsights = useCallback(async () => {
    if (!stats) {
      toast.error("KPIs not loaded yet — please wait.");
      return;
    }
    setLoadingAI(true);
    setAIError(null);
    setReply(null);
    try {
      const k = stats.kpis;
      const prompt = `You are the Wanderlust AI business analyst reviewing the admin dashboard. Here is the current snapshot:

- Total revenue: ${money.format(k.revenue)} (refunded: ${money.format(k.refunded)})
- Total bookings: ${k.totalBookings}
- Average order value: ${money.format(k.avgOrderValue)}
- Active users: ${k.totalUsers}
- Catalog: ${k.totalExperiences} experiences, ${k.totalHotels} hotels across ${k.totalDestinations} destinations
- Reviews collected: ${k.totalReviews}
- Revenue by type: Experiences ${money.format(stats.revenueByType.EXPERIENCE)} (${((stats.revenueByType.EXPERIENCE / Math.max(1, stats.revenueByType.EXPERIENCE + stats.revenueByType.HOTEL)) * 100).toFixed(0)}%), Hotels ${money.format(stats.revenueByType.HOTEL)} (${((stats.revenueByType.HOTEL / Math.max(1, stats.revenueByType.EXPERIENCE + stats.revenueByType.HOTEL)) * 100).toFixed(0)}%)
- Status breakdown: Pending ${stats.statusBreakdown.PENDING}, Supplier-confirmed ${stats.statusBreakdown.SUPPLIER_CONFIRMED}, Customer-confirmed ${stats.statusBreakdown.CUSTOMER_CONFIRMED}, Confirmed ${stats.statusBreakdown.CONFIRMED}, Completed ${stats.statusBreakdown.COMPLETED}, Cancelled ${stats.statusBreakdown.CANCELLED}, Refunded ${stats.statusBreakdown.REFUNDED}
- Last 7 days revenue trend: ${stats.revenueTrend.map((d) => `${d.date.slice(5)}: ${money.format(d.revenue)} (${d.bookings} bookings)`).join("; ")}

Based on this data, provide:
1. Exactly 3 to 4 actionable business insights (each a short bullet with a clear recommendation).
2. One notable trend worth watching (a single short paragraph).

Be specific, quantitative where possible, and concise. Use clean markdown bullets.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `AI request failed (${res.status})`);
      }
      const data = (await res.json()) as { reply: string };
      setReply(data.reply || "No insights were returned.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setAIError(msg);
      toast.error("AI insights unavailable", { description: msg });
    } finally {
      setLoadingAI(false);
    }
  }, [stats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // Auto-generate once stats are ready (but only on the first successful
  // stats load, never after an error to avoid infinite retry loops).
  useEffect(() => {
    if (stats && !reply && !loadingAI && !aiError) {
      void generateInsights();
    }
  }, [stats, reply, loadingAI, aiError, generateInsights]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="AI Insights"
        subtitle="GPT-powered analysis of your live performance, plus price predictions."
        icon={Sparkles}
        action={
          <Button
            variant="default"
            size="sm"
            onClick={generateInsights}
            disabled={loadingAI || loadingStats}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loadingAI ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Regenerate insights
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* AI Insight Panel */}
        <Card className="rounded-xl lg:col-span-2 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-primary to-gold" />
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Business Insights
                  </CardTitle>
                  <CardDescription>
                    Generated from live KPIs and 7-day trend
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gold/30 text-gold-foreground"
              >
                <Sparkle className="size-3" />
                AI-generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : loadingAI ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="relative">
                  <div className="size-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  <Sparkles className="absolute inset-0 m-auto size-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Analyzing your data…
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The AI concierge is reviewing KPIs and trends.
                  </p>
                </div>
              </div>
            ) : aiError ? (
              <ErrorState message={aiError} onRetry={generateInsights} />
            ) : reply ? (
              <div className="prose prose-sm max-w-none rounded-xl border border-border/60 bg-muted/30 p-4 leading-relaxed text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {reply}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Click "Regenerate insights" to analyze your data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Price Prediction demo card */}
        <Card className="rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                  <TrendingUp className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Price Predictions
                  </CardTitle>
                  <CardDescription>Demand signals by product</CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-gold/30 text-gold-foreground"
              >
                <Sparkle className="size-3" />
                AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATIC_PRICE_PREDICTIONS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-border/60 p-3 transition-colors hover:border-gold/40 hover:bg-gold/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.title}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {p.destination}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      p.trend === "up" &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      p.trend === "flat" &&
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      p.trend === "down" &&
                        "bg-destructive/10 text-destructive",
                    )}
                  >
                    {p.trend === "up" && <ArrowUpRight className="size-3" />}
                    {p.trend === "flat" && <Activity className="size-3" />}
                    {p.trend === "down" && <RotateCcw className="size-3" />}
                    {p.signal}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {p.detail}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Confidence
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="gold-gradient h-full rounded-full"
                      style={{ width: `${p.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gold">
                    {p.confidence}%
                  </span>
                </div>
              </div>
            ))}
            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              Demo predictions for illustration. AI-generated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications (email log)                                          */
/* ------------------------------------------------------------------ */

interface EmailItem {
  id: string;
  toEmail: string;
  subject: string;
  type: string;
  status: string;
  relatedRef: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* AI Chat Logs                                                       */
/* ------------------------------------------------------------------ */

interface ChatLogItem {
  id: string;
  sessionId: string;
  userMessage: string;
  aiReply: string;
  ipAddress: string | null;
  createdAt: string;
}

function AiKnowledgePanel() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");
  const [persona, setPersona] = useState("Wanderlust Concierge");
  const [plannerPrompt, setPlannerPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      if (!res.ok) throw new Error();
      const { settings } = await res.json();
      setSystemPrompt(settings.systemPrompt || "");
      setBusinessInfo(settings.businessInfo || "");
      setPersona(settings.persona || "Wanderlust Concierge");
      setPlannerPrompt(settings.plannerPrompt || "");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, businessInfo, persona, plannerPrompt }),
      });
      if (!res.ok) throw new Error();
      toast.success("Knowledge updated — applies to new chats & trip plans immediately.");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Concierge Knowledge & Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <>
            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Concierge display name
              </Label>
              <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="Wanderlust Concierge" />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Business knowledge & FAQs
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Add policies, hours, contact info, discount rules, FAQ answers — anything the concierge should know. This is sent to the AI with every conversation.
              </p>
              <Textarea
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
                placeholder={"Example:\n- Business hours: 9 AM - 9 PM GST, 7 days a week\n- Group discount: 10% off for groups of 8+\n- WhatsApp: +971 50 123 4567\n- Refund policy: Full refund up to 24h before for flexible tours, no refund for park tickets\n- We do NOT offer flights — only tours, hotels and transfers\n- For large group bookings, direct them to the inquiry form"}
                className="min-h-[140px] resize-y font-mono text-xs"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Extra instructions (advanced)
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Custom rules the concierge must follow. E.g. "Always mention the group discount" or "Don't discuss specific hotel room availability."
              </p>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={"Example:\n- Always mention our price-match guarantee when discussing pricing\n- If someone asks about Dubai Marina, recommend the yacht tour specifically\n- Never promise specific hotel room numbers"}
                className="min-h-[100px] resize-y font-mono text-xs"
              />
            </div>

            <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
              <Label className="mb-1.5 block text-xs font-medium text-foreground">
                Trip Planner instructions
              </Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Custom rules for the "Plan my trip" feature on the homepage. Control how itineraries are built — budget buffer, must-include tours, hotel preferences, pacing, etc.
              </p>
              <Textarea
                value={plannerPrompt}
                onChange={(e) => setPlannerPrompt(e.target.value)}
                placeholder={"Example:\n- Always include a desert safari on day 1 for Dubai trips\n- Add a 15% buffer to the budget estimate for taxes and extras\n- Prefer 5-star hotels from our catalog\n- Keep day 1 light (arrival day) — suggest only an evening activity\n- For family trips, include at least one kid-friendly activity per day\n- Recommend airport transfer for the first and last day\n- Maximum 2 activities per day to keep it relaxed"}
                className="min-h-[140px] resize-y font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Changes apply to new conversations immediately.</p>
              <Button onClick={save} disabled={saving} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? <><Loader2 className="size-3.5 animate-spin" /> Saving…</> : <>Save knowledge</>}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChatLogsSection() {
  const [chats, setChats] = useState<ChatLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/chats?limit=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChats(data.chats);
    } catch {
      toast.error("Failed to load chat logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Concierge & Chat"
        subtitle="Customize your concierge's knowledge and review customer conversations."
        icon={MessageSquare}
      />

      <AiKnowledgePanel />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total conversations" value={chats.length} icon={<MessageSquare className="size-5 text-gold" />} />
        <StatCard label="Unique sessions" value={new Set(chats.map((c) => c.sessionId)).size} icon={<Users className="size-5 text-gold" />} />
        <StatCard label="Most recent" value={chats[0] ? format(new Date(chats[0].createdAt), "MMM d, h:mm a") : "—"} icon={<Clock className="size-5 text-gold" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Chat logs</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MessageSquare className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium">No chats yet</p>
              <p className="text-xs text-muted-foreground">Customer AI conversations will appear here.</p>
            </div>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto">
              {chats.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">{c.sessionId.slice(0, 16)}…</span>
                    <span className="text-[11px] text-muted-foreground">{format(new Date(c.createdAt), "MMM d, h:mm a")}{c.ipAddress && ` · ${c.ipAddress}`}</span>
                  </div>
                  <div className="mb-2 rounded-lg bg-primary/5 p-2.5">
                    <span className="text-[10px] font-semibold uppercase text-primary">Customer</span>
                    <p className="text-sm">{c.userMessage}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-2.5">
                    <span className="text-[10px] font-semibold uppercase text-gold">AI reply</span>
                    <p className="whitespace-pre-wrap text-sm text-foreground/80">{c.aiReply}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/emails?limit=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmails(data.emails);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = emails.filter(
    (e) => filter === "ALL" || e.type === filter,
  );

  const counts = {
    BOOKING_CONFIRMATION: emails.filter((e) => e.type === "BOOKING_CONFIRMATION").length,
    MANUAL: emails.filter((e) => e.type === "MANUAL").length,
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Notifications & Emails"
        subtitle="Every booking confirmation and system email, logged here. Configure SMTP env vars (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM) to deliver real emails."
        icon={Mail}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total emails" value={emails.length} icon={<Mail className="size-5 text-gold" />} />
        <StatCard label="Booking confirmations" value={counts.BOOKING_CONFIRMATION} icon={<CalendarCheck className="size-5 text-gold" />} />
        <StatCard label="Delivery" value={emails.length ? "Logged ✓" : "—"} icon={<CheckCircle2 className="size-5 text-gold" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-semibold">Email log</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
            >
              <option value="ALL">All types</option>
              <option value="BOOKING_CONFIRMATION">Confirmations</option>
              <option value="MANUAL">Manual</option>
            </select>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Mail className="size-8 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-medium">No emails yet</p>
              <p className="text-xs text-muted-foreground">
                Confirmation emails appear here after the first booking.
              </p>
            </div>
          ) : (
            <div className="max-h-[560px] space-y-2 overflow-y-auto">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card/60 p-3.5"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                    <Mail className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {e.subject}
                      </p>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      >
                        {e.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      To: {e.toEmail}
                      {e.relatedRef && <span> · Ref: {e.relatedRef}</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {format(new Date(e.createdAt), "MMM d, yyyy · h:mm a")} · {e.type.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
            {value}
          </p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
