"use client";

import { useState, useEffect } from "react";
import { Compass, Lock, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AdminLogin({ onExit }: { onExit?: () => void }) {
  const { adminLogin, checkAdminAuth, adminAuthChecked } = useStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!adminAuthChecked) checkAdminAuth();
  }, [adminAuthChecked, checkAdminAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await adminLogin(password);
    setLoading(false);
    if (!ok) {
      toast.error("Incorrect password. Try again.");
      setPassword("");
    } else {
      toast.success("Welcome back, admin.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary px-4">
      {/* decorative */}
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
          <p className="mt-1 text-sm text-white/60">Admin Console</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-sm text-primary">
            <ShieldCheck size={16} className="text-gold" />
            <span className="font-medium">Secure admin access</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pw" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock size={12} /> Admin password
            </Label>
            <Input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !password}
            className="mt-4 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Unlock console"}
          </Button>

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

        <p className="mt-4 text-center text-xs text-white/40">
          Demo password: <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">wanderlust-admin-2024</code>
        </p>
      </div>
    </div>
  );
}
