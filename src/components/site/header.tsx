"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Heart,
  User,
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  Shield,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Destinations", target: "destinations" },
  { label: "Experiences", target: "experiences" },
  { label: "Hotels", target: "hotels" },
  { label: "AI Planner", target: "planner" },
];

export function Header({ onSearchClick }: { onSearchClick?: () => void }) {
  const {
    view,
    setView,
    setWishlistOpen,
    setAccountOpen,
    theme,
    toggleTheme,
  } = useStore();
  const wishlistCount = useStore((s) => s.wishlist.length);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "glass border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => {
            setView("guest");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Compass size={20} className="text-gold" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-foreground">
            Wander<span className="gold-text">lust</span>
          </span>
        </button>

        {/* Desktop nav */}
        {view === "guest" && (
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => scrollTo(n.target)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </button>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {view === "guest" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="hidden sm:inline-flex"
              aria-label="Search"
            >
              <Search size={18} />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          {view === "guest" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollTo("planner")}
                aria-label="AI Planner"
                className="hidden sm:inline-flex"
              >
                <Sparkles size={18} className="text-gold" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWishlistOpen(true)}
                className="relative"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-[var(--gold-foreground)]">
                    {wishlistCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAccountOpen(true)}
                aria-label="Account"
                className="hidden sm:inline-flex"
              >
                <User size={18} />
              </Button>
            </>
          )}

          {/* Admin toggle */}
          <Button
            variant={view === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setView(view === "admin" ? "guest" : "admin")}
            className="hidden gap-1.5 sm:inline-flex"
          >
            <Shield size={15} />
            {view === "admin" ? "Exit Admin" : "Admin"}
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="font-[family-name:var(--font-display)]">
                  Wander<span className="gold-text">lust</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {view === "guest" &&
                  NAV.map((n) => (
                    <button
                      key={n.target}
                      onClick={() => scrollTo(n.target)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                    >
                      {n.label}
                    </button>
                  ))}
                <button
                  onClick={() => scrollTo("planner")}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <Sparkles size={16} className="text-gold" /> AI Trip Planner
                </button>
                <button
                  onClick={() => {
                    setAccountOpen(true);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <User size={16} /> My Bookings
                </button>
                <button
                  onClick={() => {
                    setWishlistOpen(true);
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <Heart size={16} /> Wishlist
                  {wishlistCount > 0 && (
                    <Badge className="ml-auto bg-gold text-[var(--gold-foreground)]">
                      {wishlistCount}
                    </Badge>
                  )}
                </button>
                <div className="my-2 h-px bg-border" />
                <Button
                  variant={view === "admin" ? "default" : "outline"}
                  onClick={() => {
                    setView(view === "admin" ? "guest" : "admin");
                    setMobileOpen(false);
                  }}
                  className="m-3 gap-1.5"
                >
                  <Shield size={15} />
                  {view === "admin" ? "Exit Admin" : "Admin Console"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
