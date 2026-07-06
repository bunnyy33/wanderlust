"use client";

import { useState } from "react";
import { Loader2, Sparkles, Crown, Heart, Mountain, Plane, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExperienceCard } from "./cards";
import { api } from "@/lib/api";
import type { ExperienceT } from "@/lib/types";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const VIBES = [
  { id: "luxury", label: "Luxury", icon: Crown },
  { id: "honeymoon", label: "Honeymoon", icon: Heart },
  { id: "adventure", label: "Adventure", icon: Mountain },
  { id: "family", label: "Family", icon: Plane },
  { id: "budget", label: "Budget", icon: Wallet },
];

export function RecommendationsSection() {
  const { openDetail } = useStore();
  const [vibe, setVibe] = useState("luxury");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<{ experience: ExperienceT; reason: string }[]>([]);

  const generate = async () => {
    setLoading(true);
    setRecs([]);
    try {
      const { recommendations } = await api.aiRecommendations({ vibe, travelers: 2 });
      setRecs(recommendations);
      if (recommendations.length === 0) toast.info("No matches — try another vibe.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Recommendation unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            <Sparkles size={14} /> Smart Picks
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
            What's your <span className="gold-text">travel vibe</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Pick a vibe and let our AI match you with the experiences you'll love most.
          </p>
        </div>

        <div className="mx-auto mb-8 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {VIBES.map((v) => (
            <button
              key={v.id}
              onClick={() => setVibe(v.id)}
              className={
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all " +
                (vibe === v.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border border-border bg-card text-foreground hover:border-primary/40")
              }
            >
              <v.icon size={16} /> {v.label}
            </button>
          ))}
        </div>

        <div className="mb-8 text-center">
          <Button
            onClick={generate}
            disabled={loading}
            size="lg"
            className="bg-gold text-[var(--gold-foreground)] hover:bg-gold/90"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Finding your matches…</>
            ) : (
              <><Sparkles size={18} /> Show me the best matches</>
            )}
          </Button>
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {recs.length > 0 && !loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recs.map(({ experience, reason }) => (
              <div key={experience.id} className="flex flex-col">
                <div className="mb-2 rounded-lg border border-gold/30 bg-gold/5 p-2.5">
                  <p className="text-xs text-foreground/80">
                    <Sparkles size={11} className="mr-1 inline text-gold" />
                    {reason}
                  </p>
                </div>
                <ExperienceCard experience={experience} onOpen={(id) => openDetail({ kind: "EXPERIENCE", id })} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
