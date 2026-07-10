"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function InquiryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("General inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Send inquiry via email log (uses the mailer's sendEmail internally)
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
      toast.success("Inquiry sent! We'll get back to you within 24 hours.");
      setTimeout(() => {
        onOpenChange(false);
        setSent(false);
        setName(""); setEmail(""); setPhone(""); setMessage("");
        setSubject("General inquiry");
      }, 2500);
    } catch {
      toast.error("Could not send inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-[family-name:var(--font-display)]">
            <MessageSquare size={18} className="text-gold" /> Send us an inquiry
          </DialogTitle>
          <DialogDescription>
            Have a question about a tour, need a custom itinerary, or want a group quote?
            Fill this out and our concierge team will respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-semibold">Inquiry sent!</h3>
            <p className="mt-1 text-sm text-muted-foreground">We'll get back to you at {email} within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Your name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 50 123 4567" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Email *</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="jane@email.com" required />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General inquiry">General inquiry</SelectItem>
                  <SelectItem value="Custom itinerary request">Custom itinerary request</SelectItem>
                  <SelectItem value="Group booking quote">Group booking quote</SelectItem>
                  <SelectItem value="Hotel or transfer inquiry">Hotel or transfer inquiry</SelectItem>
                  <SelectItem value="Cancellation or refund">Cancellation or refund</SelectItem>
                  <SelectItem value="Partnership / vendor inquiry">Partnership / vendor inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your trip — dates, number of travelers, what you're interested in..."
                className="min-h-[100px] resize-none"
                required
                minLength={10}
              />
            </div>

            {/* Quick contact info */}
            <div className="flex flex-wrap gap-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail size={12} className="text-gold" /> concierge@wanderlust.travel</span>
              <span className="flex items-center gap-1"><Phone size={12} className="text-gold" /> +971 4 555 0199</span>
              <span className="flex items-center gap-1"><MapPin size={12} className="text-gold" /> 24/7 Concierge</span>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send inquiry</>}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
