"use client";

import { useState, useEffect } from "react";
import { CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormatPrice } from "@/lib/use-currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CardModalProps {
  open: boolean;
  amount: number;
  reference?: string;
  onPaid: () => void;
  onCancel: () => void;
}

function detectBrand(num: string): string {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6/.test(n)) return "Discover";
  return "";
}

function luhnValid(num: string): boolean {
  const n = num.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(n)) return false;
  let sum = 0, dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function PaymentCardModal({ open, amount, reference, onPaid, onCancel }: CardModalProps) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const fmt = useFormatPrice();

  useEffect(() => {
    if (!open) {
      setNumber(""); setName(""); setExp(""); setCvc(""); setProcessing(false);
    }
  }, [open]);

  const brand = detectBrand(number);
  const numValid = luhnValid(number);
  const expValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp);
  const cvcValid = /^\d{3,4}$/.test(cvc);
  const nameValid = name.trim().length > 1;
  const formValid = numValid && expValid && cvcValid && nameValid;

  const formatNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  const pay = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reference,
          card: {
            number: number.replace(/\s/g, ""),
            name,
            expMonth: Number(exp.split("/")[0]),
            expYear: Number("20" + exp.split("/")[1]),
            cvc,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.paid) {
        throw new Error(data.error || "Payment failed");
      }
      toast.success(data.mode === "stripe" ? "Payment charged successfully" : "Payment processed successfully");
      onPaid();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="relative bg-gradient-to-br from-primary to-[oklch(0.28_0.05_195)] p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary-foreground/70"><Lock size={12} /> Secure payment</div>
            <div className="text-right text-sm font-semibold">{brand || "Card"}</div>
          </div>
          <div className="mt-6 font-mono text-lg tracking-wider">{number || "•••• •••• •••• ••••"}</div>
          <div className="mt-4 flex items-end justify-between text-xs">
            <div><div className="text-[10px] uppercase text-primary-foreground/60">Cardholder</div><div className="font-medium uppercase">{name || "YOUR NAME"}</div></div>
            <div><div className="text-[10px] uppercase text-primary-foreground/60">Expires</div><div className="font-medium">{exp || "MM/YY"}</div></div>
          </div>
          <div className="absolute right-6 top-6 h-7 w-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-80" />
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">Pay {fmt(amount)}</h3>
            {reference && <span className="font-mono text-xs text-muted-foreground">{reference}</span>}
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Card number</Label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={number} onChange={(e) => setNumber(formatNumber(e.target.value))} placeholder="Card number" className={cn("pl-9", number && !numValid && "border-rose-400", numValid && "border-emerald-400")} inputMode="numeric" />
              {numValid && <CheckCircle2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Cardholder name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="JANE DOE" className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">Expiry</Label><Input value={exp} onChange={(e) => setExp(formatExp(e.target.value))} placeholder="MM/YY" className={cn(exp && !expValid && "border-rose-400", expValid && "border-emerald-400")} inputMode="numeric" /></div>
            <div><Label className="mb-1.5 block text-xs text-muted-foreground">CVC</Label><Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className={cn(cvc && !cvcValid && "border-rose-400", cvcValid && "border-emerald-400")} inputMode="numeric" /></div>
          </div>
          <Button onClick={pay} disabled={!formValid || processing} className="h-11 w-full bg-gold text-[var(--gold-foreground)] hover:bg-gold/90">
            {processing ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <><Lock size={15} /> Pay {fmt(amount)}</>}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck size={13} className="text-emerald-500" /> 256-bit SSL secure payment</div>
          <button onClick={onCancel} disabled={processing} className="block w-full text-center text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      </div>
    </div>
  );
}
