"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Heart,
  User,
  Menu,
  X,
  Sparkles,
  Moon,
  Sun,
  Search,
  ShoppingCart,
  MessageSquare,
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
import { CurrencySwitcher } from "./currency-switcher";

const NAV = [
  { label: "Destinations", target: "destinations" },
  { label: "Experiences", target: "experiences" },
  { label: "Hotels", target: "hotels" },
  { label: "AI Planner", target: "planner" },
];

export function Header({ onSearchClick }: { onSearchClick?: () => void }) {
  const router = useRouter();
  const {
    setWishlistOpen,
    setAccountOpen,
    setAuthOpen,
    setInquiryOpen,
    setCartOpen,
    theme,
    toggleTheme,
  } = useStore();
  const wishlistCount = useStore((s) => s.wishlist.length);
  const cartCount = useStore((s) => s.cart.length);
  const user = useStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigate to homepage section (works from any page)
  const goToSection = (id: string) => {
    setMobileOpen(false);
    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goHome = () => {
    if (window.location.pathname !== "/") {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          onClick={goHome}
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
        {(
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => goToSection(n.target)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </button>
            ))}
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {(
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

          {(
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => goToSection("planner")}
                aria-label="AI Planner"
                className="hidden sm:inline-flex"
              >
                <Sparkles size={18} className="text-gold" />
              </Button>

              <div className="hidden sm:block">
                <CurrencySwitcher />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInquiryOpen(true)}
                className="hidden md:inline-flex"
              >
                <MessageSquare size={16} /> Inquire
              </Button>

              {user ? (
                <button
                  onClick={() => setAccountOpen(true)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
                  aria-label="My account"
                  title={`${user.name} · ${user.email}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAuthOpen(true)}
                  className="hidden sm:inline-flex"
                >
                  <User size={16} /> Sign in
                </Button>
              )}
            </>
          )}

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
                {NAV.map((n) => (
                    <button
                      key={n.target}
                      onClick={() => goToSection(n.target)}
                      className="rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                    >
                      {n.label}
                    </button>
                  ))}
                <button
                  onClick={() => goToSection("planner")}
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
                <button
                  onClick={() => { setCartOpen(true); setMobileOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <ShoppingCart size={16} /> Cart
                  {cartCount > 0 && (
                    <Badge className="ml-auto bg-primary text-primary-foreground">{cartCount}</Badge>
                  )}
                </button>
                <button
                  onClick={() => { setInquiryOpen(true); setMobileOpen(false); }}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium hover:bg-accent"
                >
                  <MessageSquare size={16} /> Send Inquiry
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
