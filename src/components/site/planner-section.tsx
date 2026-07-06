"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, Calendar, DollarSign, Users, MapPin, Lightbulb, Sun, Sunset, Moon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { ItineraryPlan, DestinationT } from "@/lib/types";
import { toast } from "sonner";

const EXAMPLES = [
  "I have $2,000 for 7 days in Dubai with my family — mix of adventure and culture",
  "Romantic 5-day Santorini honeymoon under $3,000",
  "Budget 4 days in Bali for two — rice terraces, temples and beach",
  "Luxury long weekend in the Maldives, all-inclusive",
];

export function PlannerSection({ destinations }: { destinations: DestinationT[] }) {
  const [prompt, setPrompt] = useState("");
  const [destination, setDestination] = useState("any");
  const [budget, setBudget] = useState("2000");
  const [days, setDays] = useState("5");
  const [travelers, setTravelers] = useState("2");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);

  const generate = async () => {
    const finalPrompt =
      prompt.trim() ||
      `Plan a ${days}-day trip for ${travelers} travelers${destination !== "any" ? ` to ${destination}` : ""} within a budget of $${budget}.`;
    setLoading(true);
    setPlan(null);
    try {
      const { plan: p } = await api.aiItinerary({
        prompt: finalPrompt,
        budget: Number(budget) || undefined,
        days: Number(days) || undefined,
        travelers: Number(travelers) || undefined,
        destination: destination !== "any" ? destination : undefined,
      });
      setPlan(p);
      setTimeout(() => {
        document.getElementById("itinerary-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="planner" className="relative overflow-hidden bg-gradient-to-b from-background to-muted/40 py-20">
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            <Sparkles size={14} /> Trip Planner
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-5xl">
            Tell us your dream trip.
            <br />
            <span className="gold-text">We'll plan every moment.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Just describe what you want — budget, dates, vibe, who's coming — and our AI
            concierge crafts a detailed day-by-day itinerary with real, bookable experiences.
          </p>
        </div>

        {/* Input card */}
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <Label className="text-sm font-medium">Describe your perfect trip</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I have $2,000 for 7 days in Dubai with my family. We love adventure, culture and good food."
            className="mt-2 min-h-[100px] resize-none"
          />

          {/* Quick examples */}
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {ex.length > 50 ? ex.slice(0, 50) + "…" : ex}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={12} /> Destination
              </Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Surprise me</SelectItem>
                  {destinations.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign size={12} /> Budget (USD)
              </Label>
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0" className="mt-1.5" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={12} /> Days
              </Label>
              <Input value={days} onChange={(e) => setDays(e.target.value)} type="number" min="1" max="30" className="mt-1.5" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users size={12} /> Travelers
              </Label>
              <Input value={travelers} onChange={(e) => setTravelers(e.target.value)} type="number" min="1" max="20" className="mt-1.5" />
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={loading}
            size="lg"
            className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Crafting your itinerary…</>
            ) : (
              <><Wand2 size={18} /> Generate my itinerary</>
            )}
          </Button>
        </div>

        {/* Result */}
        {loading && (
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {plan && !loading && (
          <div id="itinerary-result" className="mx-auto mt-10 max-w-5xl scroll-mt-20">
            <ItineraryResult plan={plan} />
          </div>
        )}
      </div>
    </section>
  );
}

function ItineraryResult({ plan }: { plan: ItineraryPlan }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-gold text-[var(--gold-foreground)] hover:bg-gold">
              <Sparkles size={12} className="mr-1" /> AI-generated itinerary
            </Badge>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
              {plan.destination}
            </h3>
            <p className="mt-2 max-w-2xl text-muted-foreground">{plan.summary}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/50 p-4 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Est. total</div>
            <div className="font-[family-name:var(--font-display)] text-3xl font-bold gold-text">
              ${plan.totalEstimatedCost?.toLocaleString() ?? "—"}
            </div>
            {plan.withinBudget !== undefined && (
              <Badge variant={plan.withinBudget ? "default" : "destructive"} className="mt-2">
                {plan.withinBudget ? "Within budget" : "Over budget"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Day-by-day */}
      <div className="space-y-4">
        {plan.days?.map((day) => (
          <div key={day.day} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-[family-name:var(--font-display)] text-sm font-bold text-primary-foreground">
                  {day.day}
                </span>
                <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  Day {day.day}: {day.title}
                </h4>
              </div>
              <span className="text-sm font-medium text-gold">~${day.estimatedCost?.toLocaleString() ?? 0}</span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <DayPart icon={<Sun size={15} className="text-amber-500" />} label="Morning" text={day.morning} />
              <DayPart icon={<Sunset size={15} className="text-orange-500" />} label="Afternoon" text={day.afternoon} />
              <DayPart icon={<Moon size={15} className="text-indigo-500" />} label="Evening" text={day.evening} />
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {plan.recommendations && (
        <div className="grid gap-4 lg:grid-cols-2">
          <RecCard title="Recommended stays" items={plan.recommendations.hotels} />
          <RecCard title="Must-do experiences" items={plan.recommendations.experiences} />
          <RecCard title="Transfers & logistics" items={plan.recommendations.transfers} />
          <RecCard title="Pro tips" items={plan.recommendations.tips} icon={<Lightbulb size={16} className="text-gold" />} />
        </div>
      )}

      {/* Insider tips */}
      {plan.insiderTips?.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <h4 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-semibold">
            <Lightbulb size={18} className="text-gold" /> Insider tips from your concierge
          </h4>
          <ul className="mt-3 space-y-2">
            {plan.insiderTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center">
        <Button
          size="lg"
          className="bg-gold text-[var(--gold-foreground)] hover:bg-gold/90"
          onClick={() => document.getElementById("experiences")?.scrollIntoView({ behavior: "smooth" })}
        >
          Browse & book these experiences →
        </Button>
      </div>
    </div>
  );
}

function DayPart({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">{text}</p>
    </div>
  );
}

function RecCard({
  title,
  items,
  icon,
}: {
  title: string;
  items?: string[];
  icon?: React.ReactNode;
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h5 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-display)] font-semibold">
        {icon} {title}
      </h5>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
