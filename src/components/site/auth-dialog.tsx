"use client";

import { useState, useEffect } from "react";
import { Compass, Loader2, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AuthDialog() {
  const { authOpen, setAuthOpen, signup, login, user, checkUser, userChecked } = useStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!userChecked) checkUser(); }, [userChecked, checkUser]);
  useEffect(() => { if (user && authOpen) setAuthOpen(false); }, [user, authOpen, setAuthOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") { await signup(name, email, password); toast.success("Welcome to Wanderlust!"); }
      else { await login(email, password); toast.success("Welcome back!"); }
      setName(""); setEmail(""); setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={authOpen && !user} onOpenChange={setAuthOpen}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <DialogTitle className="sr-only">{mode === "login" ? "Sign in" : "Create account"}</DialogTitle>
        <div className="bg-primary px-6 py-7 text-center text-primary-foreground">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Compass size={24} className="text-gold" /></div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Wander<span className="gold-text">lust</span></h2>
          <p className="mt-1 text-sm text-primary-foreground/70">{mode === "login" ? "Welcome back, traveler" : "Join thousands of explorers"}</p>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <button type="button" onClick={() => setMode("login")} className={"rounded-md py-2 text-sm font-medium transition-colors " + (mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Sign in</button>
            <button type="button" onClick={() => setMode("signup")} className={"rounded-md py-2 text-sm font-medium transition-colors " + (mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Create account</button>
          </div>
          {mode === "signup" && (
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Full name</Label>
              <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="pl-9" required /></div>
            </div>
          )}
          <div><Label className="mb-1.5 block text-xs text-muted-foreground">Email</Label>
            <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@email.com" className="pl-9" required /></div>
          </div>
          <div><Label className="mb-1.5 block text-xs text-muted-foreground">Password</Label>
            <div className="relative"><Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="pl-9" required minLength={6} /></div>
            {mode === "signup" && <p className="mt-1 text-[11px] text-muted-foreground">At least 6 characters.</p>}
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16} /></>}
          </Button>
          <div className="flex items-center gap-2 rounded-lg bg-gold/5 p-3 text-xs text-muted-foreground"><Sparkles size={14} className="shrink-0 text-gold" /><span>Members get faster checkout, saved trips & exclusive deals.</span></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
