"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Can I visit Abu Dhabi after Dubai?",
  "Best time to visit the Maldives?",
  "Family-friendly experiences in Bali",
  "What's the weather like in Santorini in October?",
];

export function AIChat() {
  const { chatOpen, setChatOpen, sessionId } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your Wanderlust AI concierge ✨ Ask me anything about destinations, experiences, hotels, weather, or travel tips. How can I help plan your trip?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await api.aiChat(next.slice(-8), sessionId);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        aria-label="AI Assistant"
      >
        {chatOpen ? <X size={20} /> : <><Sparkles size={20} className="text-gold" /><span className="hidden text-sm font-semibold sm:inline">AI Concierge</span></>}
        {!chatOpen && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </span>
        )}
      </button>

      {/* Panel */}
      {chatOpen && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[560px] max-h-[80vh] w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Bot size={18} className="text-gold" />
            </span>
            <div>
              <div className="font-[family-name:var(--font-display)] font-semibold">Wanderlust Concierge</div>
              <div className="flex items-center gap-1 text-xs text-primary-foreground/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online · AI-powered
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="ml-auto rounded-full p-1.5 hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
            {messages.map((m, i) => (
              <div key={i} className={"flex gap-2 " + (m.role === "user" ? "flex-row-reverse" : "")}>
                <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-full " + (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gold/20 text-gold")}>
                  {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </span>
                <div className={"max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm " + (m.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card border border-border")}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold"><Bot size={14} /></span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border bg-card px-3 py-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 border-t border-border bg-card p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything about your trip..."
              className="flex-1"
            />
            <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
