"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

type View = "guest" | "admin";
type DetailTarget = { kind: "EXPERIENCE" | "HOTEL"; id: string } | null;
type WishKey = string; // "EXPERIENCE:id" | "HOTEL:id"

interface UIState {
  view: View;
  detail: DetailTarget;
  wishlistOpen: boolean;
  accountOpen: boolean;
  plannerOpen: boolean;
  chatOpen: boolean;
  theme: "light" | "dark";
  sessionId: string;
  wishlist: WishKey[];
  wishlistLoaded: boolean;
  adminAuthed: boolean;
  adminAuthChecked: boolean;
  currency: string;
  user: { id: string; email: string; name: string; phone?: string | null } | null;
  userChecked: boolean;
  setView: (v: View) => void;
  openDetail: (target: DetailTarget) => void;
  closeDetail: () => void;
  setWishlistOpen: (o: boolean) => void;
  setAccountOpen: (o: boolean) => void;
  setPlannerOpen: (o: boolean) => void;
  setChatOpen: (o: boolean) => void;
  toggleTheme: () => void;
  loadWishlist: () => Promise<void>;
  toggleWish: (kind: "EXPERIENCE" | "HOTEL", id: string) => Promise<boolean>;
  hasWish: (kind: "EXPERIENCE" | "HOTEL", id: string) => boolean;
  checkAdminAuth: () => Promise<void>;
  adminLogin: (password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  setCurrency: (c: string) => void;
  checkUser: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setAuthOpen: (o: boolean) => void;
  authOpen: boolean;
}

function genSession() {
  return "wl-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useStore = create<UIState>()(
  persist(
    (set, get) => ({
      view: "guest",
      detail: null,
      wishlistOpen: false,
      accountOpen: false,
      plannerOpen: false,
      chatOpen: false,
      theme: "light",
      sessionId: genSession(),
      wishlist: [],
      wishlistLoaded: false,
      adminAuthed: false,
      adminAuthChecked: false,
      currency: "USD",
      user: null,
      userChecked: false,
      authOpen: false,
      setView: (v) => set({ view: v }),
      openDetail: (target) => set({ detail: target }),
      closeDetail: () => set({ detail: null }),
      setWishlistOpen: (o) => set({ wishlistOpen: o }),
      setAccountOpen: (o) => set({ accountOpen: o }),
      setPlannerOpen: (o) => set({ plannerOpen: o }),
      setChatOpen: (o) => set({ chatOpen: o }),
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),
      loadWishlist: async () => {
        const sid = get().sessionId;
        try {
          const { items } = await api.wishlist(sid);
          set({
            wishlist: items.map((i) => `${i.kind}:${i.id}`),
            wishlistLoaded: true,
          });
        } catch {
          set({ wishlistLoaded: true });
        }
      },
      toggleWish: async (kind, id) => {
        const sid = get().sessionId;
        const key = `${kind}:${id}`;
        try {
          const payload =
            kind === "EXPERIENCE"
              ? { sessionId: sid, experienceId: id }
              : { sessionId: sid, hotelId: id };
          const { action } = await api.toggleWishlist(payload);
          set((s) => ({
            wishlist:
              action === "added"
                ? Array.from(new Set([...s.wishlist, key]))
                : s.wishlist.filter((k) => k !== key),
          }));
          return action === "added";
        } catch {
          return false;
        }
      },
      hasWish: (kind, id) => get().wishlist.includes(`${kind}:${id}`),
      checkAdminAuth: async () => {
        try {
          const res = await fetch("/api/admin/auth");
          const data = await res.json();
          set({ adminAuthed: !!data.authed, adminAuthChecked: true });
        } catch {
          set({ adminAuthed: false, adminAuthChecked: true });
        }
      },
      adminLogin: async (password) => {
        try {
          const res = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({ adminAuthed: !!data.authed });
          return !!data.authed;
        } catch {
          return false;
        }
      },
      adminLogout: async () => {
        try {
          await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "logout" }),
          });
        } catch {
          /* ignore */
        }
        set({ adminAuthed: false });
      },
      setCurrency: (c) => set({ currency: c }),
      checkUser: async () => {
        try {
          const res = await fetch("/api/auth");
          const data = await res.json();
          set({ user: data.user || null, userChecked: true });
        } catch {
          set({ user: null, userChecked: true });
        }
      },
      signup: async (name, email, password) => {
        try {
          const res = await fetch("/api/auth", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "signup", name, email, password }),
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Signup failed"); }
          const data = await res.json();
          set({ user: data.user });
          return true;
        } catch (e) { throw e; }
      },
      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "login", email, password }),
          });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Login failed"); }
          const data = await res.json();
          set({ user: data.user });
          return true;
        } catch (e) { throw e; }
      },
      logout: async () => {
        try {
          await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
        } catch { /* ignore */ }
        set({ user: null });
      },
      setAuthOpen: (o) => set({ authOpen: o }),
    }),
    {
      name: "wanderlust-ui",
      partialize: (s) => ({
        sessionId: s.sessionId,
        theme: s.theme,
      }),
    }
  )
);

// Selector helper for components
export function useWishlistCount() {
  return useStore((s) => s.wishlist.length);
}
