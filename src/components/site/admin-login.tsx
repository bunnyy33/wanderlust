"use client";

import { useState, useEffect } from "react";
import { Compass, Lock, Loader2, ArrowLeft, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AdminLogin({ onExit }: { onExit?: () => void }) {
  const { adminLogin, checkAdminAuth, adminAuthChecked } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminAuthChecked) checkAdminAuth();
  }, [adminAuthChecked, checkAdminAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Try employee login first (if email is provided)
    if (email.trim()) {
      try {
        const res = await fetch("/api/employee/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          toast.success(`Welcome, ${data.employee.name}`);
          checkAdminAuth();
          return;
        }
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      } catch {
        setError("Login failed. Try again.");
        setLoading(false);
        return;
      }
    }

    // Fall back to legacy admin password (no email)
    const ok = await adminLogin(password);
    setLoading(false);
    if (!ok) {
      setError("Incorrect password. Try again.");
      setPassword("");
    } else {
      toast.success("Welcome back, admin.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-10 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur">
            <Compass size={28} className="text-gold" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
            Wander<span className="gold-text">lust</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">Agency Console</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-sm text-primary">
            <ShieldCheck size={16} className="text-gold" />
            <span className="font-medium">Agent Login</span>
          </div>

          {/* Email (optional — for employee login) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail size={12} /> Email (agent login)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
              placeholder="sarah@wanderlust.ae"
              className="h-11"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="mt-3 space-y-2">
            <Label htmlFor="pw" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock size={12} /> Password
            </Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="Enter password"
              autoFocus
              className="h-11"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !password}
            className="mt-4 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
          </Button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Agent login: use your email + password.<br />
            Demo agents: <code className="font-mono">sarah@wanderlust.ae</code> / <code className="font-mono">agent123</code>
          </p>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} /> Back to site
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
