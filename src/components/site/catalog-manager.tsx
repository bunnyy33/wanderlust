"use client";

/**
 * Wanderlust — Catalog Manager (admin)
 * Full no-code CRUD for experiences, hotels and destinations.
 * Includes an AI content generator for experience descriptions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Globe2,
  Hotel as HotelIcon,
  Loader2,
  MapPin,
  Pencil,
  Plane,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import type {
  DestinationT,
  ExperienceT,
  ExperienceType,
  HotelT,
  RoomTypeT,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageUploader } from "@/components/site/image-uploader";

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
  DialogClose,
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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const EXPERIENCE_TYPES: ExperienceType[] = [
  "TOUR",
  "ACTIVITY",
  "ADVENTURE",
  "CRUISE",
  "ATTRACTION",
  "TRANSFER",
];

/* ===================================================================== */
/* Shared helpers                                                        */
/* ===================================================================== */

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

function linesToArray(v: string): string[] {
  return v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function arrayToLines(arr: string[] | null | undefined): string {
  return (arr ?? []).join("\n");
}

function roomTypesToString(rts: RoomTypeT[] | null | undefined): string {
  return (rts ?? [])
    .map(
      (r) =>
        `${r.name} | ${r.description} | ${r.maxGuests} | ${r.priceModifier}`,
    )
    .join("\n");
}

function stringToRoomTypes(v: string): RoomTypeT[] {
  return linesToArray(v).map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    return {
      name: parts[0] ?? "",
      description: parts[1] ?? "",
      maxGuests: Number(parts[2] ?? 2) || 2,
      priceModifier: Number(parts[3] ?? 0) || 0,
    };
  });
}

/* ===================================================================== */
/* Destination loader (shared hook)                                     */
/* ===================================================================== */

function useDestinations() {
  const [destinations, setDestinations] = useState<DestinationT[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/destinations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load destinations");
      const data = (await res.json()) as { destinations: DestinationT[] };
      setDestinations(data.destinations);
    } catch {
      setDestinations([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { destinations, loaded, reload: load };
}

function destName(dests: DestinationT[], id: string | undefined | null): string {
  if (!id) return "—";
  return dests.find((d) => d.id === id)?.name ?? "—";
}

/* ===================================================================== */
/* Main component                                                        */
/* ===================================================================== */

export function CatalogManager() {
  return (
    <Tabs defaultValue="experiences" className="w-full">
      <TabsList className="h-10">
        <TabsTrigger value="experiences" className="px-4">
          <Plane className="size-3.5" /> Experiences
        </TabsTrigger>
        <TabsTrigger value="hotels" className="px-4">
          <HotelIcon className="size-3.5" /> Hotels
        </TabsTrigger>
        <TabsTrigger value="destinations" className="px-4">
          <Globe2 className="size-3.5" /> Destinations
        </TabsTrigger>
      </TabsList>
      <TabsContent value="experiences">
        <ExperiencesManager />
      </TabsContent>
      <TabsContent value="hotels">
        <HotelsManager />
      </TabsContent>
      <TabsContent value="destinations">
        <DestinationsManager />
      </TabsContent>
    </Tabs>
  );
}

export default CatalogManager;

/* ===================================================================== */
/* Experiences                                                           */
/* ===================================================================== */

interface ExperienceForm {
  title: string;
  type: ExperienceType;
  destinationId: string;
  price: string;
  originalPrice: string;
  duration: string;
  durationHours: string;
  groupSize: string;
  availability: string;
  description: string;
  longDescription: string;
  images: string;
  highlights: string;
  includes: string;
  excludes: string;
  vendorName: string;
  featured: boolean;
  bestseller: boolean;
}

function emptyExperienceForm(): ExperienceForm {
  return {
    title: "",
    type: "TOUR",
    destinationId: "",
    price: "",
    originalPrice: "",
    duration: "",
    durationHours: "4",
    groupSize: "12",
    availability: "20",
    description: "",
    longDescription: "",
    images: "",
    highlights: "",
    includes: "",
    excludes: "",
    vendorName: "Wanderlust Verified Partner",
    featured: false,
    bestseller: false,
  };
}

function experienceToForm(e: ExperienceT): ExperienceForm {
  return {
    title: e.title,
    type: e.type,
    destinationId: e.destinationId,
    price: String(e.price ?? ""),
    originalPrice: e.originalPrice ? String(e.originalPrice) : "",
    duration: e.duration,
    durationHours: String(e.durationHours ?? 4),
    groupSize: String(e.groupSize ?? 12),
    availability: String(e.availability ?? 20),
    description: e.description,
    longDescription: e.longDescription,
    images: arrayToLines(e.images),
    highlights: arrayToLines(e.highlights),
    includes: arrayToLines(e.includes),
    excludes: arrayToLines(e.excludes),
    vendorName: e.vendorName,
    featured: e.featured,
    bestseller: e.bestseller,
  };
}

function experienceFormToPayload(f: ExperienceForm) {
  return {
    title: f.title.trim(),
    type: f.type,
    destinationId: f.destinationId,
    price: Number(f.price) || 0,
    originalPrice: f.originalPrice ? Number(f.originalPrice) : null,
    duration: f.duration.trim(),
    durationHours: Number(f.durationHours) || 4,
    groupSize: Number(f.groupSize) || 12,
    availability: Number(f.availability) || 20,
    description: f.description.trim(),
    longDescription: f.longDescription.trim(),
    images: linesToArray(f.images),
    highlights: linesToArray(f.highlights),
    includes: linesToArray(f.includes),
    excludes: linesToArray(f.excludes),
    vendorName: f.vendorName.trim() || "Wanderlust Verified Partner",
    featured: f.featured,
    bestseller: f.bestseller,
  };
}

interface AIContent {
  longDescription: string;
  highlights: string[];
  seoTitle: string;
  faqs: { q: string; a: string }[];
}

function ExperiencesManager() {
  const [items, setItems] = useState<ExperienceT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExperienceT | null>(null);
  const [form, setForm] = useState<ExperienceForm>(emptyExperienceForm());
  const [saving, setSaving] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState<AIContent | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ExperienceT | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { destinations } = useDestinations();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/experiences?limit=0", {
        cache: "no-store",
      });
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

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.destination?.name?.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.vendorName.toLowerCase().includes(q),
    );
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(
      destinations[0]
        ? { ...emptyExperienceForm(), destinationId: destinations[0].id }
        : emptyExperienceForm(),
    );
    setAiContent(null);
    setDialogOpen(true);
  };

  const openEdit = (e: ExperienceT) => {
    setEditing(e);
    setForm(experienceToForm(e));
    setAiContent(null);
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.destinationId) {
      toast.error("Please select a destination");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Short description is required");
      return;
    }
    setSaving(true);
    try {
      const payload = experienceFormToPayload(form);
      const url = editing
        ? `/api/admin/experiences/${editing.id}`
        : "/api/admin/experiences";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save experience");
      }
      toast.success(
        editing ? "Experience updated" : "Experience created",
        { description: form.title },
      );
      setDialogOpen(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/experiences/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Experience deleted", {
        description: deleteTarget.title,
      });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  const generateAI = async () => {
    if (!form.title.trim() || !form.destinationId) {
      toast.error("Fill in title and destination first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          destination: destName(destinations, form.destinationId),
          type: form.type,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI request failed");
      }
      const data = (await res.json()) as AIContent;
      setAiContent(data);
      setForm((f) => ({
        ...f,
        longDescription:
          data.longDescription || f.longDescription,
        highlights:
          (data.highlights && data.highlights.length > 0
            ? data.highlights
            : linesToArray(f.highlights)
          ).join("\n"),
      }));
      toast.success("AI content generated", {
        description: "longDescription & highlights filled",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("AI generation failed", { description: msg });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Experiences</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${items.length} experiences live`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search experiences…"
                className="h-9 w-full pl-8 sm:w-56"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                className={cn("size-4", loading && "animate-spin")}
              />{" "}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Plus className="size-4" /> Add new
            </Button>
          </div>
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
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No experiences yet. Click “Add new” to create one."
              : "No experiences match your search."}
          </div>
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
                  <TableHead className="text-right">Booked</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <div className="flex flex-col">
                        <span className="max-w-[260px] truncate font-medium text-foreground">
                          {e.title}
                          {e.featured && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-gold/40 text-gold-foreground"
                            >
                              Featured
                            </Badge>
                          )}
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
                      <Badge
                        variant="outline"
                        className="border-gold/30 text-gold-foreground"
                      >
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
                    <TableCell className="text-right text-sm font-semibold text-primary">
                      {compactNumber.format(e.bookedCount)}
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(e)}
                          aria-label="Edit experience"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(e)}
                          aria-label="Delete experience"
                        >
                          <Trash2 className="size-3.5" />
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

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {editing ? "Edit experience" : "New experience"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details below. Changes go live immediately."
                : "Fill in the details to publish a new experience to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" required>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Sunrise Hot Air Balloon"
                />
              </Field>
              <Field label="Type" required>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as ExperienceType }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Destination" required>
              <Select
                value={form.destinationId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, destinationId: v }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {d.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Price (USD)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="199"
                />
              </Field>
              <Field label="Original price">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originalPrice: e.target.value }))
                  }
                  placeholder="249"
                />
              </Field>
              <Field label="Duration">
                <Input
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  placeholder="4 hours"
                />
              </Field>
              <Field label="Duration (hrs)">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.durationHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationHours: e.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Group size">
                <Input
                  type="number"
                  min="1"
                  value={form.groupSize}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, groupSize: e.target.value }))
                  }
                />
              </Field>
              <Field label="Availability">
                <Input
                  type="number"
                  min="0"
                  value={form.availability}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availability: e.target.value }))
                  }
                />
              </Field>
              <Field label="Vendor name">
                <Input
                  value={form.vendorName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendorName: e.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Short description" required>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="One-line summary shown on cards."
              />
            </Field>

            <Field
              label="Long description"
              right={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateAI}
                  disabled={
                    aiLoading ||
                    !form.title.trim() ||
                    !form.destinationId
                  }
                  className="h-7 border-gold/40 text-gold-foreground hover:bg-gold/10"
                >
                  {aiLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Generate with AI
                </Button>
              }
            >
              <Textarea
                value={form.longDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, longDescription: e.target.value }))
                }
                rows={5}
                placeholder="2-3 paragraphs of rich, evocative copy."
              />
            </Field>

            {aiContent && (aiContent.seoTitle || aiContent.faqs.length > 0) && (
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gold-foreground">
                  <Sparkles className="size-4" /> AI suggestions
                </div>
                {aiContent.seoTitle && (
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">SEO title:</span>{" "}
                    {aiContent.seoTitle}
                  </p>
                )}
                {aiContent.faqs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {aiContent.faqs.map((faq, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-foreground">{faq.q}</p>
                        <p className="text-muted-foreground">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Field
              label="Images"
              hint="Upload from computer or paste URLs"
            >
              <ImageUploader
                value={form.images}
                onChange={(v) => setForm((f) => ({ ...f, images: v }))}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Highlights" hint="One per line">
                <Textarea
                  value={form.highlights}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, highlights: e.target.value }))
                  }
                  rows={4}
                />
              </Field>
              <Field label="Includes" hint="One per line">
                <Textarea
                  value={form.includes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, includes: e.target.value }))
                  }
                  rows={4}
                />
              </Field>
              <Field label="Excludes" hint="One per line">
                <Textarea
                  value={form.excludes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, excludes: e.target.value }))
                  }
                  rows={4}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <SwitchField
                label="Featured"
                description="Show in featured section"
                checked={form.featured}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, featured: v }))
                }
              />
              <SwitchField
                label="Bestseller"
                description="Mark as bestseller"
                checked={form.bestseller}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, bestseller: v }))
                }
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {editing ? "Save changes" : "Create experience"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete experience?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                “{deleteTarget?.title}”
              </span>
              . Existing bookings referencing this experience will remain in
              the ledger. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ===================================================================== */
/* Hotels                                                                */
/* ===================================================================== */

interface HotelForm {
  name: string;
  destinationId: string;
  starRating: string;
  pricePerNight: string;
  originalPrice: string;
  description: string;
  longDescription: string;
  images: string;
  amenities: string;
  address: string;
  roomTypes: string;
  featured: boolean;
}

function emptyHotelForm(): HotelForm {
  return {
    name: "",
    destinationId: "",
    starRating: "5",
    pricePerNight: "",
    originalPrice: "",
    description: "",
    longDescription: "",
    images: "",
    amenities: "",
    address: "",
    roomTypes: "",
    featured: false,
  };
}

function hotelToForm(h: HotelT): HotelForm {
  return {
    name: h.name,
    destinationId: h.destinationId,
    starRating: String(h.starRating ?? 5),
    pricePerNight: String(h.pricePerNight ?? ""),
    originalPrice: h.originalPrice ? String(h.originalPrice) : "",
    description: h.description,
    longDescription: h.longDescription,
    images: arrayToLines(h.images),
    amenities: arrayToLines(h.amenities),
    address: h.address ?? "",
    roomTypes: roomTypesToString(h.roomTypes),
    featured: h.featured,
  };
}

function hotelFormToPayload(f: HotelForm) {
  return {
    name: f.name.trim(),
    destinationId: f.destinationId,
    starRating: Number(f.starRating) || 5,
    pricePerNight: Number(f.pricePerNight) || 0,
    originalPrice: f.originalPrice ? Number(f.originalPrice) : null,
    description: f.description.trim(),
    longDescription: f.longDescription.trim(),
    images: linesToArray(f.images),
    amenities: linesToArray(f.amenities),
    address: f.address.trim() || null,
    roomTypes: stringToRoomTypes(f.roomTypes),
    featured: f.featured,
  };
}

function HotelsManager() {
  const [items, setItems] = useState<HotelT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HotelT | null>(null);
  const [form, setForm] = useState<HotelForm>(emptyHotelForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<HotelT | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { destinations } = useDestinations();

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

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.destination?.name?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(
      destinations[0]
        ? { ...emptyHotelForm(), destinationId: destinations[0].id }
        : emptyHotelForm(),
    );
    setDialogOpen(true);
  };

  const openEdit = (h: HotelT) => {
    setEditing(h);
    setForm(hotelToForm(h));
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Hotel name is required");
      return;
    }
    if (!form.destinationId) {
      toast.error("Please select a destination");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    setSaving(true);
    try {
      const payload = hotelFormToPayload(form);
      const url = editing
        ? `/api/admin/hotels/${editing.id}`
        : "/api/admin/hotels";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save hotel");
      }
      toast.success(editing ? "Hotel updated" : "Hotel created", {
        description: form.name,
      });
      setDialogOpen(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hotels/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Hotel deleted", { description: deleteTarget.name });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Delete failed", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Hotels</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${items.length} hotels live`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hotels…"
                className="h-9 w-full pl-8 sm:w-56"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                className={cn("size-4", loading && "animate-spin")}
              />{" "}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Plus className="size-4" /> Add new
            </Button>
          </div>
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
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No hotels yet. Click “Add new” to create one."
              : "No hotels match your search."}
          </div>
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
                  <TableHead className="text-right">Rooms</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <div className="flex flex-col">
                        <span className="max-w-[260px] truncate font-medium text-foreground">
                          {h.name}
                          {h.featured && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-gold/40 text-gold-foreground"
                            >
                              Featured
                            </Badge>
                          )}
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
                      {h.originalPrice &&
                        h.originalPrice > h.pricePerNight && (
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
                      {h.roomTypes.length}
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(h)}
                          aria-label="Edit hotel"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(h)}
                          aria-label="Delete hotel"
                        >
                          <Trash2 className="size-3.5" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {editing ? "Edit hotel" : "New hotel"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details below. Changes go live immediately."
                : "Add a new hotel to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Hotel name" required>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="The Grand Marina"
                />
              </Field>
              <Field label="Destination" required>
                <Select
                  value={form.destinationId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, destinationId: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} · {d.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Star rating" required>
                <Select
                  value={form.starRating}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, starRating: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {"★".repeat(s)} ({s})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Price / night (USD)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.pricePerNight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pricePerNight: e.target.value }))
                  }
                  placeholder="320"
                />
              </Field>
              <Field label="Original price">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originalPrice: e.target.value }))
                  }
                  placeholder="399"
                />
              </Field>
              <Field label="Featured">
                <div className="flex h-9 items-center">
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, featured: v }))
                    }
                  />
                </div>
              </Field>
            </div>

            <Field label="Description" required>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="One-line summary."
              />
            </Field>

            <Field label="Long description">
              <Textarea
                value={form.longDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, longDescription: e.target.value }))
                }
                rows={4}
                placeholder="Rich, evocative copy about the property."
              />
            </Field>

            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Palm Jumeirah, Dubai, UAE"
              />
            </Field>

            <Field label="Images" hint="One URL per line">
              <Textarea
                value={form.images}
                onChange={(e) =>
                  setForm((f) => ({ ...f, images: e.target.value }))
                }
                rows={3}
                placeholder="https://…"
              />
            </Field>

            <Field label="Amenities" hint="One per line">
              <Textarea
                value={form.amenities}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amenities: e.target.value }))
                }
                rows={3}
                placeholder="Infinity pool&#10;Spa&#10;Private beach"
              />
            </Field>

            <Field
              label="Room types"
              hint="One per line: Name | Description | MaxGuests | PriceModifier"
            >
              <Textarea
                value={form.roomTypes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, roomTypes: e.target.value }))
                }
                rows={4}
                placeholder="Deluxe King | 45sqm sea-view king room | 2 | 0&#10;Suite | 80sqm suite with lounge | 4 | 150"
              />
            </Field>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {editing ? "Save changes" : "Create hotel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hotel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                “{deleteTarget?.name}”
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ===================================================================== */
/* Destinations                                                          */
/* ===================================================================== */

interface DestinationForm {
  name: string;
  country: string;
  city: string;
  region: string;
  description: string;
  longDescription: string;
  image: string;
  popular: boolean;
  featured: boolean;
}

function emptyDestinationForm(): DestinationForm {
  return {
    name: "",
    country: "",
    city: "",
    region: "",
    description: "",
    longDescription: "",
    image: "",
    popular: false,
    featured: false,
  };
}

function destinationToForm(d: DestinationT): DestinationForm {
  return {
    name: d.name,
    country: d.country,
    city: d.city ?? "",
    region: d.region ?? "",
    description: d.description,
    longDescription: d.longDescription ?? "",
    image: d.image,
    popular: d.popular,
    featured: d.featured,
  };
}

function destinationFormToPayload(f: DestinationForm) {
  return {
    name: f.name.trim(),
    country: f.country.trim(),
    city: f.city.trim() || null,
    region: f.region.trim() || null,
    description: f.description.trim(),
    longDescription: f.longDescription.trim() || null,
    image: f.image.trim(),
    popular: f.popular,
    featured: f.featured,
  };
}

function DestinationsManager() {
  const [items, setItems] = useState<DestinationT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DestinationT | null>(null);
  const [form, setForm] = useState<DestinationForm>(emptyDestinationForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DestinationT | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/destinations", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load destinations");
      const data = (await res.json()) as { destinations: DestinationT[] };
      setItems(data.destinations);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Could not load destinations", { description: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        (d.city ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyDestinationForm());
    setDialogOpen(true);
  };

  const openEdit = (d: DestinationT) => {
    setEditing(d);
    setForm(destinationToForm(d));
    setDialogOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.country.trim()) {
      toast.error("Country is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!form.image.trim()) {
      toast.error("Image URL is required");
      return;
    }
    setSaving(true);
    try {
      const payload = destinationFormToPayload(form);
      const url = editing
        ? `/api/admin/destinations/${editing.id}`
        : "/api/admin/destinations";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save destination");
      }
      toast.success(
        editing ? "Destination updated" : "Destination created",
        { description: form.name },
      );
      setDialogOpen(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Save failed", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/destinations/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Destination deleted", {
        description: deleteTarget.name,
      });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setDeleteError(msg);
      toast.error("Delete failed", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Destinations</CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${items.length} destinations live`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search destinations…"
                className="h-9 w-full pl-8 sm:w-56"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                className={cn("size-4", loading && "animate-spin")}
              />{" "}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Plus className="size-4" /> Add new
            </Button>
          </div>
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
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {items.length === 0
              ? "No destinations yet. Click “Add new” to create one."
              : "No destinations match your search."}
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Destination</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>City / Region</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-4 sm:pl-6">
                      <div className="flex items-center gap-3">
                        {d.image && (
                          <img
                            src={d.image}
                            alt={d.name}
                            className="size-9 shrink-0 rounded-md object-cover"
                          />
                        )}
                        <span className="font-medium text-foreground">
                          {d.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.country}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[d.city, d.region].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {d.popular && (
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary"
                          >
                            Popular
                          </Badge>
                        )}
                        {d.featured && (
                          <Badge
                            variant="outline"
                            className="border-gold/40 text-gold-foreground"
                          >
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(d)}
                          aria-label="Edit destination"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(d);
                          }}
                          aria-label="Delete destination"
                        >
                          <Trash2 className="size-3.5" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle
              className="text-xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {editing ? "Edit destination" : "New destination"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details below. Changes go live immediately."
                : "Add a new destination to the catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Santorini"
                />
              </Field>
              <Field label="Country" required>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  placeholder="Greece"
                />
              </Field>
              <Field label="City">
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="Fira"
                />
              </Field>
              <Field label="Region">
                <Input
                  value={form.region}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, region: e.target.value }))
                  }
                  placeholder="Cyclades"
                />
              </Field>
            </div>

            <Field label="Description" required>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="One-line summary."
              />
            </Field>

            <Field label="Long description">
              <Textarea
                value={form.longDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, longDescription: e.target.value }))
                }
                rows={4}
                placeholder="A vivid portrait of the destination."
              />
            </Field>

            <Field label="Image URL" required>
              <Input
                value={form.image}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image: e.target.value }))
                }
                placeholder="https://…"
              />
            </Field>

            <div className="flex flex-wrap gap-6 pt-2">
              <SwitchField
                label="Popular"
                description="Show in popular destinations"
                checked={form.popular}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, popular: v }))
                }
              />
              <SwitchField
                label="Featured"
                description="Highlight on the home page"
                checked={form.featured}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, featured: v }))
                }
              />
            </div>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={saving}>
                  <X className="size-4" /> Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {editing ? "Save changes" : "Create destination"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete destination?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                “{deleteTarget?.name}”
              </span>
              . If experiences or hotels are attached, they must be reassigned
              first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ===================================================================== */
/* Small form primitives                                                 */
/* ===================================================================== */

function Field({
  label,
  children,
  required,
  hint,
  right,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
          {hint && (
            <span className="ml-2 text-[11px] font-normal text-muted-foreground/70">
              {hint}
            </span>
          )}
        </Label>
        {right}
      </div>
      {children}
    </div>
  );
}

function SwitchField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}


