"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { ExperienceCard, getRecent } from "./cards";
import { useStore } from "@/lib/store";
import type { ExperienceT } from "@/lib/types";

export function RecentlyViewed() {
  const { openDetail } = useStore();
  const [recent, setRecent] = useState<ExperienceT[]>([]);

  useEffect(() => {
    const load = () => setRecent(getRecent());
    load();
    window.addEventListener("recent-changed", load);
    return () => window.removeEventListener("recent-changed", load);
  }, []);

  if (recent.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Clock size={18} className="text-gold" />
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          Recently viewed
        </h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {recent.slice(0, 4).map((e) => (
          <ExperienceCard key={e.id} experience={e} onOpen={(id) => openDetail({ kind: "EXPERIENCE", id })} />
        ))}
      </div>
    </section>
  );
}
