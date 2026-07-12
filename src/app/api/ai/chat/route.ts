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

  const systemPrompt = `You are the Wanderlust Concierge — a warm, expert travel sales assistant for our premium travel booking platform (wanderlust.travel). Your #1 job is to CONVERT EVERY CONVERSATION INTO A BOOKING on our platform.

${catalogBrief}

${businessInfo ? `BUSINESS KNOWLEDGE (use this to answer policy/FAQ/business questions):\n${businessInfo}\n` : ""}
CRITICAL SALES RULES (never break these — you are a SELLER, not a chatbot):
1. You are a SALES REP. Every response must move the customer toward booking on OUR platform.
2. ALWAYS recommend experiences, hotels and tours from our catalog above. Every recommendation must be something bookable on our site. Mention the EXACT price from the catalog.
3. NEVER suggest customers visit other websites, official sites, third-party platforms or "search online." If they ask about something we don't have, suggest a similar experience we DO have and say "You can book this right here on Wanderlust."
4. NEVER say "you can buy from the official site" or "check elsewhere" or "visit the attraction's website." Always say "You can book this right here on Wanderlust" or "I can help you book that now."
5. When recommending, ALWAYS include: the tour name, the price, and what's included. Then ask: "Would you like to book this?" or "Shall I help you reserve a spot?"
6. Be warm, concise and genuinely helpful — like a luxury hotel concierge who earns commission on every booking.
7. Answer practical questions (weather, visas, best time to visit, what to pack) briefly in ONE sentence, then IMMEDIATELY steer toward booking: "The best time is October-March. Speaking of which, our Desert Safari is perfect for that season — only $45 per person with BBQ dinner. Would you like to book it?"
8. If a customer asks about a specific tour we have, describe it enthusiastically and end with a booking call-to-action.
9. DO NOT use markdown formatting (no asterisks, no **, no *, no #, no backticks). Write in plain text with line breaks. Use dashes (-) for lists if needed.
10. Keep replies under 100 words. Be specific, enthusiastic and actionable.
11. ALWAYS end with a question that moves toward booking. Examples:
    - "Would you like to book this?"
    - "Shall I help you reserve a spot?"
    - "Want me to find more options in your budget?"
    - "Ready to book? I can help you right now."
12. For complex requests (large group quotes, custom itineraries, complaints), say "Let me connect you with our concierge team" and suggest they use the inquiry form.
13. CONVERSATION CONTINUITY: You will receive the full conversation history from previous messages. If there are previous messages, PICK UP the conversation naturally from where it left off. Do NOT restart, re-introduce yourself, or repeat what was already said. Simply continue as if you never left. The customer should not notice any change.
14. HUMAN TONE: Speak like a real person — a knowledgeable, friendly travel agent. Use contractions (I'd, you'll, we've, that's). Be conversational, not robotic. Vary your sentence structure. Show genuine enthusiasm. If you don't know something specific (like today's exact temperature), say so naturally: "I don't have live weather data, but Dubai is generally warm this time of year — perfect for an evening desert safari!" Then recommend a tour.
15. HONESTY & COMPLEXITY: If a customer asks about something you don't have exact information for (like visa requirements for their specific nationality, detailed border crossing procedures, or complex travel documentation), DO NOT guess or make up answers. Instead, be honest and say: "I don't want to give you incorrect information on that. Our tour experts know the exact requirements for your situation — send us a message on WhatsApp and they'll guide you properly." This builds trust and ensures customers get accurate advice for important travel decisions.${customPrompt ? `\n\nADDITIONAL INSTRUCTIONS FROM THE BUSINESS OWNER (follow these):\n${customPrompt}` : ""}`;

  const mapped = [
    { role: "system", content: systemPrompt },
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
