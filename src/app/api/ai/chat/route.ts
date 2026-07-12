import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp, getClientUserAgent } from "@/lib/fraud";
import { rateLimit } from "@/lib/rate-limit";

// AI Travel Chat Assistant — sales-focused concierge
// POST /api/ai/chat { messages: [{role, content}], sessionId }
export async function POST(req: NextRequest) {
  // Rate limit: 15 messages per minute per IP
  const ip = getClientIp(req) || "unknown";
  const limit = rateLimit(`chat:${ip}`, 15, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  const body = await req.json();
  const { messages, sessionId } = body as {
    messages: { role: string; content: string }[];
    sessionId?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  // Fetch catalog + AI settings to ground answers
  const [experiences, hotels, destinations, aiSettings] = await Promise.all([
    db.experience.findMany({
      where: { status: "ACTIVE" },
      take: 40,
      orderBy: { bookedCount: "desc" },
      select: {
        id: true, title: true, type: true, price: true,
        duration: true, rating: true, slug: true,
        destination: { select: { name: true } },
      },
    }),
    db.hotel.findMany({
      where: { status: "ACTIVE" },
      take: 15,
      orderBy: { rating: "desc" },
      select: { id: true, name: true, pricePerNight: true, starRating: true, slug: true, destination: { select: { name: true } } },
    }),
    db.destination.findMany({ select: { name: true, country: true } }),
    db.aiSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const catalogBrief = `Bookable destinations on our platform: ${destinations.map((d) => d.name).join(", ")}.
Popular experiences (all bookable on our site): ${experiences.map((e) => `${e.title} in ${e.destination?.name} ($${e.price}, ${e.duration}, ${e.rating}★)`).join("; ")}.
Popular hotels (all bookable on our site): ${hotels.map((h) => `${h.name} in ${h.destination?.name} ($${h.pricePerNight}/night, ${h.starRating}★)`).join("; ")}.`;

  // Build the system prompt — base rules + admin custom knowledge
  const customPrompt = aiSettings?.systemPrompt?.trim();
  const businessInfo = aiSettings?.businessInfo?.trim();

  const systemPrompt = `You are the Wanderlust Concierge — a warm, expert travel assistant for our premium travel booking platform. Your #1 job is to HELP CUSTOMERS BOOK EXPERIENCES, HOTELS AND TOURS ON OUR PLATFORM.

${catalogBrief}

${businessInfo ? `BUSINESS KNOWLEDGE (use this to answer policy/FAQ/business questions):\n${businessInfo}\n` : ""}
CRITICAL RULES (never break these):
1. ALWAYS recommend experiences, hotels and tours from our catalog above. Every recommendation must be something bookable on our site.
2. NEVER suggest customers visit other websites, official sites, third-party platforms or "search online." If they ask about something we don't have, suggest a similar experience we DO have.
3. NEVER say "you can buy from the official site" or "check elsewhere." Always say "You can book this right here on Wanderlust" or "I can help you book that now."
4. When recommending, mention the price and encourage booking: "The [title] is $X per person — would you like to book it?"
5. Be warm, concise and genuinely helpful — like a luxury hotel concierge who wants you to have the best experience.
6. Answer practical questions (weather, visas, best time to visit, what to pack) briefly, then steer toward booking.
7. If asked about something outside travel, gently bring it back to trip planning.
8. DO NOT use markdown formatting (no asterisks, no **, no *, no #, no backticks). Write in plain text with line breaks. Use dashes (-) for lists if needed.
9. Keep replies under 120 words. Be specific and actionable.
10. If a customer seems interested, always end with a gentle call-to-action: "Would you like me to help you book this?" or "Shall I add this to your cart?"
11. For complex requests (large group quotes, custom itineraries, complaints), say "Let me connect you with our concierge team" and suggest they use the inquiry form.${customPrompt ? `\n\nADDITIONAL INSTRUCTIONS FROM THE BUSINESS OWNER (follow these):\n${customPrompt}` : ""}`;

  const mapped = [
    { role: "assistant", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  try {
    const { aiChat } = await import("@/lib/ai-client");
    let reply = await aiChat(mapped);

    // Strip any markdown that slipped through
    reply = reply
      .replace(/\*\*(.*?)\*\*/g, "$1") // **bold**
      .replace(/\*(.*?)\*/g, "$1")     // *italic*
      .replace(/__(.*?)__/g, "$1")     // __underline__
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // `code`
      .replace(/^#{1,6}\s+/gm, "")     // # headings
      .replace(/^\s*[-•]\s+/gm, "- ")  // normalize bullets
      .trim();

    // Log the conversation for admin monitoring
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage && sessionId) {
      try {
        await db.chatLog.create({
          data: {
            sessionId,
            userMessage: lastUserMessage.content,
            aiReply: reply,
            ipAddress: getClientIp(req),
            userAgent: getClientUserAgent(req),
          },
        });
      } catch (e) {
        console.error("Chat log error:", e);
      }
    }

    return NextResponse.json({ reply });
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error("AI chat error:", errMsg);
    return NextResponse.json(
      { error: errMsg },
      { status: 502 }
    );
  }
}
