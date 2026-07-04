import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// AI Travel Chat Assistant
// POST /api/ai/chat { messages: [{role, content}], sessionId? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages } = body as { messages: { role: string; content: string }[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  // Fetch a compact catalog to ground answers
  const [experiences, hotels, destinations] = await Promise.all([
    db.experience.findMany({
      where: { status: "ACTIVE" },
      take: 30,
      orderBy: { bookedCount: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        duration: true,
        rating: true,
        destination: { select: { name: true } },
      },
    }),
    db.hotel.findMany({
      where: { status: "ACTIVE" },
      take: 15,
      orderBy: { rating: "desc" },
      select: {
        id: true,
        name: true,
        pricePerNight: true,
        starRating: true,
        destination: { select: { name: true } },
      },
    }),
    db.destination.findMany({ select: { name: true, country: true } }),
  ]);

  const catalogBrief = `Bookable destinations: ${destinations.map((d) => d.name).join(", ")}.
Top experiences: ${experiences.map((e) => `${e.title} (${e.destination?.name}, $${e.price}, ${e.duration})`).join("; ")}.
Top hotels: ${hotels.map((h) => `${h.name} (${h.destination?.name}, $${h.pricePerNight}/night, ${h.starRating}★)`).join("; ")}.`;

  const systemPrompt = `You are the Wanderlust AI Travel Assistant — a warm, knowledgeable concierge for a premium global travel booking platform.

${catalogBrief}

Guidelines:
- Help guests choose destinations, experiences, hotels, and transfers from the catalog above.
- Be concise, warm and genuinely helpful — like a luxury hotel concierge.
- When relevant, mention specific experiences/hotels with their prices.
- Answer practical questions: weather, visas, best time to visit, transport between cities, what to pack.
- If asked something outside travel, gently steer back to helping plan a trip.
- Keep replies under 150 words unless the user asks for detail. Use short paragraphs or bullets.`;

  // Map roles: treat anything not 'user' as assistant context
  const mapped = [
    { role: "assistant", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: mapped,
      thinking: { type: "disabled" },
    });
    const reply = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "AI assistant is unavailable. Please try again shortly." },
      { status: 502 }
    );
  }
}
