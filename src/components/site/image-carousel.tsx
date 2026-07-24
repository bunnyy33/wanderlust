"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ImageCarousel — a full-featured image slider with:
 * - Left/right arrow navigation
 * - Auto-advance (5s, pauses on hover)
 * - Smooth slide transition
 * - Dot indicators
 * - Thumbnail strip
 * - Play/pause toggle
 */
export function ImageCarousel({
  images,
  title,
  fallback,
}: {
  images: string[];
  title: string;
  fallback?: string;
}) {
  const imgs =
    images.length > 0
      ? images
      : fallback
        ? [fallback]
        : ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80"];
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [autoPlay, setAutoPlay] = useState(true);
  const [hovering, setHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (index: number) => {
      if (imgs.length <= 1) return;
      const next = ((index % imgs.length) + imgs.length) % imgs.length;
      setDirection(next > active ? 1 : -1);
      setActive(next);
    },
    [imgs.length, active],
  );

  const next = useCallback(() => {
    setDirection(1);
    setActive((prev) => (prev + 1) % imgs.length);
  }, [imgs.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((prev) => (prev - 1 + imgs.length) % imgs.length);
  }, [imgs.length]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || hovering || imgs.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, hovering, next, imgs.length]);

  // Keyboard navigation
  useEffect(() => {
    if (imgs.length <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, imgs.length]);

  if (imgs.length <= 1) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl sm:aspect-[2/1]">
        <Image
          src={imgs[0]}
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 1024px"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Main carousel */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-[2/1]">
        {/* Slides */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {imgs.map((img, i) => (
            <div key={i} className="relative h-full w-full shrink-0">
              <Image
                src={img}
                alt={`${title} — Image ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 1024px"
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Left arrow */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-foreground shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 dark:bg-black/60 dark:text-white dark:hover:bg-black/80"
          aria-label="Previous image"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* Right arrow */}
        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-foreground shadow-lg backdrop-blur transition-all hover:bg-white hover:scale-110 dark:bg-black/60 dark:text-white dark:hover:bg-black/80"
          aria-label="Next image"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Top-right: counter + play/pause */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {active + 1} / {imgs.length}
          </span>
          <button
            type="button"
            onClick={() => setAutoPlay((v) => !v)}
            className="grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-all hover:bg-black/80"
            aria-label={autoPlay ? "Pause slideshow" : "Play slideshow"}
          >
            {autoPlay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        </div>

        {/* Dots indicator */}
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {imgs.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/80",
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
        {imgs.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            className={cn(
              "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
              i === active
                ? "border-primary opacity-100"
                : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <Image
              src={img}
              alt={`${title} thumbnail ${i + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
